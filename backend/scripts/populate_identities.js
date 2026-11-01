const ACCESS_TOKEN = 'sbp_fc8c24f3dee483ee4606e3378d9706dcb5ad8236';
const PROJECT_ID = 'sothigunxokciqpsuhmn';

async function main() {
  const sql = `
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    SELECT 
      gen_random_uuid(),
      u.id,
      jsonb_build_object('sub', u.id::text, 'email', u.email),
      'email',
      u.id::text,
      now(),
      now()
    FROM auth.users u
    ON CONFLICT DO NOTHING;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('Status identities:', res.status);
  const data = await res.json();
  console.log('Result:', data);
}

main().catch(console.error);
