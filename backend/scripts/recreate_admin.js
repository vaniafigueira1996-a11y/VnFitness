const ACCESS_TOKEN = 'sbp_fc8c24f3dee483ee4606e3378d9706dcb5ad8236';
const PROJECT_ID = 'sothigunxokciqpsuhmn';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdGhpZ3VueG9rY2lxcHN1aG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDA4MDIsImV4cCI6MjEwOTExNjgwMn0.xbi6R-xNxTMXs4fMm9Rt81Y4XYgs3xnf-tj5OcPj0QA';

async function recreateAdmin() {
  // 1. Deleta do auth.users (cascateia para public.usuarios)
  await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `DELETE FROM auth.users WHERE email = 'fredsoncitty@gmail.com';` })
  });
  console.log('Admin anterior removido.');

  // 2. Faz SignUp oficial com GoTrue
  const signupRes = await fetch(`https://${PROJECT_ID}.supabase.co/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'fredsoncitty@gmail.com',
      password: 'SophiA27',
      data: { nome_completo: 'Fredson Citty' }
    })
  });
  const signupData = await signupRes.json();
  console.log('SignUp Admin Status:', signupRes.status, 'ID:', signupData.user?.id);

  const adminId = signupData.user?.id;
  if (adminId) {
    // 3. Garante role admin e status aprovado
    const sql = `
      UPDATE public.usuarios SET role = 'admin', status_aprovacao = 'aprovado' WHERE id = '${adminId}';
      DELETE FROM public.dados_biometricos WHERE usuario_id = '${adminId}';
      INSERT INTO public.dados_biometricos (usuario_id, peso_kg, altura_m, idade, imc, classificacao_imc, peso_ideal_min, peso_ideal_max, diferenca_peso_meta)
      VALUES ('${adminId}', 83.0, 1.78, 28, 26.20, 'Sobrepeso Leve', 59.0, 79.0, -4.0);
      DELETE FROM public.checkins_treino WHERE usuario_id = '${adminId}';
      INSERT INTO public.checkins_treino (usuario_id, data_treino, duracao_min, intensidade, carga_total_kg, exercicio_destaque)
      VALUES ('${adminId}', CURRENT_DATE, 50, 5, 58.0, 'Remada curvada');
    `;

    await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    console.log('✅ Admin promovido e dados biométricos e checkin inseridos com sucesso!');
  }
}

recreateAdmin().catch(console.error);

