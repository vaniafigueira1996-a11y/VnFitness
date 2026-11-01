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

// Credenciais padrão do projeto VnFitness (garantia absoluta de funcionamento mesmo sem .env na Vercel)
const DEFAULT_URL = 'https://sothigunxokciqpsuhmn.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable__jMC3dQUX8pDF6x99K2Oog__ZLCsaEH';
const DEFAULT_SERVICE_KEY = 'sb_secret_hiwascfg7SwuEFLDcSo3bQ_kDRe81tm';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY;

// Cliente padrão para operações autenticadas via token do usuário (respeita RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com permissões de Service Role para operações administrativas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
