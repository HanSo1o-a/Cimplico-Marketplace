import { db } from "../server/db";
import {
  users, vendorProfiles, listings, orders, orderItems, payments,
  UserRole, UserStatus, VendorVerificationStatus, ListingStatus, ListingType,
  OrderStatus, PaymentStatus
} from "../shared/schema";
import { scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = "testSalt"; // 为了测试数据保持一致性使用固定salt
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function generateTestData() {
  console.log("开始生成测试数据...");

  // 检查是否已有数据
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length > 4) { // 已有足够测试数据
    console.log("数据库中已有测试数据，跳过生成过程。");
    return;
  }

  // 生成更多用户
  const password = await hashPassword("password123");
  const newUsers = [
    {
      email: "user2@example.com",
      password,
      firstName: "周",
      lastName: "杰",
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      phone: "13800138001",
      language: "zh"
    },
    {
      email: "user3@example.com",
      password,
      firstName: "赵",
      lastName: "丽",
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      phone: "13800138002",
      language: "zh"
    },
    {
      email: "vendor3@example.com",
      password,
      firstName: "陈",
      lastName: "明",
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      phone: "13900139001",
      language: "zh"
    },
    {
      email: "vendor4@example.com",
      password,
      firstName: "林",
      lastName: "小",
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      phone: "13900139002",
      language: "zh"
    }
  ];

  for (const user of newUsers) {
    await db.insert(users).values(user);
  }

  // 获取所有用户列表
  const allUsers = await db.select().from(users);
  const userMap = new Map(allUsers.map(u => [u.email, u]));

  // 生成更多供应商资料
  const newVendorProfiles = [
    {
      userId: userMap.get("vendor3@example.com")?.id,
      companyName: "普华永道",
      businessNumber: "91110000000000001Z",
      website: "https://www.pwc.com",
      description: "全球领先的会计师事务所，提供审计、税务和咨询服务。",
      verificationStatus: VendorVerificationStatus.APPROVED,
      rejectionReason: ""
    },
    {
      userId: userMap.get("vendor4@example.com")?.id,
      companyName: "税务专家",
      businessNumber: "91110000000000002Z",
      website: "https://www.taxexperts.com",
      description: "专注于提供税务咨询和规划服务的公司。",
      verificationStatus: VendorVerificationStatus.PENDING,
      rejectionReason: ""
    }
  ];

  for (const profile of newVendorProfiles) {
    await db.insert(vendorProfiles).values(profile);
  }

  // 获取所有供应商列表
  const allVendors = await db.select().from(vendorProfiles);
  const vendorMap = new Map(allVendors.map(v => [v.userId, v]));

  // 生成更多商品
  const newListings = [
    {
      vendorId: vendorMap.get(userMap.get("vendor3@example.com")?.id)?.id,
      title: "增值税申报辅助工具",
      description: "快速准确计算增值税，自动生成申报表格，提高申报效率和准确性。",
      price: 129,
      type: ListingType.DIGITAL,
      status: ListingStatus.ACTIVE,
      images: JSON.stringify(["https://images.unsplash.com/photo-1554224155-6d2f99c7dff1"]),
      category: "税务申报",
      tags: JSON.stringify(["增值税", "申报", "计算工具"]),
      rejectionReason: "",
      downloadUrl: "https://example.com/files/vat-tool.xlsx"
    },
    {
      vendorId: vendorMap.get(userMap.get("vendor3@example.com")?.id)?.id,
      title: "财务报表分析工具包",
      description: "全面的财务报表分析工具，支持资产负债表、利润表和现金流量表分析，生成专业可视化图表。",
      price: 259,
      type: ListingType.DIGITAL,
      status: ListingStatus.ACTIVE,
      images: JSON.stringify(["https://images.unsplash.com/photo-1460925895917-afdab827c52f"]),
      category: "财务分析",
      tags: JSON.stringify(["财务报表", "分析", "可视化"]),
      rejectionReason: "",
      downloadUrl: "https://example.com/files/financial-analysis-toolkit.xlsx"
    },
    {
      vendorId: vendorMap.get(userMap.get("vendor1@example.com")?.id)?.id,
      title: "企业合规评估清单",
      description: "全面的企业合规评估清单，涵盖法律、财务、运营等多个方面，帮助企业识别潜在风险。",
      price: 199,
      type: ListingType.DIGITAL,
      status: ListingStatus.PENDING,
      images: JSON.stringify(["https://images.unsplash.com/photo-1450101499163-c8848c66ca85"]),
      category: "合规检查",
      tags: JSON.stringify(["合规", "风险管理", "评估"]),
      rejectionReason: "",
      downloadUrl: "https://example.com/files/compliance-checklist.xlsx"
    },
    {
      vendorId: vendorMap.get(userMap.get("vendor4@example.com")?.id)?.id,
      title: "小型企业税务规划指南",
      description: "专为小型企业设计的税务规划指南，帮助优化税务结构，合法节税。",
      price: 149,
      type: ListingType.DIGITAL,
      status: ListingStatus.PENDING,
      images: JSON.stringify(["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab"]),
      category: "税务规划",
      tags: JSON.stringify(["小型企业", "税务规划", "节税"]),
      rejectionReason: "",
      downloadUrl: "https://example.com/files/tax-planning-guide.pdf"
    }
  ];

  for (const listing of newListings) {
    await db.insert(listings).values(listing);
  }

  // 获取所有商品列表
  const allListings = await db.select().from(listings);

  // 生成更多订单
  // 用户2购买商品1
  const user2 = userMap.get("user2@example.com");
  const listing1 = allListings[0];
  
  if (user2 && listing1) {
    // 创建订单
    const [order1] = await db.insert(orders).values({
      userId: user2.id,
      status: OrderStatus.PAID,
      totalAmount: listing1.price,
      currency: "CNY"
    }).returning();

    // 创建订单项
    await db.insert(orderItems).values({
      orderId: order1.id,
      listingId: listing1.id,
      quantity: 1,
      unitPrice: listing1.price
    });

    // 创建支付记录
    await db.insert(payments).values({
      orderId: order1.id,
      amount: order1.totalAmount,
      currency: order1.currency,
      status: PaymentStatus.COMPLETED,
      paymentMethod: "creditCard",
      transactionId: `TX${Date.now()}1`
    });
  }

  // 用户3购买商品2和商品3
  const user3 = userMap.get("user3@example.com");
  const listing2 = allListings[1];
  const listing3 = allListings[2];
  
  if (user3 && listing2 && listing3) {
    // 创建订单
    const [order2] = await db.insert(orders).values({
      userId: user3.id,
      status: OrderStatus.COMPLETED,
      totalAmount: listing2.price + listing3.price,
      currency: "CNY"
    }).returning();

    // 创建订单项
    await db.insert(orderItems).values({
      orderId: order2.id,
      listingId: listing2.id,
      quantity: 1,
      unitPrice: listing2.price
    });

    await db.insert(orderItems).values({
      orderId: order2.id,
      listingId: listing3.id,
      quantity: 1,
      unitPrice: listing3.price
    });

    // 创建支付记录
    await db.insert(payments).values({
      orderId: order2.id,
      amount: order2.totalAmount,
      currency: order2.currency,
      status: PaymentStatus.COMPLETED,
      paymentMethod: "alipay",
      transactionId: `TX${Date.now()}2`
    });
  }

  console.log("测试数据生成完成！");
}

// 执行生成函数
generateTestData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("生成测试数据时发生错误:", error);
    process.exit(1);
  });