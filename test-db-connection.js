const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({ 
    connectionString: 'postgresql://postgres:postgres@localhost:5432/workpaper_market'
  });
  
  try {
    console.log('尝试连接到数据库...');
    const result = await pool.query('SELECT NOW()');
    console.log('数据库连接成功:', result.rows[0].now);
    // 检查所有表
    try {
      const tablesResult = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      console.log('数据库中的表:', tablesResult.rows.map(row => row.table_name));
    } catch (error) {
      console.error('查询表结构时出错:', error);
    }
    await pool.end();
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

testConnection();
