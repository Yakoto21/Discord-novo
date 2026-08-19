import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { User } from '../types';
import { AuthRequest } from '../middlewares/auth';

// Esquemas de validação rigorosos com Zod para proteção contra payloads maliciosos
export const registerSchema = z.object({
  username: z.string()
    .min(2, 'O nome de usuário deve conter no mínimo 2 caracteres.')
    .max(32, 'O nome de usuário não pode exceder 32 caracteres.')
    .regex(/^[a-zA-Z0-9_\.\-]+$/, 'O nome de usuário só pode conter letras, números, pontos, traços e underscores.')
    .trim(),
  email: z.string()
    .email('Formato de e-mail inválido.')
    .max(100, 'E-mail muito longo.')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'A senha deve conter no mínimo 8 caracteres.')
    .max(72, 'A senha não pode ultrapassar o limite do algoritmo bcrypt (72 bytes).')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.').toLowerCase().trim(),
  password: z.string().min(1, 'A senha é obrigatória.').max(72)
});

interface StoredUser extends User {
  passwordHash: string;
}

// Dummy hash pré-calculado com custo 12 para mitigar ataques de temporização (Timing Attacks)
// quando um e-mail não existe no banco de dados.
const DUMMY_HASH = '$2a$12$e8Y6lO7wOsk57kK7mQ8M4.k35VpYlM9B10d8Tf4qR/N6n78p59UaW';

// Helper para configurar cookie HTTP-Only seguro com JWT
export const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias de persistência segura
  });
};

