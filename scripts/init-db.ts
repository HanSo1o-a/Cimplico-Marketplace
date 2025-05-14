import { db, pool } from "../server/db";
import {
  users, vendorProfiles, listings,
  UserRole, VendorVerificationStatus, ListingStatus
} from "../shared/schema";

async function initDatabase() {
  console.log("开始初始化数据库...");

  try {
    // 检查是否已有用户数据
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("数据库已有数据，跳过初始化");
      await pool.end();
      return;
    }

    // 创建管理员账户
    const [admin] = await db.insert(users).values({
      email: "admin@cimplico.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      status: "ACTIVE",
      avatar: null,
      phone: null,
      language: "en"
    }).returning();

    console.log("已创建管理员账户:", admin.email);

    // 创建供应商账户
    const [vendor1] = await db.insert(users).values({
      email: "vendor1@example.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "李",
      lastName: "明",
      role: UserRole.VENDOR,
      status: "ACTIVE",
      avatar: null,
      phone: "13800138000",
      language: "en"
    }).returning();

    const [vendor2] = await db.insert(users).values({
      email: "vendor2@example.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "王",
      lastName: "芳",
      role: UserRole.VENDOR,
      status: "ACTIVE",
      avatar: null,
      phone: "13900139000",
      language: "en"
    }).returning();

    console.log("已创建供应商账户:", vendor1.email, vendor2.email);

    // 创建普通用户
    const [user1] = await db.insert(users).values({
      email: "user1@example.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "张",
      lastName: "伟",
      role: UserRole.USER,
      status: "ACTIVE",
      avatar: null,
      phone: "13700137000",
      language: "en"
    }).returning();

    console.log("已创建普通用户:", user1.email);

    // 创建供应商资料
    const [vendorProfile1] = await db.insert(vendorProfiles).values({
      userId: vendor1.id,
      companyName: "安永会计师事务所",
      businessNumber: "91310000000000000X",
      website: "https://www.ey.com",
      description: "全球领先的会计师事务所之一，提供高质量的审计、税务和咨询服务。",
      verificationStatus: VendorVerificationStatus.APPROVED,
      rejectionReason: null
    }).returning();

    const [vendorProfile2] = await db.insert(vendorProfiles).values({
      userId: vendor2.id,
      companyName: "财务专家团队",
      businessNumber: "91110000000000000Y",
      website: "https://www.financeexperts.com",
      description: "专业的财务分析和报表工具提供商，致力于提高财务工作效率。",
      verificationStatus: VendorVerificationStatus.APPROVED,
      rejectionReason: null
    }).returning();

    console.log("已创建供应商资料:", vendorProfile1.companyName, vendorProfile2.companyName);

    // 创建商品
    const listing1 = await db.insert(listings).values({
      vendorId: vendorProfile1.id,
      title: "企业内控合规检查清单",
      description: "全面的企业内部控制合规检查清单，包含财务、运营、法规等多个维度的检查项目。",
      price: 0,
      type: "DIGITAL",
      status: ListingStatus.ACTIVE,
      images: ["https://images.unsplash.com/photo-1586282391848-2443f0b8865b"],
      category: "合规检查",
      tags: ["内控", "合规", "风险管理"],
      rejectionReason: null,
      downloadUrl: "https://example.com/files/compliance-checklist.xlsx"
    }).returning();

    const listing2 = await db.insert(listings).values({
      vendorId: vendorProfile2.id,
      title: "全面财务分析Excel模板",
      description: "一款专业的财务分析工具，包含多种比率分析、趋势分析和预测功能，适用于企业财务部门。",
      price: 199,
      type: "DIGITAL",
      status: ListingStatus.ACTIVE,
      images: ["https://images.unsplash.com/photo-1554224155-8d04cb21cd6c"],
      category: "财务分析",
      tags: ["财务", "分析", "预测"],
      rejectionReason: null,
      downloadUrl: "https://example.com/files/financial-analysis.xlsx"
    }).returning();

    const listing3 = await db.insert(listings).values({
      vendorId: vendorProfile1.id,
      title: "标准审计工作底稿集合",
      description: "符合最新审计准则的工作底稿模板集合，包含计划、执行、复核等各阶段的文档。",
      price: 299,
      type: "DIGITAL",
      status: ListingStatus.ACTIVE,
      images: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"],
      category: "审计工作底稿",
      tags: ["审计", "工作底稿", "模板"],
      rejectionReason: null,
      downloadUrl: "https://example.com/files/audit-workpapers.zip"
    }).returning();

    const listing4 = await db.insert(listings).values({
      vendorId: vendorProfile2.id,
      title: "企业所得税自动计算工具",
      description: "自动计算企业所得税的Excel工具，内置最新税率表和减免政策，简化tax declaration流程。",
      price: 159,
      type: "DIGITAL",
      status: ListingStatus.ACTIVE,
      images: ["https://images.unsplash.com/photo-1526304640581-d334cdbbf45e"],
      category: "tax declaration",
      tags: ["税务", "企业所得税", "计算工具"],
      rejectionReason: null,
      downloadUrl: "https://example.com/files/income-tax-calculator.xlsx"
    }).returning();

    console.log("已创建商品:", 
      listing1[0].title, 
      listing2[0].title, 
      listing3[0].title, 
      listing4[0].title
    );

    console.log("数据库初始化完成");
  } catch (error) {
    console.error("初始化数据库时出错:", error);
  } finally {
    await pool.end();
  }
}

initDatabase();