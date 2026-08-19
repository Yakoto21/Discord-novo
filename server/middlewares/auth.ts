import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : (req.cookies?.token || null);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Acesso não autorizado.',
      details: 'Token de autenticação ausente. Por favor, faça login.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as User;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Sessão expirada.',
        details: 'Seu token expirou. Realize login novamente para continuar.'
      });
      return;
    }

    res.status(403).json({
      success: false,
      error: 'Token inválido.',
      details: 'Falha na validação da assinatura criptográfica do token.'
    });
  }
};
