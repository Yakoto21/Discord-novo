import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Shield,
  Volume2,
  Mic,
  Video,
  Monitor,
  Palette,
  Keyboard,
  LogOut,
  Check,
  Radio,
  Sparkles,
  Lock,
  Zap,
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Sliders,
  FileImage,
  AlertCircle,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Undo2,
  Eye,
  Bell,
  BellRing,
} from 'lucide-react';
import { User as UserType, UserStatus, ServerGuild } from '../../types';
import { AdminControlPanel, GlobalSystemConfig } from './AdminControlPanel';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
  getNotificationPermission,
  NotificationPreferences,
} from '../../utils/browserNotifications';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onUpdateUser: (updatedData: Partial<UserType>) => void;
  onLogout: () => void;
  onOpenSecurityDiagnosis: () => void;
  onOpenShortcutsModal?: () => void;
  allUsers?: UserType[];
  allServers?: ServerGuild[];
  onUpdateTargetUser?: (userId: string, data: Partial<UserType>) => void;
  onUpdateServer?: (serverId: string, data: Partial<ServerGuild>) => void;
  onDeleteServer?: (serverId: string) => void;
  systemConfig?: GlobalSystemConfig;
  onUpdateSystemConfig?: (config: Partial<GlobalSystemConfig>) => void;
  initialTab?: SettingsTab;
}

type SettingsTab = 'account' | 'profile' | 'voice_video' | 'appearance' | 'notifications' | 'security' | 'keybinds' | 'admin';

interface PendingImagePreview {
  type: 'avatar' | 'banner';
  rawSrc: string;
  fileName: string;
  fileSizeFormatted: string;
  zoom: number;
  rotation: number;
}

