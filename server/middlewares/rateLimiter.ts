import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Limitador estrito para rotas de autenticação (Login e Registro).
 * Bloqueia ataques de força bruta (Brute Force), credential stuffing e scripts automatizados.
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimiting.authWindowMs,
  max: config.rateLimiting.authMaxAttempts,
  standardHeaders: true, // Retorna headers `RateLimit-*` padrão
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*` legados
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    success: false,
    error: 'Muitas tentativas de autenticação detectadas para este IP.',
    details: 'Por segurança contra ataques de força bruta, seu acesso foi temporariamente limitado por 15 minutos.',
    retryAfterMinutes: 15,
  },
  statusCode: 429,
  skipSuccessfulRequests: false, // Conta todas as tentativas para evitar enumeração de credenciais
});

/**
 * Limitador geral de API para prevenir Denial of Service (DoS) e raspagem excessiva.
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimiting.apiWindowMs,
  max: config.rateLimiting.apiMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    success: false,
    error: 'Limite de requisições excedido.',
    details: 'Você realizou muitas requisições em um curto período. Aguarde alguns instantes.',
  },
  statusCode: 429,
});
