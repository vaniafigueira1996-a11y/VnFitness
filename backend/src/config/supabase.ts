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
const DEFAULT_URL = 'https://grcdfegtnnsxtsqudhts.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2RmZWd0bm5zeHRzcXVkaHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjA2MjEsImV4cCI6MjEwNzgzNjYyMX0.cJ32I7XnhqaXHGPR1dflYqHb0m0Fg1_Olu1NgKnwTSc';
const DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyY2RmZWd0bm5zeHRzcXVkaHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjA2MjEsImV4cCI6MjEwNzgzNjYyMX0.cJ32I7XnhqaXHGPR1dflYqHb0m0Fg1_Olu1NgKnwTSc';

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
