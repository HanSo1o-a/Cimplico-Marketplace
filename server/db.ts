import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// 检查环境变量
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL必须设置。你是否忘记配置数据库？"
  );
}

// 创建连接池
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// 创建drizzle ORM实例
export const db = drizzle(pool, { schema });

// 检查数据库连接
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('数据库连接成功:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}
