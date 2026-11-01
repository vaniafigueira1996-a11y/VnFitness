import { supabase, supabaseAdmin } from '../config/supabase.js';
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido' });
    }
    const token = authHeader.split(' ')[1];
    try {
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
    }
    catch (err) {
        return res.status(500).json({ error: 'Erro ao validar autenticação', details: err });
    }
};
export const requireApprovedUser = (req, res, next) => {
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
export const requireAdminOnly = (req, res, next) => {
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
