import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Carrega .env da raiz ou da pasta backend se existirem
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl) {
    console.warn('⚠️ AVISO: SUPABASE_URL não configurada no ambiente/arquivo .env');
}
// Fallback seguro caso as variáveis ainda não tenham sido configuradas na Vercel
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveAnonKey = supabaseAnonKey || 'placeholder-anon-key';
const effectiveServiceKey = supabaseServiceRoleKey || effectiveAnonKey;
// Cliente padrão para operações autenticadas via token do usuário (respeita RLS)
export const supabase = createClient(effectiveUrl, effectiveAnonKey);
// Cliente com permissões de Service Role para operações administrativas
export const supabaseAdmin = createClient(effectiveUrl, effectiveServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
