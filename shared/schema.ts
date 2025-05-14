import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 用户角色枚举
export const UserRole = {
  USER: "USER",
  VENDOR: "VENDOR",
  ADMIN: "ADMIN"
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// 用户状态枚举
export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED"
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// 供应商验证状态枚举
export const VendorVerificationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
} as const;
export type VendorVerificationStatus = (typeof VendorVerificationStatus)[keyof typeof VendorVerificationStatus];

// 商品状态枚举
export const ListingStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE"
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

// 商品类型枚举
export const ListingType = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
  DIGITAL: "DIGITAL"
} as const;
export type ListingType = (typeof ListingType)[keyof typeof ListingType];

// 订单状态枚举
export const OrderStatus = {
  CREATED: "CREATED",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED"
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// 支付状态枚举
export const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// 评论状态枚举
export const CommentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
} as const;
export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

// 用户表
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default(UserRole.USER),
  status: text("status").notNull().default(UserStatus.ACTIVE),
  avatar: text("avatar"),
  phone: text("phone"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 供应商资料表
export const vendorProfiles = pgTable("vendor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  businessNumber: text("business_number").notNull(),
  website: text("website"),
  description: text("description"),
  verificationStatus: text("verification_status").notNull().default(VendorVerificationStatus.PENDING),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 商品分类表
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 商品表
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendorProfiles.id),
  categoryId: integer("category_id").references(() => categories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  type: text("type").notNull().default(ListingType.DIGITAL),
  status: text("status").notNull().default(ListingStatus.DRAFT),
  images: json("images").notNull().default([]),
  category: text("category").notNull(), // 保留旧字段用于兼容性
  tags: json("tags").notNull().default([]),
  rejectionReason: text("rejection_reason"),
  downloadUrl: text("download_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 企业表
export const firms = pgTable("firms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 企业白名单用户表
export const firmWhitelistedUsers = pgTable("firm_whitelisted_users", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// 已安装商品表
export const installedListings = pgTable("installed_listings", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  installedAt: timestamp("installed_at").defaultNow(),
  expiresAt: timestamp("expires_at")
});

// 订单表
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default(OrderStatus.CREATED),
  totalAmount: doublePrecision("total_amount").notNull(),
  currency: text("currency").notNull().default("AUD"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 订单项表
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: doublePrecision("unit_price").notNull()
});

// 支付表
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("AUD"),
  status: text("status").notNull().default(PaymentStatus.PENDING),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 评论表
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  status: text("status").notNull().default(CommentStatus.PENDING),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// 用户收藏商品表
export const userSavedListings = pgTable("user_saved_listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  listingId: integer("listing_id").notNull().references(() => listings.id),
  savedAt: timestamp("saved_at").defaultNow()
});

// 商品分类模式
export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true
});

// 创建各个表的插入模式
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  avatar: true,
  phone: true,
  language: true
});

export const insertVendorProfileSchema = createInsertSchema(vendorProfiles).pick({
  userId: true,
  companyName: true,
  businessNumber: true,
  website: true,
  description: true,
  verificationStatus: true,
  rejectionReason: true
});

export const insertListingSchema = createInsertSchema(listings).pick({
  vendorId: true,
  title: true,
  description: true,
  price: true,
  type: true,
  status: true,
  images: true,
  category: true,
  tags: true,
  rejectionReason: true,
  downloadUrl: true
});

export const insertFirmSchema = createInsertSchema(firms).pick({
  name: true,
  description: true
});

export const insertFirmWhitelistedUserSchema = createInsertSchema(firmWhitelistedUsers).pick({
  firmId: true,
  userId: true
});

export const insertInstalledListingSchema = createInsertSchema(installedListings).pick({
  firmId: true,
  listingId: true,
  expiresAt: true
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  totalAmount: true,
  currency: true
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  listingId: true,
  quantity: true,
  unitPrice: true
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  orderId: true,
  amount: true,
  currency: true,
  status: true,
  paymentMethod: true,
  transactionId: true
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  listingId: true,
  content: true,
  rating: true,
  status: true
});

export const insertUserSavedListingSchema = createInsertSchema(userSavedListings).pick({
  userId: true,
  listingId: true
});

// 扩展用户登录模式
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// 注册用户模式
export const registerSchema = insertUserSchema.pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  language: true
}).extend({
  confirmPassword: z.string().min(6)
}).refine((data) => data.password === data.confirmPassword, {
  message: "密码不匹配",
  path: ["confirmPassword"],
});

export type RegisterCredentials = z.infer<typeof registerSchema>;

// Zod schemas for validation
export const insertUserSchemaValidation = createInsertSchema(users);
export const selectUserSchemaValidation = createInsertSchema(users, {
  id: z.number(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum([UserRole.USER, UserRole.VENDOR, UserRole.ADMIN]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const selectVendorProfileSchema = createInsertSchema(vendorProfiles, {
  id: z.number(),
  userId: z.number(),
  companyName: z.string(),
  businessNumber: z.string(), 
  verificationStatus: z.enum([VendorVerificationStatus.PENDING, VendorVerificationStatus.APPROVED, VendorVerificationStatus.REJECTED]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 创建类型定义
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVendorProfile = z.infer<typeof insertVendorProfileSchema>;
export type VendorProfile = typeof vendorProfiles.$inferSelect;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

export type InsertFirm = z.infer<typeof insertFirmSchema>;
export type Firm = typeof firms.$inferSelect;

export type InsertFirmWhitelistedUser = z.infer<typeof insertFirmWhitelistedUserSchema>;
export type FirmWhitelistedUser = typeof firmWhitelistedUsers.$inferSelect;

export type InsertInstalledListing = z.infer<typeof insertInstalledListingSchema>;
export type InstalledListing = typeof installedListings.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertUserSavedListing = z.infer<typeof insertUserSavedListingSchema>;
export type UserSavedListing = typeof userSavedListings.$inferSelect;
