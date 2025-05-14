import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';

// 创建连接池
console.log('创建数据库连接池...');
const pool = new Pool({ 
  connectionString: 'postgresql://postgres:postgres@localhost:5432/workpaper_market'
});

// 创建 drizzle ORM 实例
console.log('创建drizzle ORM实例...');
const db = drizzle(pool, { schema });

async function initDatabase() {
  console.log('开始初始化数据库...');

  try {
    // 检查数据库连接
    console.log('检查数据库连接...');
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('数据库连接成功:', connectionResult.rows[0].now);

    // 检查表结构
    console.log('检查表结构...');
    const tablesResult = await pool.query(
      `SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'`
    );
    console.log('数据库中的表:', tablesResult.rows.map(row => row.table_name));

    // 检查是否已有用户数据
    console.log('检查是否已有用户数据...');
    try {
      const existingUsers = await db.select().from(schema.users);
      console.log('现有用户数:', existingUsers.length);
      
      if (existingUsers.length > 0) {
        console.log('数据库已有数据，跳过初始化');
        return;
      }
    } catch (error) {
      console.error('查询用户数据时出错:', error);
      console.log('可能是users表不存在，需要先运行数据库迁移');
      return;
    }

    console.log('开始创建初始数据...');

    // 创建管理员账户
    console.log('创建管理员账户...');
    const [admin] = await db.insert(schema.users).values({
      email: 'admin@cimplico.com',
      password: '\\\.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
      firstName: 'Admin',
      lastName: 'User',
      role: schema.UserRole.ADMIN,
      status: 'ACTIVE',
      avatar: null,
      phone: null,
      language: 'en'
    }).returning();

    console.log('已创建管理员账户:', admin.email);

    // 创建供应商账户
    console.log('创建供应商账户...');
    const [vendor1] = await db.insert(schema.users).values({
      email: 'vendor1@example.com',
      password: '\\\.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
      firstName: '李',
      lastName: '明',
      role: schema.UserRole.VENDOR,
      status: 'ACTIVE',
      avatar: null,
      phone: '13800138000',
      language: 'en'
    }).returning();

    console.log('已创建供应商账户:', vendor1.email);

    // 创建供应商资料（vendorProfile）
    console.log('为供应商创建 vendorProfile...');
    const [vendorProfile1] = await db.insert(schema.vendorProfiles).values({
      userId: vendor1.id,
      companyName: '李明科技有限公司',
      businessNumber: '1234567890',
      website: 'https://vendor1.example.com',
      description: '主营数字产品与服务',
      verificationStatus: schema.VendorVerificationStatus.APPROVED,
      rejectionReason: null
    }).returning();
    console.log('已创建供应商资料:', vendorProfile1.companyName);

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('初始化数据库时出错:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
