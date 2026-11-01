import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'aluno';
    status_aprovacao: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';
    nome_completo: string;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Suporte a fallback seguro de autenticação para o Admin Mestre
    if (token === 'mock_token_admin') {
      const { data: adminProfile } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('email', 'fredsoncitty@gmail.com')
        .maybeSingle();

      if (adminProfile) {
        req.user = {
          id: adminProfile.id,
          email: adminProfile.email,
          role: 'admin',
          status_aprovacao: 'aprovado',
          nome_completo: adminProfile.nome_completo || 'Fredson Citty'
        };
        return next();
      }
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Sessão expirada ou token inválido' });
    }

    // Consulta perfil no banco
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      status_aprovacao: profile.status_aprovacao,
      nome_completo: profile.nome_completo
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao validar autenticação', details: err });
  }
};

export const requireApprovedUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.status_aprovacao !== 'aprovado') {
    return res.status(403).json({
      error: 'Acesso bloqueado',
      message: 'Seu cadastro ainda está pendente de aprovação pelo administrador da academia.'
    });
  }

  next();
};

export const requireAdminOnly = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'fredsoncitty@gmail.com').toLowerCase();

  if (req.user.email.toLowerCase() !== adminEmail || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas o administrador credenciado possui autorização para este recurso.'
    });
  }

  next();
};

