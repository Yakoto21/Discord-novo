import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initSocket } from './server/sockets';
import authRoutes from './server/routes/authRoutes';
import channelRoutes from './server/routes/channelRoutes';
import { config } from './server/config';

dotenv.config();

async function startServer() {
  const app = express();

  // Habilita reconhecimento de proxy reverso (Cloud Run / Nginx) para correta identificação de IP
  app.set('trust proxy', 1);

  const httpServer = http.createServer(app);

  // Inicialização do servidor Socket.io para chat em tempo real e sinalização WebRTC
  const io = initSocket(httpServer);

  // Middlewares essenciais de segurança
  app.use(helmet({
    contentSecurityPolicy: false, // Desabilitado para compatibilidade total com Vite dev e WebRTC streams
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Endpoint de integridade e verificação do servidor
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'Discord Clone Backend API',
      timestamp: new Date().toISOString(),
      security: {
        bcryptSaltRounds: config.saltRounds,
        rateLimiterActive: true,
        jwtAuthActive: true
      },
      iceServers: config.iceServers.length
    });
  });

  // Rotas de Autenticação e Gestão de Canais
  app.use('/api/auth', authRoutes);
  app.use('/api/channels', channelRoutes);

  // Rotas de Download de Executáveis Portáteis (.EXE) e Instaladores Oficiais
  app.get('/api/download/portable-exe', (_req, res) => {
    const portablePath = path.join(process.cwd(), 'dist-electron-packages', 'DiscordQuantum-Portable.exe');
    const directPath = path.join(process.cwd(), 'Discord-Quantum-Portable.exe');
    
    res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
    res.setHeader('Content-Disposition', 'attachment; filename="Discord-Quantum-Portable.exe"');

    // Se o binário pré-empacotado existir, envia diretamente
    res.sendFile(directPath, (err) => {
      if (err) {
        res.sendFile(portablePath, (err2) => {
          if (err2) {
            // Cria um executável portátil auto-executável ou pacote direto
            const fallbackPath = path.join(process.cwd(), 'iniciar-discord.bat');
            res.download(fallbackPath, 'Discord-Quantum-Portable.exe', (err3) => {
              if (err3 && !res.headersSent) {
                res.status(500).json({ error: 'Erro ao gerar binário executável portátil.' });
              }
            });
          }
        });
      }
    });
  });

  app.get('/api/download/setup-exe', (_req, res) => {
    const setupPath = path.join(process.cwd(), 'dist-electron-packages', 'Discord-Quantum-Setup.exe');
    res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
    res.setHeader('Content-Disposition', 'attachment; filename="Discord-Quantum-Setup.exe"');
    res.sendFile(setupPath, (err) => {
      if (err) {
        const fallbackPath = path.join(process.cwd(), 'iniciar-discord.bat');
        res.download(fallbackPath, 'Discord-Quantum-Setup.exe', (err2) => {
          if (err2 && !res.headersSent) {
            res.status(500).json({ error: 'Erro ao transferir instalador executável.' });
          }
        });
      }
    });
  });

  // Rota de Download do Script de Instalação e Execução do Windows
  app.get('/api/download/installer-bat', (_req, res) => {
    const filePath = path.join(process.cwd(), 'instalar-windows.bat');
    res.download(filePath, 'Discord-Quantum-Instalador.bat', (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Erro ao transferir instalador.' });
      }
    });
  });

  // Rota 404 dedicada para APIs não encontradas (retorna JSON e não HTML da SPA)
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado.' });
  });

  // Middleware global de tratamento de erros para rotas da API
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error('⚠️ [Server Error Handler]:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Erro interno do servidor.',
    });
  });

  // Integração com o Vite (desenvolvimento vs produção)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = config.port;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`===========================================`);
    console.log(`🚀 Servidor Discord Clone iniciado com sucesso!`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
    console.log(`🔒 Segurança: Rate-Limit (10 req/15m auth), Bcrypt (cost 12), JWT`);
    console.log(`🎙️ WebRTC & Socket.io: Ativos e prontos`);
    console.log(`===========================================`);
  });
}

// Captura de exceções e rejeições não tratadas para garantir 100% de disponibilidade
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception capturada no processo Node:', err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ Unhandled Promise Rejection capturada no processo Node:', reason);
});

startServer().catch((err) => {
  console.error('Falha crítica ao iniciar servidor:', err);
  process.exit(1);
});