/**
 * Encerra a sessão do usuário limpando o cookie HTTP-Only
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({
    success: true,
    message: 'Logout realizado com sucesso.'
  });
};

// Base de dados em memória (in-memory persistent state) inicializada com contas de demonstração
export const usersDb: Map<string, StoredUser> = new Map();

// Tracker em memória de tentativas de força bruta (Anti-Brute Force Engine)
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueio ativo
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // janela de 5 minutos

const bruteForceTracker: Map<string, AttemptRecord> = new Map();

// Helper para obter identificador único de tentativa (IP + E-mail)
const getTrackKey = (req: Request, email: string): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${ip}:${email.toLowerCase().trim()}`;
};

const imageSourceValidator = z.string().max(10_000_000).refine((val) => {
  if (!val) return true;
  return (
    val.startsWith('data:image/') ||
    val.startsWith('http://') ||
    val.startsWith('https://') ||
    val.startsWith('/') ||
    val.startsWith('blob:')
  );
}, {
  message: 'A imagem deve ser uma URL válida (http/https) ou um arquivo de imagem carregado do computador (data:image).'
});

export const updateProfileSchema = z.object({
  username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_\.\-]+$/).trim().optional(),
  avatarUrl: imageSourceValidator.optional(),
  bannerUrl: imageSourceValidator.optional().or(z.literal('')),
  bannerColor: z.string().max(100).optional(),
  customStatus: z.string().max(128).optional(),
  bio: z.string().max(500).optional(),
  pronouns: z.string().max(50).optional(),
  themeColor: z.string().max(50).optional(),
  status: z.enum(['online', 'idle', 'dnd', 'offline']).optional(),
});

// Helper para inicializar contas demonstrativas com bcrypt salt rounds 12
const seedInitialUsers = () => {
  const adminPasswordHash = bcrypt.hashSync('DiscordDev@2026', config.saltRounds);
  const user1: StoredUser = {
    id: 'usr-admin-1',
    username: 'Luiz',
    discriminator: '0001',
    email: 'luiz.g.albino@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    bannerColor: 'from-cyan-600 via-indigo-600 to-purple-800',
    bio: 'Arquiteto de Software & Engenheiro WebRTC. Construindo o futuro da comunicação em tempo real.',
    pronouns: 'ele/dele',
    status: 'online',
    customStatus: 'Desenvolvendo o clone do Discord 🎧',
    role: 'admin',
    createdAt: new Date().toISOString(),
    passwordHash: adminPasswordHash
  };

  usersDb.set(user1.email, user1);
};

seedInitialUsers();

/**
 * Registra um novo usuário com validação Zod e hash seguro bcrypt (saltRounds = 12)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Dados de cadastro inválidos.',
        issues: parseResult.error.issues.map(e => e.message)
      });
      return;
    }

    const { username, email, password } = parseResult.data;

    if (usersDb.has(email)) {
      res.status(409).json({
        success: false,
        error: 'E-mail já cadastrado.',
        details: 'Já existe uma conta associada a este endereço de e-mail.'
      });
      return;
    }

    // Geração assíncrona do hash da senha
    const passwordHash = await bcrypt.hash(password, config.saltRounds);
    const randomDisc = Math.floor(1000 + Math.random() * 9000).toString();
    const newUser: StoredUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username,
      discriminator: randomDisc,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      status: 'online',
      customStatus: 'Novo membro no servidor!',
      role: 'member',
      createdAt: new Date().toISOString(),
      passwordHash
    };

    usersDb.set(email, newUser);

    const safeUser: User = {
      id: newUser.id,
      username: newUser.username,
      discriminator: newUser.discriminator,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
      status: newUser.status,
      customStatus: newUser.customStatus,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    const token = jwt.sign(safeUser, config.jwtSecret, {
      expiresIn: '7d'
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso!',
      user: safeUser,
      token
    });
  } catch (error: any) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar cadastro.',
      details: error.message
    });
  }
};

/**
 * Autentica o usuário com proteção contra Timing Attacks e enumeração de usuários
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Requisição inválida.',
        issues: parseResult.error.issues.map(e => e.message)
      });
      return;
    }

    const { email, password } = parseResult.data;
    const trackKey = getTrackKey(req, email);
    const now = Date.now();

    // Verificação de bloqueio por Força Bruta (Anti-Brute Force Engine)
    const attemptRecord = bruteForceTracker.get(trackKey);
    if (attemptRecord?.lockedUntil && attemptRecord.lockedUntil > now) {
      const remainingSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      res.status(429).json({
        success: false,
        error: 'Acesso temporariamente bloqueado por motivos de segurança.',
        details: `Detectamos múltiplas tentativas falhas de login. Por favor, aguarde ${remainingSeconds} segundos antes de tentar novamente.`,
        retryAfter: remainingSeconds,
        isLocked: true
      });
      return;
    }

    const user = usersDb.get(email);

    // Se o usuário não existir, comparamos a senha com o DUMMY_HASH para
    // manter o tempo de resposta idêntico e evitar timing-attacks que descobrem e-mails válidos
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isPasswordValid) {
      // Registra falha no Anti-Brute Force Tracker
      const current = bruteForceTracker.get(trackKey) || { count: 0, firstAttempt: now, lockedUntil: null };
      
      // Se a janela expirou, reinicia a contagem
      if (now - current.firstAttempt > ATTEMPT_WINDOW_MS) {
        current.count = 1;
        current.firstAttempt = now;
        current.lockedUntil = null;
      } else {
        current.count += 1;
      }

      const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - current.count);

      if (current.count >= MAX_FAILED_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_DURATION_MS;
        bruteForceTracker.set(trackKey, current);
        res.status(429).json({
          success: false,
          error: 'Conta temporariamente bloqueada por excesso de tentativas incorretas.',
          details: `Limite de 5 tentativas atingido. Bloqueio de segurança ativo por 5 minutos.`,
          retryAfter: 300,
          isLocked: true
        });
        return;
      }

      bruteForceTracker.set(trackKey, current);

      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas.',
        details: `E-mail ou senha incorretos. Tentativas restantes antes do bloqueio temporário: ${remainingAttempts}.`,
        remainingAttempts
      });
      return;
    }

    // Sucesso: Limpa o tracker de força bruta para o IP/e-mail
    bruteForceTracker.delete(trackKey);

    const safeUser: User = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bannerColor: user.bannerColor,
      bio: user.bio,
      pronouns: user.pronouns,
      themeColor: user.themeColor,
      status: user.status,
      customStatus: user.customStatus,
      role: user.role,
      createdAt: user.createdAt
    };

    const token = jwt.sign(safeUser, config.jwtSecret, {
      expiresIn: '7d'
    });

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso.',
      user: safeUser,
      token
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar login.'
    });
  }
};

/**
 * Atualiza as informações do perfil do usuário autenticado (Banner, Status Contextual, Bio, Pronomes, Tema)
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Não autenticado' });
      return;
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Dados de perfil inválidos.',
        issues: parseResult.error.issues.map(e => e.message)
      });
      return;
    }

    const user = usersDb.get(req.user.email);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
      return;
    }

    // Aplica alterações permitidas
    const updates = parseResult.data;
    if (updates.username) user.username = updates.username;
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;
    if (updates.bannerUrl !== undefined) user.bannerUrl = updates.bannerUrl;
    if (updates.bannerColor) user.bannerColor = updates.bannerColor;
    if (updates.customStatus !== undefined) user.customStatus = updates.customStatus;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.pronouns !== undefined) user.pronouns = updates.pronouns;
    if (updates.themeColor !== undefined) user.themeColor = updates.themeColor;
    if (updates.status) user.status = updates.status;

    usersDb.set(user.email, user);

    const safeUser: User = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bannerColor: user.bannerColor,
      bio: user.bio,
      pronouns: user.pronouns,
      themeColor: user.themeColor,
      status: user.status,
      customStatus: user.customStatus,
      role: user.role,
      createdAt: user.createdAt
    };

    // Gera token atualizado
    const token = jwt.sign(safeUser, config.jwtSecret, {
      expiresIn: '7d'
    });

    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso.',
      user: safeUser,
      token
    });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao atualizar perfil.'
    });
  }
};

/**
 * Retorna os dados do usuário autenticado a partir do token
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Não autenticado' });
    return;
  }

  // Buscar estado atualizado do usuário
  const user = usersDb.get(req.user.email);
  if (!user) {
    res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    return;
  }

  const safeUser: User = {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bannerColor: user.bannerColor,
    bio: user.bio,
    pronouns: user.pronouns,
    themeColor: user.themeColor,
    status: user.status,
    customStatus: user.customStatus,
    role: user.role,
    createdAt: user.createdAt
  };

  res.json({
    success: true,
    user: safeUser
  });
};

/**
 * Retorna todos os usuários para exibição na lista de membros do servidor (sem vazar e-mails privados)
 */
export const getAllMembers = async (_req: Request, res: Response): Promise<void> => {
  const members: User[] = Array.from(usersDb.values()).map(u => ({
    id: u.id,
    username: u.username,
    discriminator: u.discriminator,
    email: '', // Proteção de privacidade: e-mails não são expostos na lista pública de membros
    avatarUrl: u.avatarUrl,
    bannerUrl: u.bannerUrl,
    bannerColor: u.bannerColor,
    bio: u.bio,
    pronouns: u.pronouns,
    themeColor: u.themeColor,
    status: u.status,
    customStatus: u.customStatus,
    role: u.role,
    createdAt: u.createdAt
  }));

  res.json({
    success: true,
    members
  });
};
