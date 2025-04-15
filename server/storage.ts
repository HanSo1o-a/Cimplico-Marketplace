import {
  User, VendorProfile, Listing, Firm, FirmWhitelistedUser, InstalledListing,
  Order, OrderItem, Payment, Comment, UserSavedListing,
  InsertUser, InsertVendorProfile, InsertListing, InsertFirm, InsertFirmWhitelistedUser,
  InsertInstalledListing, InsertOrder, InsertOrderItem, InsertPayment, InsertComment,
  InsertUserSavedListing, OrderStatus, PaymentStatus
} from "@shared/schema";
import session from "express-session";
import { DatabaseStorage } from "./storage-db";

// 定义存储接口 
export interface IStorage {
  // 会话存储
  sessionStore: session.Store;

  // 用户相关方法
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // 供应商相关方法
  getVendorProfile(id: number): Promise<VendorProfile | undefined>;
  getVendorProfileByUserId(userId: number): Promise<VendorProfile | undefined>;
  createVendorProfile(profile: InsertVendorProfile): Promise<VendorProfile>;
  updateVendorProfile(id: number, profile: Partial<VendorProfile>): Promise<VendorProfile | undefined>;
  getPendingVendors(): Promise<VendorProfile[]>;
  getApprovedVendors(): Promise<VendorProfile[]>;

  // 商品相关方法
  getListing(id: number): Promise<Listing | undefined>;
  getListingsByVendorId(vendorId: number): Promise<Listing[]>;
  getActiveListings(limit?: number, offset?: number): Promise<Listing[]>;
  getPendingListings(): Promise<Listing[]>;
  getFeaturedListings(limit?: number): Promise<Listing[]>;
  getListingsByCategory(category: string): Promise<Listing[]>;
  searchListings(query: string, filters?: any): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, listing: Partial<Listing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;

  // 企业相关方法
  getFirm(id: number): Promise<Firm | undefined>;
  createFirm(firm: InsertFirm): Promise<Firm>;

  // 企业白名单用户相关方法
  addUserToFirmWhitelist(data: InsertFirmWhitelistedUser): Promise<FirmWhitelistedUser>;
  removeUserFromFirmWhitelist(firmId: number, userId: number): Promise<boolean>;

  // 已安装商品相关方法
  installListingForFirm(data: InsertInstalledListing): Promise<InstalledListing>;
  getInstalledListingsByFirmId(firmId: number): Promise<InstalledListing[]>;

  // 订单相关方法
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrdersByVendorId(vendorId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined>;

  // 订单项相关方法
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // 支付相关方法
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByOrderId(orderId: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: PaymentStatus, transactionId?: string): Promise<Payment | undefined>;

  // 评论相关方法
  getCommentsByListingId(listingId: number): Promise<Comment[]>;
  getCommentsByUserId(userId: number): Promise<Comment[]>;
  getPendingComments(): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateCommentStatus(id: number, status: string, reason?: string): Promise<Comment | undefined>;

  // 用户收藏相关方法
  getUserSavedListings(userId: number): Promise<Listing[]>;
  saveListingForUser(data: InsertUserSavedListing): Promise<UserSavedListing>;
  removeSavedListing(userId: number, listingId: number): Promise<boolean>;
  isListingSavedByUser(userId: number, listingId: number): Promise<boolean>;
}

// 导出存储实例
export const storage = new DatabaseStorage();