import bcrypt from 'bcryptjs';

const ACCESS_TOKEN = 'sbp_fc8c24f3dee483ee4606e3378d9706dcb5ad8236';
const PROJECT_ID = 'sothigunxokciqpsuhmn';

async function main() {
  const hash = bcrypt.hashSync('SophiA27', 10);
  console.log('Gerado hash bcrypt:', hash);

  const sql = `UPDATE auth.users SET encrypted_password = '${hash}' WHERE email = 'fredsoncitty@gmail.com';`;

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('Update status:', res.status);
  const data = await res.json();
  console.log('Resultado:', data);
}

main().catch(console.error);

