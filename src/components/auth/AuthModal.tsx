import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, ShieldAlert, KeyRound, Mail, User as UserIcon, 
  Lock, CheckCircle2, AlertCircle, Sparkles, Eye, EyeOff, 
  Terminal, Flame, ArrowRight, Check, Zap 
} from 'lucide-react';
import { api, setAuthToken, ApiError } from '../../services/api';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: User) => void;
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  canClose = false 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Field-level client validation errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; username?: boolean }>({});

  // Anti-Brute Force Lockout Countdown
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (lockoutSeconds !== null && lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutSeconds]);

  if (!isOpen) return null;

  // Validação em tempo real dos campos
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string; username?: string } = {};

    // Validação de E-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'O endereço de e-mail é obrigatório.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Por favor, insira um formato de e-mail válido (ex: nome@dominio.com).';
    }

    // Validação de Senha
    if (!password) {
      errors.password = 'A senha criptográfica é obrigatória.';
    } else if (mode === 'register') {
      if (password.length < 8) {
        errors.password = 'A senha deve conter no mínimo 8 caracteres.';
      } else if (!/[A-Z]/.test(password)) {
        errors.password = 'A senha deve conter pelo menos uma letra maiúscula.';
      } else if (!/[0-9]/.test(password)) {
        errors.password = 'A senha deve conter pelo menos um número.';
      }
    }

    // Validação de Nome de Usuário (apenas no registro)
    if (mode === 'register') {
      if (!username.trim()) {
        errors.username = 'O identificador de usuário é obrigatório.';
      } else if (username.trim().length < 2) {
        errors.username = 'O nome de usuário deve conter pelo menos 2 caracteres.';
      } else if (username.trim().length > 32) {
        errors.username = 'O nome de usuário não pode exceder 32 caracteres.';
      } else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
        errors.username = 'O nome só pode conter letras, números, traços e underscores.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Cálculo da Força da Senha para Cadastro (Entropy & Rules)
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Vazia', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Fraca', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 3) return { score: 2, label: 'Média', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 4) return { score: 3, label: 'Forte', color: 'bg-emerald-500', text: 'text-emerald-400' };
    return { score: 4, label: 'Excelente (Blindada)', color: 'bg-cyan-400', text: 'text-cyan-300' };
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds !== null && lockoutSeconds > 0) return;

    setTouched({ email: true, password: true, username: true });

    // Client-side validation guard
    if (!validateForm()) {
      setError('Por favor, corrija os erros nos campos antes de prosseguir.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setRemainingAttempts(null);

    try {
      if (mode === 'login') {
        const res = await api.login(email.trim(), password);
        setAuthToken(res.token);
        onSuccess(res.user);
        onClose?.();
      } else {
        const res = await api.register(username.trim(), email.trim(), password);
        setAuthToken(res.token);
        onSuccess(res.user);
        onClose?.();
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorDetails(err.details || (err.issues ? err.issues.join(', ') : null));
        
        if (typeof (err as any).remainingAttempts === 'number') {
          setRemainingAttempts((err as any).remainingAttempts);
        }

        // Verifica se a API retornou bloqueio ativo ou retryAfter
        if (err.status === 429) {
          const waitTime = (err as any).retryAfter || 300;
          setLockoutSeconds(waitTime);
        }
      } else {
        setError('Ocorreu um erro ao processar a autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setFieldErrors({});
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setRemainingAttempts(null);

    try {
      const res = await api.login(quickEmail, quickPass);
      setAuthToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorDetails(err.details || null);
        if (err.status === 429) {
          setLockoutSeconds((err as any).retryAfter || 300);
        }
      } else {
        setError('Erro no login rápido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Background Cyber Glowing Orbs */}
      <div className="absolute w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -top-20 -left-20 animate-pulse" />
      <div className="absolute w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20 animate-pulse" />

      <div 
        id="auth-modal-card"
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Security Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500" />

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center relative">
          {canClose && onClose && (
            <button
              onClick={onClose}
              id="btn-close-auth-modal"
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 mx-auto flex items-center justify-center mb-3.5 shadow-lg shadow-cyan-500/25 border border-cyan-300/30">
            <Zap className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            {mode === 'login' ? 'Bem-vindo ao Discord Quantum' : 'Criar Sua Conta no Discord Quantum'}
          </h2>
          
          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-cyan-300/80 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Chat em Tempo Real & WebRTC Criptografado</span>
          </div>

          {/* Tabs Selector */}
          <div className="mt-6 p-1 bg-slate-950/70 border border-slate-800 rounded-xl flex">
            <button
              type="button"
              id="tab-auth-login"
              onClick={() => {
                setMode('login');
                setError(null);
                setErrorDetails(null);
                setFieldErrors({});
                setRemainingAttempts(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entrar com Credenciais
            </button>
            <button
              type="button"
              id="tab-auth-register"
              onClick={() => {
                setMode('register');
                setError(null);
                setErrorDetails(null);
                setFieldErrors({});
                setRemainingAttempts(null);
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-8 pb-8 pt-2">
          {/* Lockout Warning Banner */}
          {lockoutSeconds !== null && lockoutSeconds > 0 && (
            <div className="mb-5 bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 text-xs text-rose-300 flex items-start gap-3 backdrop-blur-md animate-pulse">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-200">Defesa Ativa: Bloqueio Temporário</p>
                <p className="mt-1 text-rose-300/90 leading-relaxed">
                  Limite de tentativas incorretas excedido. Proteção anti-força bruta acionada.
                </p>
                <div className="mt-2 font-mono text-sm text-rose-200 font-bold bg-rose-900/60 px-2.5 py-1 rounded-lg inline-block border border-rose-700/50">
                  Desbloqueio em: {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s
                </div>
              </div>
            </div>
          )}

          {/* Remaining Attempts Banner */}
          {remainingAttempts !== null && remainingAttempts > 0 && (!lockoutSeconds || lockoutSeconds <= 0) && (
            <div className="mb-4 bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2.5 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold">Aviso de Segurança</p>
                <p className="mt-0.5 text-amber-200/90">
                  Tentativas restantes antes do bloqueio por 5 minutos: <strong>{remainingAttempts}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Regular Error Notification */}
          {error && (!lockoutSeconds || lockoutSeconds <= 0) && (
            <div className="mb-4 bg-rose-950/30 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2.5 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold">{error}</p>
                {errorDetails && <p className="mt-0.5 text-rose-200/80">{errorDetails}</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Identificador de Usuário <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-auth-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (touched.username) {
                        setFieldErrors((prev) => ({ ...prev, username: undefined }));
                      }
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                    placeholder="ex: CyberArchitect"
                    className={`w-full bg-slate-950/60 text-white text-sm rounded-xl px-3.5 py-2.5 pl-10 focus:outline-none transition-all placeholder:text-slate-600 border ${
                      fieldErrors.username && touched.username
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-800 focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/60'
                    }`}
                  />
                  <UserIcon className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
                </div>
                {fieldErrors.username && touched.username && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors.username}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Endereço de E-mail <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  placeholder="usuario@dominio.com"
                  className={`w-full bg-slate-950/60 text-white text-sm rounded-xl px-3.5 py-2.5 pl-10 focus:outline-none transition-all placeholder:text-slate-600 border ${
                    fieldErrors.email && touched.email
                      ? 'border-rose-500 ring-1 ring-rose-500/50'
                      : 'border-slate-800 focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/60'
                  }`}
                />
                <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
              </div>
              {fieldErrors.email && touched.email && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Senha Criptográfica <span className="text-cyan-400">*</span>
                </label>
                {mode === 'register' && (
                  <span className={`text-[10px] font-mono font-bold ${strength.text}`}>
                    Força: {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="input-auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="••••••••••••"
                  className={`w-full bg-slate-950/60 text-white text-sm rounded-xl px-3.5 py-2.5 pl-10 pr-10 focus:outline-none transition-all placeholder:text-slate-600 border ${
                    fieldErrors.password && touched.password
                      ? 'border-rose-500 ring-1 ring-rose-500/50'
                      : 'border-slate-800 focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500/60'
                  }`}
                />
                <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {fieldErrors.password && touched.password && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.password}
                </p>
              )}

              {/* Password Strength Meter & Checklist for Registration */}
              {mode === 'register' && password && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.score >= 1 ? strength.color : 'bg-transparent'} flex-1 transition-all`} />
                    <div className={`h-full ${strength.score >= 2 ? strength.color : 'bg-transparent'} flex-1 transition-all`} />
                    <div className={`h-full ${strength.score >= 3 ? strength.color : 'bg-transparent'} flex-1 transition-all`} />
                    <div className={`h-full ${strength.score >= 4 ? strength.color : 'bg-transparent'} flex-1 transition-all`} />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-400">
                    <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" /> Mín. 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" /> Letra Maiúscula
                    </div>
                    <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" /> Número
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={loading || (lockoutSeconds !== null && lockoutSeconds > 0)}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 border border-cyan-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Acessar Workspace' : 'Criar Conta Segura'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Acesso Rápido de Administrador:
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                id="btn-quick-admin"
                onClick={() => handleQuickLogin('luiz.g.albino@gmail.com', 'DiscordDev@2026')}
                className="bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3 text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors">Luiz Albino</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">Admin Master</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">luiz.g.albino@gmail.com</div>
                </div>
                <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
