// reset-admin-password.js
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/workpaper_market'
  });

  await client.connect();

  // 管理员邮箱
  const email = 'admin@cimplico.com';
  // bcrypt 加密后的 admin123
  const password = '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2';

  const res = await client.query(
    'UPDATE users SET password = $1 WHERE email = $2',
    [password, email]
  );

  console.log('更新结果:', res.rowCount, '行受影响');
  await client.end();
}

main().catch(err => {
  console.error('执行出错:', err);
  process.exit(1);
});
