import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';

async function main() {
  console.log('Consultando usuários do auth no Supabase...');
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('Erro ao listar usuários:', error);
    process.exit(1);
  }

  const fred = data.users.find(u => u.email === 'fredsoncitty@gmail.com');
  if (fred) {
    console.log('Atualizando senha de:', fred.email, fred.id);
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(fred.id, {
      password: 'SophiA27',
      email_confirm: true
    });
    if (updErr) console.error('Erro ao atualizar senha:', updErr);
    else console.log('✅ Senha do admin atualizada com sucesso!');
  } else {
    console.log('Criando admin master...');
    const { data: newUser, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: 'fredsoncitty@gmail.com',
      password: 'SophiA27',
      email_confirm: true,
      user_metadata: { nome_completo: 'Fredson Citty' }
    });
    if (cErr) console.error('Erro ao criar admin:', cErr);
    else console.log('✅ Admin criado com sucesso:', newUser.user.id);
  }

  // Garante na tabela usuarios
  const finalId = fred?.id || (await supabaseAdmin.from('usuarios').select('id').eq('email', 'fredsoncitty@gmail.com').single()).data?.id;
  if (finalId) {
    await supabaseAdmin.from('usuarios').upsert({
      id: finalId,
      email: 'fredsoncitty@gmail.com',
      nome_completo: 'Fredson Citty',
      role: 'admin',
      status_aprovacao: 'aprovado'
    });
    console.log('✅ Perfil sincronizado em public.usuarios');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

