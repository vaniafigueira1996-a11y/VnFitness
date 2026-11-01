const ACCESS_TOKEN = 'sbp_fc8c24f3dee483ee4606e3378d9706dcb5ad8236';
const PROJECT_ID = 'sothigunxokciqpsuhmn';

async function main() {
  const sql = `
    UPDATE auth.users
    SET 
      created_at = COALESCE(created_at, now()),
      updated_at = COALESCE(updated_at, now()),
      aud = 'authenticated',
      role = 'authenticated',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb),
      is_super_admin = COALESCE(is_super_admin, false);
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('Update auth.users status:', res.status);
  const data = await res.json();
  console.log('Resultado:', data);
}

main().catch(console.error);

