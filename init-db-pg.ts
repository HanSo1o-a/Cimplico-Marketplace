import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-pool';
import * as schema from './shared/schema';

// 创建连接池
const pool = new Pool({ 
  connectionString: 'postgresql://postgres:postgres@localhost:5432/workpaper_market'
});

// 创建 drizzle ORM 实例
const db = drizzle(pool, { schema });

async function initDatabase() {
  console.log('开始初始化数据库...');

  try {
    // 检查是否已有用户数据
    const existingUsers = await db.select().from(schema.users);
    if (existingUsers.length > 0) {
      console.log('数据库已有数据，跳过初始化');
      await pool.end();
      return;
    }

    // 创建管理员账户
    const [admin] = await db.insert(schema.users).values({
      email: 'admin@cimplico.com',
      password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
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
    const [vendor1] = await db.insert(schema.users).values({
      email: 'vendor1@example.com',
      password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
      firstName: '李',
      lastName: '明',
      role: schema.UserRole.VENDOR,
      status: 'ACTIVE',
      avatar: null,
      phone: '13800138000',
      language: 'en'
    }).returning();

    const [vendor2] = await db.insert(schema.users).values({
      email: 'vendor2@example.com',
      password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
      firstName: '王',
      lastName: '芳',
      role: schema.UserRole.VENDOR,
      status: 'ACTIVE',
      avatar: null,
      phone: '13900139000',
      language: 'en'
    }).returning();

    console.log('已创建供应商账户:', vendor1.email, vendor2.email);

    // 创建普通用户
    const [user1] = await db.insert(schema.users).values({
      email: 'user1@example.com',
      password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
      firstName: '张',
      lastName: '伟',
      role: schema.UserRole.USER,
      status: 'ACTIVE',
      avatar: null,
      phone: '13700137000',
      language: 'en'
    }).returning();

    console.log('已创建普通用户:', user1.email);

    // 创建供应商资料
    const [vendorProfile1] = await db.insert(schema.vendorProfiles).values({
      userId: vendor1.id,
      companyName: '安永会计师事务所',
      businessNumber: '91310000000000000X',
      website: 'https://www.ey.com',
      description: '全球领先的会计师事务所之一，提供高质量的审计、税务和咨询服务。',
      verificationStatus: schema.VendorVerificationStatus.APPROVED,
      rejectionReason: null
    }).returning();

    const [vendorProfile2] = await db.insert(schema.vendorProfiles).values({
      userId: vendor2.id,
      companyName: '财务专家团队',
      businessNumber: '91110000000000000Y',
      website: 'https://www.financeexperts.com',
      description: '专业的财务分析和报表工具提供商，致力于提高财务工作效率。',
      verificationStatus: schema.VendorVerificationStatus.APPROVED,
      rejectionReason: null
    }).returning();

    console.log('已创建供应商资料:', vendorProfile1.companyName, vendorProfile2.companyName);

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('初始化数据库时出错:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