// Utilitário para processar e comprimir imagens carregadas localmente
const readAndOptimizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.88
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputFormat = file.type === 'image/png' || file.type === 'image/gif' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputFormat, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao processar dados da imagem.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro na leitura do arquivo local.'));
    reader.readAsDataURL(file);
  });
};

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  onOpenSecurityDiagnosis,
  onOpenShortcutsModal,
  allUsers = [],
  allServers = [],
  onUpdateTargetUser = () => {},
  onUpdateServer = () => {},
  onDeleteServer = () => {},
  systemConfig = {
    appTitle: 'Discord Quantum',
    globalTheme: 'cyan',
    ambientGlowIntensity: 65,
    uiCornerRadius: 'normal',
    maintenanceMode: false,
    activeBroadcast: null,
    simulatedLatencyMs: 0,
  },
  onUpdateSystemConfig = () => {},
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'account');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [bio, setBio] = useState(currentUser?.bio || 'Desenvolvedor apaixonado por WebRTC e sistemas em tempo real.');
  const [bannerColor, setBannerColor] = useState(currentUser?.bannerColor || '#06b6d4');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.bannerUrl || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [userStatus, setUserStatus] = useState<UserStatus>(currentUser?.status || 'online');

  // Estados do Painel de Admin Secreto
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(
    currentUser?.role === 'admin' || (typeof window !== 'undefined' && localStorage.getItem('quantum_admin_unlocked') === 'true')
  );
  const [secretClicks, setSecretClicks] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setIsAdminUnlocked(true);
    }
  }, [currentUser]);

  const handleUnlockAdmin = () => {
    if (pinCode.trim().toLowerCase() === 'admin2026' || pinCode.trim() === '1234' || pinCode.trim() === '') {
      setIsAdminUnlocked(true);
      if (typeof window !== 'undefined') localStorage.setItem('quantum_admin_unlocked', 'true');
      setShowPinModal(false);
      setActiveTab('admin');
      setPinCode('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Estados de Upload Local e Drag & Drop
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);

  // Estado da Pré-visualização Temporária antes de aplicar
  const [pendingPreview, setPendingPreview] = useState<PendingImagePreview | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Estados para o teste de Voz & Vídeo
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [videoPreviewActive, setVideoPreviewActive] = useState(false);
  const [inputSensitivity, setInputSensitivity] = useState(60);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [saved, setSaved] = useState(false);

  // Estados de Notificações Nativas do Navegador
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    loadNotificationPreferences()
  );
  const [testNotifSent, setTestNotifSent] = useState(false);

  const handleRequestNotifPermission = async () => {
    await requestNotificationPermission();
    setNotifPermission(getNotificationPermission());
  };

  const handleUpdateNotifPref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = saveNotificationPreferences({ [key]: value });
    setNotifPrefs(updated);
  };

  const handleTriggerTestNotification = () => {
    const res = sendTestNotification();
    if (res) {
      setTestNotifSent(true);
      setTimeout(() => setTestNotifSent(false), 3000);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setCustomStatus(currentUser.customStatus || '');
      setBio(currentUser.bio || '');
      setBannerColor(currentUser.bannerColor || '#06b6d4');
      setBannerUrl(currentUser.bannerUrl || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setUserStatus(currentUser.status || 'online');
    }
  }, [currentUser]);

  // Limpeza de streams ao fechar modal
  useEffect(() => {
    if (!isOpen) {
      stopMicTest();
      stopVideoPreview();
      setPendingPreview(null);
    }
  }, [isOpen]);

  const hasUnsavedChanges =
    username !== (currentUser?.username || '') ||
    customStatus !== (currentUser?.customStatus || '') ||
    bio !== (currentUser?.bio || '') ||
    bannerColor !== (currentUser?.bannerColor || '#06b6d4') ||
    bannerUrl !== (currentUser?.bannerUrl || '') ||
    avatarUrl !== (currentUser?.avatarUrl || '') ||
    userStatus !== (currentUser?.status || 'online');

  const handleResetChanges = () => {
    if (currentUser) {
      setUsername(currentUser.username);
      setCustomStatus(currentUser.customStatus || '');
      setBio(currentUser.bio || '');
      setBannerColor(currentUser.bannerColor || '#06b6d4');
      setBannerUrl(currentUser.bannerUrl || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setUserStatus(currentUser.status || 'online');
      setAvatarFileName(null);
      setBannerFileName(null);
      setUploadError(null);
    }
  };

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
      setIsMicTesting(true);
    } catch (err) {
      console.warn('Microfone não disponível para teste:', err);
      // Simulação para feedback caso o microfone não seja liberado no browser
      setIsMicTesting(true);
      let vol = 20;
      const interval = setInterval(() => {
        vol = Math.floor(Math.random() * 60 + 20);
        setMicVolume(vol);
      }, 100);
      setTimeout(() => clearInterval(interval), 10000);
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicTesting(false);
    setMicVolume(0);
  };

  const toggleVideoPreview = async () => {
    if (videoPreviewActive) {
      stopVideoPreview();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
        setVideoPreviewActive(true);
      } catch (err) {
        console.warn('Câmera não disponível para teste:', err);
      }
    }
  };

  const stopVideoPreview = () => {
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoPreviewRef.current.srcObject = null;
    }
    setVideoPreviewActive(false);
  };

  if (!isOpen) return null;

  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP ou GIF).');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawSrc = e.target?.result as string;
      const sizeInKb = (file.size / 1024).toFixed(1);
      setPendingPreview({
        type: 'avatar',
        rawSrc,
        fileName: file.name,
        fileSizeFormatted: `${sizeInKb} KB`,
        zoom: 1,
        rotation: 0,
      });
    };
    reader.onerror = () => setUploadError('Falha ao abrir arquivo de imagem local.');
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP ou GIF).');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawSrc = e.target?.result as string;
      const sizeInKb = (file.size / 1024).toFixed(1);
      setPendingPreview({
        type: 'banner',
        rawSrc,
        fileName: file.name,
        fileSizeFormatted: `${sizeInKb} KB`,
        zoom: 1,
        rotation: 0,
      });
    };
    reader.onerror = () => setUploadError('Falha ao abrir arquivo de banner local.');
    reader.readAsDataURL(file);
  };

  const handleConfirmPendingPreview = () => {
    if (!pendingPreview) return;
    const isAvatar = pendingPreview.type === 'avatar';
    const targetW = isAvatar ? 400 : 1200;
    const targetH = isAvatar ? 400 : 480;

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fundo suave de suporte
      ctx.fillStyle = isAvatar ? '#1e1f22' : bannerColor || '#06b6d4';
      ctx.fillRect(0, 0, targetW, targetH);

      ctx.save();
      ctx.translate(targetW / 2, targetH / 2);
      ctx.rotate((pendingPreview.rotation * Math.PI) / 180);
      ctx.scale(pendingPreview.zoom, pendingPreview.zoom);

      // Enquadramento preservando cobertura
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      if (isAvatar) {
        setAvatarUrl(finalDataUrl);
        setAvatarFileName(pendingPreview.fileName);
      } else {
        setBannerUrl(finalDataUrl);
        setBannerFileName(pendingPreview.fileName);
      }
      setPendingPreview(null);
    };
    img.src = pendingPreview.rawSrc;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      username,
      customStatus,
      bio,
      bannerColor,
      bannerUrl,
      avatarUrl,
      status: userStatus,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div 
      id="user-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div 
        id="user-settings-card"
        className="bg-[#313338] w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border border-[#3f4147] flex overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Menu Lateral de Configurações */}
        <div className="w-60 bg-[#2b2d31] p-4 flex flex-col justify-between border-r border-[#232428] shrink-0">
          <div className="space-y-4 overflow-y-auto scrollbar-none pr-1">
            {/* Seção: Configurações de Usuário */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase text-[#949ba4] px-2 mb-1.5 tracking-wider">
                Configurações do Usuário
              </div>

              <button
                onClick={() => setActiveTab('account')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Minha Conta</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#eb459e]" />
                <span>Perfil de Usuário</span>
              </button>
            </div>

            {/* Seção: Configurações de Aplicativo */}
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase text-[#949ba4] px-2 mb-1.5 tracking-wider">
                Configurações do App
              </div>

              <button
                onClick={() => setActiveTab('voice_video')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'voice_video'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Voz & Vídeo (WebRTC)</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'appearance'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Aparência</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4 text-[#5865f2]" />
                <span>Notificações</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-[#5865f2]" />
                <span>Segurança & Backend</span>
              </button>

              <button
                onClick={() => setActiveTab('keybinds')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'keybinds'
                    ? 'bg-[#404249] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c] hover:text-white'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Atalhos do Teclado</span>
              </button>

              {/* ABA SECRETA: Painel de Administração Supremo */}
              {isAdminUnlocked && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-amber-500/25 to-red-500/25 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/20'
                      : 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/10 border-amber-500/40 animate-pulse'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>👑 Painel Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* Sair da Conta e Rodapé Secreto com Versão */}
          <div className="pt-2 border-t border-[#35373c]/40 space-y-2">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full text-left px-2.5 py-2 rounded text-xs font-semibold text-[#f23f43] hover:bg-[#f23f43]/10 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>

            {/* Gatilho Secreto de Administrador: Clique 5 vezes */}
            <div className="pt-2 border-t border-[#35373c]/20 text-center">
              <button
                type="button"
                onClick={() => {
                  const nextClicks = secretClicks + 1;
                  setSecretClicks(nextClicks);
                  if (nextClicks >= 5) {
                    setShowPinModal(true);
                    setSecretClicks(0);
                  }
                }}
                className="text-[10px] text-slate-500 hover:text-amber-400/80 transition-colors font-mono tracking-tight cursor-pointer w-full text-center py-1 select-none"
                title="Clique 5 vezes para desbloquear o Console Secreto de Administrador"
              >
                Quantum Core v3.4.0 (Build 2026.08)
                {secretClicks > 0 && secretClicks < 5 && (
                  <span className="ml-1 text-amber-400 font-bold">({5 - secretClicks})</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Painel Central de Conteúdo */}
        <div className="flex-1 flex flex-col bg-[#313338] overflow-y-auto p-8 relative scrollbar-thin scrollbar-thumb-[#1a1b1e]">
          {/* Botão Fechar ESC */}
          <div className="absolute top-6 right-6 flex flex-col items-center">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border-2 border-[#949ba4] text-[#949ba4] hover:text-white hover:border-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-[#949ba4] mt-1 font-mono font-bold">ESC</span>
          </div>

          {/* 1. ABA: Minha Conta */}
          {activeTab === 'account' && (
            <div className="max-w-xl space-y-6">
              <h2 className="text-xl font-bold text-white">Minha Conta</h2>

              {/* Card de Identidade do Discord */}
              <div className="bg-[#1e1f22] rounded-2xl overflow-hidden border border-[#2b2d31]">
                {/* Banner de Cor / Imagem com ação rápida */}
                <div
                  className="h-24 relative bg-cover bg-center group"
                  style={{
                    backgroundColor: bannerColor,
                    backgroundImage: bannerUrl ? `url("${bannerUrl}")` : undefined,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-3 gap-2 backdrop-blur-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('profile');
                        setTimeout(() => bannerFileInputRef.current?.click(), 100);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-lg"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Alterar Banner</span>
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="flex items-end gap-3 -mt-10">
                    <div className="relative group cursor-pointer" onClick={() => {
                      setActiveTab('profile');
                      setTimeout(() => avatarFileInputRef.current?.click(), 100);
                    }}>
                      <img
                        src={avatarUrl || currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border-4 border-[#1e1f22]"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-cyan-500/50">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <span
                        className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#1e1f22] ${
                          userStatus === 'online'
                            ? 'bg-[#23a55a]'
                            : userStatus === 'idle'
                            ? 'bg-[#f0b232]'
                            : userStatus === 'dnd'
                            ? 'bg-[#f23f43]'
                            : 'bg-[#80848e]'
                        }`}
                      />
                    </div>

                    <div className="mb-1">
                      <div className="text-lg font-bold text-white leading-tight">
                        {currentUser?.username || 'Usuário'}
                      </div>
                      <div className="text-xs text-[#949ba4]">
                        #{currentUser?.discriminator || '0000'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
                    <span>Editar Perfil & Fotos</span>
                  </button>
                </div>

                {/* Dados da Conta */}
                <div className="bg-[#2b2d31] m-4 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-[#35373c] pb-2">
                    <div>
                      <div className="text-[#949ba4] font-bold uppercase text-[10px]">Nome de Usuário</div>
                      <div className="text-white font-medium mt-0.5">{currentUser?.username}#{currentUser?.discriminator}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-[#35373c] pb-2">
                    <div>
                      <div className="text-[#949ba4] font-bold uppercase text-[10px]">E-mail</div>
                      <div className="text-white font-medium mt-0.5">{currentUser?.email || 'luiz.g.albino@gmail.com'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#949ba4] font-bold uppercase text-[10px]">Cargo no Servidor</div>
                      <div className="text-[#23a55a] font-bold mt-0.5">👑 Administrador / Desenvolvedor</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status do Usuário */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
                  Definir Status Online
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'online', label: 'Online', color: 'bg-[#23a55a]' },
                    { id: 'idle', label: 'Ausente', color: 'bg-[#f0b232]' },
                    { id: 'dnd', label: 'Não Perturbe', color: 'bg-[#f23f43]' },
                    { id: 'offline', label: 'Invisível', color: 'bg-[#80848e]' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setUserStatus(st.id as UserStatus);
                        onUpdateUser({ status: st.id as UserStatus });
                      }}
                      className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors text-xs font-semibold ${
                        userStatus === st.id
                          ? 'bg-[#2b2d31] border-[#5865f2] text-white'
                          : 'bg-[#2b2d31]/40 border-[#35373c] text-[#949ba4] hover:bg-[#2b2d31]'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${st.color}`} />
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. ABA: Perfil de Usuário */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-bold text-white">Perfil do Usuário</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Altere sua foto de perfil (avatar) e banner importando arquivos direto do seu computador ou personalizando cores e status.
                </p>
              </div>

              {/* Mensagem de Erro de Upload */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="p-1 text-rose-300 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Inputs Ocultos de Arquivo (File Pickers) */}
              <input
                ref={avatarFileInputRef}
                id="input-avatar-file-hidden"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFile(file);
                }}
              />
              <input
                ref={bannerFileInputRef}
                id="input-banner-file-hidden"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBannerFile(file);
                }}
              />

              {/* Live Preview Card com Interações Rápidas */}
              <div className="bg-[#1e1f22] rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl">
                {/* Banner Interativo no Preview */}
                <div
                  className="h-28 relative bg-cover bg-center group"
                  style={{
                    backgroundColor: bannerColor,
                    backgroundImage: bannerUrl ? `url("${bannerUrl}")` : undefined,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-3 gap-2 backdrop-blur-xs">
                    <button
                      type="button"
                      id="btn-preview-change-banner"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-lg hover:border-cyan-400"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Alterar Banner (Arquivo)</span>
                    </button>
                    {bannerUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setBannerUrl('');
                          setBannerFileName(null);
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs transition-all cursor-pointer"
                        title="Remover Imagem de Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4 relative flex items-end justify-between">
                  <div className="flex items-end gap-3 -mt-10">
                    {/* Avatar Interativo no Preview */}
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => avatarFileInputRef.current?.click()}
                      title="Clique para escolher foto do computador"
                    >
                      <img
                        src={avatarUrl || currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt="Avatar"
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-[#1e1f22] shadow-lg"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center border-2 border-cyan-400/80 text-white text-[10px] font-bold gap-0.5">
                        <Camera className="w-4 h-4 text-cyan-400" />
                        <span>Mudar</span>
                      </div>
                    </div>

                    <div className="mb-0.5">
                      <div className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
                        <span>{username || currentUser?.username}</span>
                        <span className="text-xs text-slate-400">#{currentUser?.discriminator || '0000'}</span>
                      </div>
                      {customStatus && (
                        <div className="text-xs text-cyan-300 font-medium mt-0.5">{customStatus}</div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Prévia em Tempo Real
                  </span>
                </div>
              </div>

              {/* SEÇÃO 1: FOTO DE PERFIL (AVATAR) DO COMPUTADOR */}
              <div className="bg-[#2b2d31] p-4 rounded-2xl border border-[#35373c] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Foto de Perfil (Avatar)
                    </label>
                  </div>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
                        setAvatarFileName(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Restaurar padrão</span>
                    </button>
                  )}
                </div>

                {/* Zona de Drop e Seleção do Arquivo de Avatar */}
                <div
                  id="avatar-dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsAvatarDragging(true);
                  }}
                  onDragLeave={() => setIsAvatarDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsAvatarDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleAvatarFile(file);
                  }}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    isAvatarDragging
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'border-[#3f4147] hover:border-cyan-500/50 bg-[#1e1f22]/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={avatarUrl || currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {avatarFileName ? `Arquivo: ${avatarFileName}` : 'Carregar foto do computador'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Arraste um arquivo aqui ou clique no botão ao lado (PNG, JPG, WebP ou GIF)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-upload-avatar-file"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Escolher Foto</span>
                  </button>
                </div>
              </div>

              {/* SEÇÃO 2: BANNER DO PERFIL (ARQUIVO DO COMPUTADOR & CORES) */}
              <div className="bg-[#2b2d31] p-4 rounded-2xl border border-[#35373c] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      Banner do Perfil
                    </label>
                  </div>
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerUrl('');
                        setBannerFileName(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover imagem de banner</span>
                    </button>
                  )}
                </div>

                {/* Zona de Drop e Seleção do Arquivo de Banner */}
                <div
                  id="banner-dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsBannerDragging(true);
                  }}
                  onDragLeave={() => setIsBannerDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsBannerDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleBannerFile(file);
                  }}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                    isBannerDragging
                      ? 'border-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_15px_rgba(217,70,239,0.2)]'
                      : 'border-[#3f4147] hover:border-fuchsia-500/50 bg-[#1e1f22]/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-16 h-10 rounded-lg bg-cover bg-center border border-white/20 shrink-0"
                      style={{
                        backgroundColor: bannerColor,
                        backgroundImage: bannerUrl ? `url("${bannerUrl}")` : undefined,
                      }}
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {bannerFileName ? `Arquivo: ${bannerFileName}` : 'Carregar banner do computador'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Arraste um banner panorâmico aqui ou clique no botão (Recomendado 600x240px+)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-upload-banner-file"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-fuchsia-500/20 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Escolher Banner</span>
                  </button>
                </div>

                {/* Cor Base do Banner e Presets */}
                <div className="pt-2 border-t border-[#35373c]/60 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Cor de Fundo:</span>
                    </div>
                    <input
                      type="color"
                      value={bannerColor}
                      onChange={(e) => setBannerColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      title="Escolher cor base do banner"
                    />
                    <span className="text-xs font-mono text-slate-400">{bannerColor}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                      Ou escolha um tema de banner pronto:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Cyber Matrix', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80' },
                        { label: 'Neon Circuit', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80' },
                        { label: 'Cosmic Nebula', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' },
                        { label: 'Gaming Horizon', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80' }
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setBannerUrl(p.url);
                            setBannerFileName(null);
                          }}
                          className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 text-left transition-all cursor-pointer hover:bg-slate-900"
                        >
                          <div className="text-[11px] font-semibold text-white">{p.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: NOME DE EXIBIÇÃO & BIO */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider mb-1.5">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#1e1f22] text-white text-sm px-3.5 py-2.5 rounded-xl outline-none border border-[#232428] focus:border-cyan-500"
                  />
                </div>

                {/* Status Personalizado com Chips Rápidos */}
                <div>
                  <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider mb-1.5">
                    Status Contextual Personalizado
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="🚀 Codando em tempo real com WebRTC..."
                    className="w-full bg-[#1e1f22] text-white text-sm px-3.5 py-2.5 rounded-xl outline-none border border-[#232428] focus:border-cyan-500 mb-2"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '💻 Codando WebRTC & Node.js',
                      '🎧 Focado no Pomodoro Deep Work',
                      '🚀 Modo Turbo Ativado',
                      '☕ Pausa para Café',
                      '🎮 Jogando Multiplayer',
                      '🔒 Investigação Ofensiva'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomStatus(preset)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sobre Mim (Bio) */}
                <div>
                  <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider mb-1.5">
                    Sobre Mim (Bio)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Conte sobre suas habilidades, tecnologias favoritas ou projetos..."
                    className="w-full bg-[#1e1f22] text-white text-sm px-3.5 py-2.5 rounded-xl outline-none border border-[#232428] focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              {/* Botão de Salvar */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                {saved && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-4 h-4" /> Alterações salvas com sucesso!
                  </span>
                )}
                <button
                  type="submit"
                  id="btn-save-user-profile"
                  className="ml-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. ABA: Voz & Vídeo (WebRTC) */}
          {activeTab === 'voice_video' && (
            <div className="max-w-xl space-y-6">
              <h2 className="text-xl font-bold text-white">Configurações de Voz & Vídeo</h2>

              {/* Testador de Microfone */}
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Mic className="w-4 h-4 text-[#5865f2]" />
                    <span>Teste do Microfone (VAD Web Audio API)</span>
                  </div>
                  <button
                    type="button"
                    onClick={isMicTesting ? stopMicTest : startMicTest}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      isMicTesting
                        ? 'bg-[#f23f43] text-white'
                        : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                    }`}
                  >
                    {isMicTesting ? 'Parar Teste' : 'Testar Microfone'}
                  </button>
                </div>

                {/* Barra de Decibéis em Tempo Real */}
                <div>
                  <div className="h-3 bg-[#1e1f22] rounded-full overflow-hidden border border-[#111214] p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        micVolume > 70
                          ? 'bg-[#f23f43]'
                          : micVolume > 30
                          ? 'bg-[#23a55a]'
                          : 'bg-[#5865f2]'
                      }`}
                      style={{ width: `${isMicTesting ? micVolume : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#949ba4] mt-1 font-mono">
                    <span>Silêncio (-60dB)</span>
                    <span>{isMicTesting ? `${micVolume}%` : 'Inativo'}</span>
                    <span>Pico (0dB)</span>
                  </div>
                </div>
              </div>

              {/* Sensibilidade de Entrada */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
                  <span>Sensibilidade de Detecção de Voz</span>
                  <span className="text-[#5865f2]">{inputSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={inputSensitivity}
                  onChange={(e) => setInputSensitivity(Number(e.target.value))}
                  className="w-full accent-[#5865f2] cursor-pointer"
                />
              </div>

              {/* Teste de Câmera de Vídeo */}
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Video className="w-4 h-4 text-[#23a55a]" />
                    <span>Pré-visualização da Câmera</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVideoPreview}
                    className="bg-[#35373c] hover:bg-[#404249] text-white px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
                  >
                    {videoPreviewActive ? 'Desativar Câmera' : 'Testar Câmera'}
                  </button>
                </div>

                <div className="h-44 bg-[#1e1f22] rounded-lg overflow-hidden flex items-center justify-center border border-[#111214]">
                  {videoPreviewActive ? (
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs text-[#949ba4] flex flex-col items-center gap-2">
                      <Video className="w-8 h-8 opacity-40" />
                      <span>Clique em "Testar Câmera" para verificar o enquadramento WebRTC</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. ABA: Aparência */}
          {activeTab === 'appearance' && (
            <div className="max-w-xl space-y-6">
              <h2 className="text-xl font-bold text-white">Aparência do Discord</h2>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
                  Tema da Interface
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border-2 border-[#5865f2] bg-[#2b2d31] flex flex-col justify-between space-y-2 cursor-pointer shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Escuro (Discord Padrão)</span>
                      <Check className="w-4 h-4 text-[#5865f2]" />
                    </div>
                    <div className="h-8 bg-[#1e1f22] rounded flex items-center px-2 gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#5865f2]" />
                      <span className="w-12 h-1.5 rounded bg-[#35373c]" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#35373c] bg-[#1e1f22] flex flex-col justify-between space-y-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Escuro OLED / Noturno</span>
                    </div>
                    <div className="h-8 bg-black rounded flex items-center px-2 gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
                      <span className="w-12 h-1.5 rounded bg-[#232428]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-[#dbdee1] uppercase tracking-wider">
                  Exibição de Mensagens
                </label>
                <div className="space-y-2">
                  <div className="bg-[#2b2d31] p-3 rounded-lg border border-[#5865f2] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">Confortável</div>
                      <div className="text-xs text-[#949ba4]">Visual moderno e espaçoso com avatares visíveis</div>
                    </div>
                    <input type="radio" checked readOnly className="accent-[#5865f2]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. ABA: Notificações do Navegador */}
          {activeTab === 'notifications' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#5865f2]" />
                  <span>Notificações do Navegador & Sistema</span>
                </h2>
                <p className="text-xs text-[#949ba4] mt-1">
                  Receba alertas nativos no desktop quando você for mencionado ou receber mensagens privadas enquanto o app estiver minimizado.
                </p>
              </div>

              {/* Card de Status da Permissão */}
              <div className="bg-[#2b2d31] p-5 rounded-2xl border border-[#35373c] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Status da Permissão no Navegador
                    </span>
                    <div className="flex items-center gap-2 pt-0.5">
                      {notifPermission === 'granted' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Permissão Concedida (Ativo)
                        </span>
                      ) : notifPermission === 'denied' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Bloqueado no Navegador
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Pendente / Não Solicitado
                        </span>
                      )}
                    </div>
                  </div>

                  {notifPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestNotifPermission}
                      className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Ativar Notificações</span>
                    </button>
                  )}
                </div>

                {notifPermission === 'granted' && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-300">
                      Teste o disparo de notificação nativa no seu sistema operacional:
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerTestNotification}
                      className="px-3.5 py-1.5 rounded-lg bg-[#35373c] hover:bg-[#404249] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{testNotifSent ? 'Notificação Enviada!' : 'Enviar Notificação de Teste'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Toggles de Preferências */}
              <div className="bg-[#2b2d31] p-5 rounded-2xl border border-[#35373c] space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Eventos de Disparo
                </h3>

                <div className="space-y-3">
                  {/* Master Toggle */}
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div>
                      <div className="text-xs font-bold text-white">Habilitar Notificações do Quantum</div>
                      <div className="text-[11px] text-[#949ba4]">Permite o envio de alertas nativos do navegador.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.enabled}
                      onChange={(e) => handleUpdateNotifPref('enabled', e.target.checked)}
                      className="w-4 h-4 accent-[#5865f2] cursor-pointer"
                    />
                  </label>

                  {/* Menções */}
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-white/5 transition-colors border-t border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">Menções (@everyone, @seu-nome, @cargos)</div>
                      <div className="text-[11px] text-[#949ba4]">Notifica sempre que você ou um cargo seu for mencionado.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifyMentions}
                      onChange={(e) => handleUpdateNotifPref('notifyMentions', e.target.checked)}
                      className="w-4 h-4 accent-[#5865f2] cursor-pointer"
                    />
                  </label>

                  {/* DMs */}
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-white/5 transition-colors border-t border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">Mensagens Diretas (DMs)</div>
                      <div className="text-[11px] text-[#949ba4]">Notifica quando outros usuários enviarem mensagens privadas.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.notifyDMs}
                      onChange={(e) => handleUpdateNotifPref('notifyDMs', e.target.checked)}
                      className="w-4 h-4 accent-[#5865f2] cursor-pointer"
                    />
                  </label>

                  {/* Apenas quando minimizado */}
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-white/5 transition-colors border-t border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">Apenas em Segundo Plano</div>
                      <div className="text-[11px] text-[#949ba4]">Suprime notificações do navegador quando você já estiver com o app focado.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.onlyWhenBackground}
                      onChange={(e) => handleUpdateNotifPref('onlyWhenBackground', e.target.checked)}
                      className="w-4 h-4 accent-[#5865f2] cursor-pointer"
                    />
                  </label>

                  {/* Sons */}
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-white/5 transition-colors border-t border-white/5">
                    <div>
                      <div className="text-xs font-bold text-white">Efeitos Sonoros Integrados</div>
                      <div className="text-[11px] text-[#949ba4]">Toca o áudio de menção ou mensagem recebida no navegador.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.playSound}
                      onChange={(e) => handleUpdateNotifPref('playSound', e.target.checked)}
                      className="w-4 h-4 accent-[#5865f2] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 6. ABA: Segurança & Backend */}
          {activeTab === 'security' && (
            <div className="max-w-xl space-y-6">
              <h2 className="text-xl font-bold text-white">Arquitetura de Segurança & Backend</h2>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                Este Discord Clone conta com camadas corporativas de segurança para proteger a comunicação em tempo real e os dados de autenticação.
              </p>

              <div className="space-y-3">
                <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#23a55a] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Hashing Bcrypt (Cost 12)</h4>
                    <p className="text-xs text-[#949ba4] mt-0.5">
                      Senhas são processadas com 12 salt rounds, garantindo alta resistência computacional.
                    </p>
                  </div>
                </div>

                <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] flex items-start gap-3">
                  <Lock className="w-5 h-5 text-[#f0b232] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Proteção contra Timing Attacks</h4>
                    <p className="text-xs text-[#949ba4] mt-0.5">
                      Execução de hash falso pré-computado quando um usuário não existe para uniformizar o tempo de resposta.
                    </p>
                  </div>
                </div>

                <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#35373c] flex items-start gap-3">
                  <Zap className="w-5 h-5 text-[#5865f2] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Rate Limiting Anti-Força Bruta</h4>
                    <p className="text-xs text-[#949ba4] mt-0.5">
                      Máximo de 10 tentativas por IP em 15 minutos nas rotas de login e cadastro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSecurityDiagnosis();
                  }}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Abrir Diagnóstico Completo da API Express</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. ABA: Atalhos do Teclado */}
          {activeTab === 'keybinds' && (
            <div className="max-w-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Atalhos de Teclado</h2>
                  <p className="text-xs text-[#949ba4] mt-0.5">
                    Navegue e controle áudio e canais sem usar o mouse.
                  </p>
                </div>
                {onOpenShortcutsModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenShortcutsModal();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Abrir Central de Atalhos</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {[
                  { desc: 'Alternar Mudo do microfone', key: 'Ctrl + Shift + M' },
                  { desc: 'Alternar Ensurdecer (Deafen)', key: 'Ctrl + Shift + D' },
                  { desc: 'Próximo Canal do Servidor', key: 'Alt + ↓' },
                  { desc: 'Canal Anterior do Servidor', key: 'Alt + ↑' },
                  { desc: 'Navegação rápida / Quick Switcher', key: 'Ctrl + K' },
                  { desc: 'Buscar mensagens no canal', key: 'Ctrl + F' },
                  { desc: 'Abrir Central Completa de Atalhos', key: 'Ctrl + /' },
                  { desc: 'Alternar Lista de Membros', key: 'Ctrl + U' },
                  { desc: 'Configurações de Usuário', key: 'Ctrl + ,' },
                  { desc: 'Fechar modais / Desfocar', key: 'ESC' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#2b2d31] p-3 rounded-lg border border-[#35373c] flex items-center justify-between text-xs"
                  >
                    <span className="text-white font-medium">{item.desc}</span>
                    <kbd className="bg-[#1e1f22] text-[#5865f2] font-mono font-bold px-2.5 py-1 rounded border border-[#35373c]">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. ABA SECRETA: Painel de Administração Supremo */}
          {activeTab === 'admin' && (
            <AdminControlPanel
              users={allUsers}
              servers={allServers}
              currentUser={currentUser}
              onUpdateUser={onUpdateTargetUser}
              onUpdateServer={onUpdateServer}
              onDeleteServer={onDeleteServer}
              systemConfig={systemConfig}
              onUpdateSystemConfig={onUpdateSystemConfig}
            />
          )}

          {/* Barra Flutuante de Alterações Não Salvas (Estilo Discord) */}
          {hasUnsavedChanges && (
            <div
              id="unsaved-changes-notice-bar"
              className="sticky bottom-0 left-0 right-0 mt-6 bg-[#111214]/95 backdrop-blur-md rounded-xl p-3.5 border border-[#3f4147] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 z-30 animate-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-center gap-2.5 text-xs text-white">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Cuidado:</strong> Você possui alterações de imagem/perfil em pré-visualização não salvas.
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  id="btn-reset-unsaved-changes"
                  onClick={handleResetChanges}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Redefinir
                </button>
                <button
                  type="button"
                  id="btn-confirm-save-changes"
                  onClick={(e) => handleSaveProfile(e)}
                  className="bg-[#23a55a] hover:bg-[#1f9250] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE PRÉ-VISUALIZAÇÃO E AJUSTES DE IMAGEM ANTES DO UPLOAD */}
      {pendingPreview && (
        <div
          id="image-preview-modal-backdrop"
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setPendingPreview(null)}
        >
          <div
            id="image-preview-dialog"
            className="bg-[#2b2d31] w-full max-w-lg rounded-2xl shadow-2xl border border-[#3f4147] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Preview */}
            <div className="p-5 pb-3 border-b border-[#232428] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {pendingPreview.type === 'avatar' ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-fuchsia-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {pendingPreview.type === 'avatar'
                      ? 'Pré-visualizar e Ajustar Foto de Perfil'
                      : 'Pré-visualizar e Ajustar Banner'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pendingPreview.fileName} • {pendingPreview.fileSizeFormatted}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingPreview(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo do Preview */}
            <div className="p-5 space-y-4 bg-[#1e1f22]/90 flex flex-col items-center">
              {pendingPreview.type === 'avatar' ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
                  {/* Viewport Principal com Máscara Circular */}
                  <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-black/70 flex items-center justify-center shrink-0">
                    <img
                      src={pendingPreview.rawSrc}
                      alt="Prévia Avatar"
                      className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-75"
                      style={{
                        transform: `scale(${pendingPreview.zoom}) rotate(${pendingPreview.rotation}deg)`,
                      }}
                    />
                    <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                  </div>

                  {/* Contextos de Visualização no App */}
                  <div className="flex flex-col gap-2.5 text-left w-full sm:w-auto flex-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Prévia em Uso no App</span>
                    </span>

                    {/* Na mensagem do chat */}
                    <div className="bg-[#2b2d31] p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2.5 shadow-sm">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0 bg-black">
                        <img
                          src={pendingPreview.rawSrc}
                          alt="Chat preview"
                          className="w-full h-full object-cover"
                          style={{
                            transform: `scale(${pendingPreview.zoom}) rotate(${pendingPreview.rotation}deg)`,
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {username || currentUser?.username}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Mensagem no canal de texto
                        </div>
                      </div>
                    </div>

                    {/* Na lista de membros */}
                    <div className="bg-[#2b2d31] p-2 rounded-xl border border-slate-700/60 flex items-center gap-2 shadow-sm">
                      <div className="w-7 h-7 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black">
                        <img
                          src={pendingPreview.rawSrc}
                          alt="Member preview"
                          className="w-full h-full object-cover"
                          style={{
                            transform: `scale(${pendingPreview.zoom}) rotate(${pendingPreview.rotation}deg)`,
                          }}
                        />
                      </div>
                      <div className="text-[11px] font-semibold text-slate-200 truncate">
                        {username || currentUser?.username}
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#23a55a] ml-auto shrink-0" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Prévia Panorâmica do Banner */
                <div className="w-full space-y-3">
                  <div className="w-full h-44 rounded-xl overflow-hidden border-2 border-fuchsia-400/80 shadow-[0_0_30px_rgba(217,70,239,0.3)] bg-black/70 relative flex items-center justify-center">
                    <img
                      src={pendingPreview.rawSrc}
                      alt="Prévia Banner"
                      className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-75"
                      style={{
                        transform: `scale(${pendingPreview.zoom}) rotate(${pendingPreview.rotation}deg)`,
                      }}
                    />
                    <span className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/70 text-white/90 backdrop-blur-xs font-mono border border-white/10">
                      Enquadramento Panorâmico
                    </span>
                  </div>

                  <div className="text-center text-[11px] text-slate-400">
                    O banner será exibido no cabeçalho do seu perfil e nos popovers de perfil de usuário.
                  </div>
                </div>
              )}

              {/* Controles de Zoom e Rotação */}
              <div className="w-full bg-[#2b2d31] p-3 rounded-xl border border-slate-700/70 flex flex-wrap items-center justify-between gap-3 mt-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                  <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={pendingPreview.zoom}
                    onChange={(e) =>
                      setPendingPreview((prev) =>
                        prev ? { ...prev, zoom: parseFloat(e.target.value) } : null
                      )
                    }
                    className="flex-1 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-300 min-w-[38px] text-right">
                    {Math.round(pendingPreview.zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPendingPreview((prev) =>
                        prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                    title="Girar 90 graus"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Girar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingPreview((prev) =>
                        prev ? { ...prev, zoom: 1, rotation: 0 } : null
                      )
                    }
                    className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Restaurar zoom e rotação"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé com Ações */}
            <div className="p-4 bg-[#2b2d31] border-t border-[#232428] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (pendingPreview.type === 'avatar') {
                    avatarFileInputRef.current?.click();
                  } else {
                    bannerFileInputRef.current?.click();
                  }
                }}
                className="text-xs text-slate-300 hover:text-white hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Trocar arquivo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-cancel-pending-preview"
                  onClick={() => setPendingPreview(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-apply-preview"
                  onClick={handleConfirmPendingPreview}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar Imagem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DESBLOQUEIO DE PIN DO PAINEL DE ADMINISTRADOR */}
      {showPinModal && (
        <div
          id="admin-pin-modal-backdrop"
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowPinModal(false)}
        >
          <div
            id="admin-pin-dialog"
            className="bg-[#171a23] w-full max-w-sm rounded-3xl shadow-2xl border border-amber-500/40 p-6 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Acesso Root Supremo</h3>
                <p className="text-xs text-slate-400">Insira a chave mestra ou desbloqueie</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Chave Mestra / PIN Secreto</label>
              <input
                type="password"
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlockAdmin()}
                placeholder="Ex: admin2026 (ou deixe vazio)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0d0f14] border border-white/10 text-xs text-white focus:outline-hidden focus:border-amber-500"
                autoFocus
              />
              {pinError && (
                <div className="text-[11px] text-red-400 font-semibold">Chave mestra inválida. (Dica: use "admin2026")</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUnlockAdmin}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Desbloquear Painel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
