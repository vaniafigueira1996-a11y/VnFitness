import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.warn('⚠️ AVISO: SUPABASE_URL não configurada no arquivo .env');
}

// Cliente padrão para operações autenticadas via token do usuário (respeita RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com permissões de Service Role para operações administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

