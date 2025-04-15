import {
  User, VendorProfile, Listing, Firm, FirmWhitelistedUser, InstalledListing,
  Order, OrderItem, Payment, Comment, UserSavedListing,
  InsertUser, InsertVendorProfile, InsertListing, InsertFirm, InsertFirmWhitelistedUser,
  InsertInstalledListing, InsertOrder, InsertOrderItem, InsertPayment, InsertComment,
  InsertUserSavedListing, ListingStatus, VendorVerificationStatus, UserRole, OrderStatus, PaymentStatus
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// 修改接口以包含所有CRUD方法
export interface IStorage {
  // 会话存储
  sessionStore: session.SessionStore;

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

export class MemStorage implements IStorage {
  // 存储数据的映射
  private users: Map<number, User>;
  private vendorProfiles: Map<number, VendorProfile>;
  private listings: Map<number, Listing>;
  private firms: Map<number, Firm>;
  private firmWhitelistedUsers: Map<number, FirmWhitelistedUser>;
  private installedListings: Map<number, InstalledListing>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private payments: Map<number, Payment>;
  private comments: Map<number, Comment>;
  private userSavedListings: Map<number, UserSavedListing>;

  // 当前ID计数器
  private userIdCounter: number;
  private vendorProfileIdCounter: number;
  private listingIdCounter: number;
  private firmIdCounter: number;
  private firmWhitelistedUserIdCounter: number;
  private installedListingIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private paymentIdCounter: number;
  private commentIdCounter: number;
  private userSavedListingIdCounter: number;

  // 会话存储
  sessionStore: session.SessionStore;

  constructor() {
    // 初始化存储
    this.users = new Map();
    this.vendorProfiles = new Map();
    this.listings = new Map();
    this.firms = new Map();
    this.firmWhitelistedUsers = new Map();
    this.installedListings = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.payments = new Map();
    this.comments = new Map();
    this.userSavedListings = new Map();

    // 初始化ID计数器
    this.userIdCounter = 1;
    this.vendorProfileIdCounter = 1;
    this.listingIdCounter = 1;
    this.firmIdCounter = 1;
    this.firmWhitelistedUserIdCounter = 1;
    this.installedListingIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.paymentIdCounter = 1;
    this.commentIdCounter = 1;
    this.userSavedListingIdCounter = 1;

    // 初始化会话存储
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24小时清理过期会话
    });

    // 初始化管理员账户
    this.createUser({
      email: "admin@cimplico.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      status: "ACTIVE",
      avatar: null,
      phone: null,
      language: "zh"
    });

    // 初始化一些示例数据
    this.initDemoData();
  }

  // 初始化示例数据
  private async initDemoData() {
    // 创建一些示例供应商
    const vendor1 = await this.createUser({
      email: "vendor1@example.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "李",
      lastName: "明",
      role: UserRole.VENDOR,
      status: "ACTIVE",
      avatar: null,
      phone: "13800138000",
      language: "zh"
    });

    const vendor2 = await this.createUser({
      email: "vendor2@example.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "王",
      lastName: "芳",
      role: UserRole.VENDOR,
      status: "ACTIVE",
      avatar: null,
      phone: "13900139000",
      language: "zh"
    });

    // 创建供应商资料
    const vendorProfile1 = await this.createVendorProfile({
      userId: vendor1.id,
      companyName: "安永会计师事务所",
      businessNumber: "91310000000000000X",
      website: "https://www.ey.com",
      description: "全球领先的会计师事务所之一，提供高质量的审计、税务和咨询服务。",
      verificationStatus: VendorVerificationStatus.APPROVED,
      rejectionReason: null
    });

    const vendorProfile2 = await this.createVendorProfile({
      userId: vendor2.id,
      companyName: "财务专家团队",
      businessNumber: "91110000000000000Y",
      website: "https://www.financeexperts.com",
      description: "专业的财务分析和报表工具提供商，致力于提高财务工作效率。",
      verificationStatus: VendorVerificationStatus.APPROVED,
      rejectionReason: null
    });

    // 创建一些示例商品
    await this.createListing({
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
    });

    await this.createListing({
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
    });

    await this.createListing({
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
    });

    await this.createListing({
      vendorId: vendorProfile2.id,
      title: "企业所得税自动计算工具",
      description: "自动计算企业所得税的Excel工具，内置最新税率表和减免政策，简化税务申报流程。",
      price: 159,
      type: "DIGITAL",
      status: ListingStatus.ACTIVE,
      images: ["https://images.unsplash.com/photo-1526304640581-d334cdbbf45e"],
      category: "税务申报",
      tags: ["税务", "企业所得税", "计算工具"],
      rejectionReason: null,
      downloadUrl: "https://example.com/files/income-tax-calculator.xlsx"
    });

    // 创建普通用户
    const user1 = await this.createUser({
      email: "user1@example.com",
      password: "$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2", // 密码: admin123
      firstName: "张",
      lastName: "伟",
      role: UserRole.USER,
      status: "ACTIVE",
      avatar: null,
      phone: "13700137000",
      language: "zh"
    });
  }

  //=======================
  // 用户相关方法实现
  //=======================
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const now = new Date();
    const user: User = {
      id: this.userIdCounter++,
      ...userData,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  //=======================
  // 供应商相关方法实现
  //=======================
  async getVendorProfile(id: number): Promise<VendorProfile | undefined> {
    return this.vendorProfiles.get(id);
  }

  async getVendorProfileByUserId(userId: number): Promise<VendorProfile | undefined> {
    for (const profile of this.vendorProfiles.values()) {
      if (profile.userId === userId) {
        return profile;
      }
    }
    return undefined;
  }

  async createVendorProfile(profileData: InsertVendorProfile): Promise<VendorProfile> {
    const now = new Date();
    const profile: VendorProfile = {
      id: this.vendorProfileIdCounter++,
      ...profileData,
      createdAt: now,
      updatedAt: now
    };
    this.vendorProfiles.set(profile.id, profile);
    return profile;
  }

  async updateVendorProfile(id: number, profileData: Partial<VendorProfile>): Promise<VendorProfile | undefined> {
    const profile = this.vendorProfiles.get(id);
    if (!profile) return undefined;

    const updatedProfile = {
      ...profile,
      ...profileData,
      updatedAt: new Date()
    };
    this.vendorProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async getPendingVendors(): Promise<VendorProfile[]> {
    return Array.from(this.vendorProfiles.values())
      .filter(profile => profile.verificationStatus === VendorVerificationStatus.PENDING);
  }

  async getApprovedVendors(): Promise<VendorProfile[]> {
    return Array.from(this.vendorProfiles.values())
      .filter(profile => profile.verificationStatus === VendorVerificationStatus.APPROVED);
  }

  //=======================
  // 商品相关方法实现
  //=======================
  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async getListingsByVendorId(vendorId: number): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.vendorId === vendorId);
  }

  async getActiveListings(limit: number = 10, offset: number = 0): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.status === ListingStatus.ACTIVE)
      .slice(offset, offset + limit);
  }

  async getPendingListings(): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.status === ListingStatus.PENDING);
  }

  async getFeaturedListings(limit: number = 4): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => listing.status === ListingStatus.ACTIVE)
      .slice(0, limit);
  }

  async getListingsByCategory(category: string): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(listing => 
        listing.status === ListingStatus.ACTIVE && 
        listing.category.toLowerCase() === category.toLowerCase()
      );
  }

  async searchListings(query: string, filters?: any): Promise<Listing[]> {
    const searchTerm = query.toLowerCase();
    
    return Array.from(this.listings.values())
      .filter(listing => {
        // 基本过滤：只返回激活状态的商品
        if (listing.status !== ListingStatus.ACTIVE) return false;
        
        // 搜索词匹配
        const matchesSearch = !query || 
          listing.title.toLowerCase().includes(searchTerm) || 
          listing.description.toLowerCase().includes(searchTerm) ||
          (listing.tags as string[]).some(tag => tag.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
        
        // 应用额外过滤条件
        if (!filters) return true;
        
        // 分类过滤
        if (filters.category && filters.category !== 'all' && 
            listing.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
        
        // 价格范围过滤
        if (filters.minPrice !== undefined && listing.price < filters.minPrice) {
          return false;
        }
        
        if (filters.maxPrice !== undefined && filters.maxPrice > 0 && listing.price > filters.maxPrice) {
          return false;
        }
        
        // 标签过滤
        if (filters.tags && filters.tags.length > 0) {
          const listingTags = listing.tags as string[];
          if (!filters.tags.some((tag: string) => listingTags.includes(tag))) {
            return false;
          }
        }
        
        return true;
      });
  }

  async createListing(listingData: InsertListing): Promise<Listing> {
    const now = new Date();
    const listing: Listing = {
      id: this.listingIdCounter++,
      ...listingData,
      createdAt: now,
      updatedAt: now
    };
    this.listings.set(listing.id, listing);
    return listing;
  }

  async updateListing(id: number, listingData: Partial<Listing>): Promise<Listing | undefined> {
    const listing = this.listings.get(id);
    if (!listing) return undefined;

    const updatedListing = {
      ...listing,
      ...listingData,
      updatedAt: new Date()
    };
    this.listings.set(id, updatedListing);
    return updatedListing;
  }

  async deleteListing(id: number): Promise<boolean> {
    return this.listings.delete(id);
  }

  //=======================
  // 企业相关方法实现
  //=======================
  async getFirm(id: number): Promise<Firm | undefined> {
    return this.firms.get(id);
  }

  async createFirm(firmData: InsertFirm): Promise<Firm> {
    const now = new Date();
    const firm: Firm = {
      id: this.firmIdCounter++,
      ...firmData,
      createdAt: now,
      updatedAt: now
    };
    this.firms.set(firm.id, firm);
    return firm;
  }

  //=======================
  // 企业白名单用户相关方法实现
  //=======================
  async addUserToFirmWhitelist(data: InsertFirmWhitelistedUser): Promise<FirmWhitelistedUser> {
    const now = new Date();
    const whitelistedUser: FirmWhitelistedUser = {
      id: this.firmWhitelistedUserIdCounter++,
      ...data,
      createdAt: now
    };
    this.firmWhitelistedUsers.set(whitelistedUser.id, whitelistedUser);
    return whitelistedUser;
  }

  async removeUserFromFirmWhitelist(firmId: number, userId: number): Promise<boolean> {
    for (const [id, whitelistedUser] of this.firmWhitelistedUsers.entries()) {
      if (whitelistedUser.firmId === firmId && whitelistedUser.userId === userId) {
        return this.firmWhitelistedUsers.delete(id);
      }
    }
    return false;
  }

  //=======================
  // 已安装商品相关方法实现
  //=======================
  async installListingForFirm(data: InsertInstalledListing): Promise<InstalledListing> {
    const now = new Date();
    const installedListing: InstalledListing = {
      id: this.installedListingIdCounter++,
      ...data,
      installedAt: now
    };
    this.installedListings.set(installedListing.id, installedListing);
    return installedListing;
  }

  async getInstalledListingsByFirmId(firmId: number): Promise<InstalledListing[]> {
    return Array.from(this.installedListings.values())
      .filter(installedListing => installedListing.firmId === firmId);
  }

  //=======================
  // 订单相关方法实现
  //=======================
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId);
  }

  async getOrdersByVendorId(vendorId: number): Promise<Order[]> {
    // 查找供应商的所有商品
    const vendorListings = await this.getListingsByVendorId(vendorId);
    const vendorListingIds = vendorListings.map(listing => listing.id);
    
    // 查找包含供应商商品的订单项
    const relevantOrderIds = new Set<number>();
    for (const orderItem of this.orderItems.values()) {
      if (vendorListingIds.includes(orderItem.listingId)) {
        relevantOrderIds.add(orderItem.orderId);
      }
    }
    
    // 返回相关的订单
    return Array.from(this.orders.values())
      .filter(order => relevantOrderIds.has(order.id));
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const now = new Date();
    const order: Order = {
      id: this.orderIdCounter++,
      ...orderData,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(order.id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = {
      ...order,
      status,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  //=======================
  // 订单项相关方法实现
  //=======================
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }

  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const orderItem: OrderItem = {
      id: this.orderItemIdCounter++,
      ...itemData
    };
    this.orderItems.set(orderItem.id, orderItem);
    return orderItem;
  }

  //=======================
  // 支付相关方法实现
  //=======================
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId) {
        return payment;
      }
    }
    return undefined;
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const now = new Date();
    const payment: Payment = {
      id: this.paymentIdCounter++,
      ...paymentData,
      createdAt: now,
      updatedAt: now
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async updatePaymentStatus(id: number, status: PaymentStatus, transactionId?: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment = {
      ...payment,
      status,
      ...(transactionId && { transactionId }),
      updatedAt: new Date()
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  //=======================
  // 评论相关方法实现
  //=======================
  async getCommentsByListingId(listingId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.listingId === listingId);
  }

  async getCommentsByUserId(userId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.userId === userId);
  }

  async getPendingComments(): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.status === "PENDING");
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const now = new Date();
    const comment: Comment = {
      id: this.commentIdCounter++,
      ...commentData,
      createdAt: now,
      updatedAt: now
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  async updateCommentStatus(id: number, status: string, reason?: string): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;

    const updatedComment = {
      ...comment,
      status,
      updatedAt: new Date()
    };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  //=======================
  // 用户收藏相关方法实现
  //=======================
  async getUserSavedListings(userId: number): Promise<Listing[]> {
    // 查找用户收藏的所有商品ID
    const savedListingIds = Array.from(this.userSavedListings.values())
      .filter(saved => saved.userId === userId)
      .map(saved => saved.listingId);
    
    // 返回这些ID对应的商品
    return Array.from(this.listings.values())
      .filter(listing => savedListingIds.includes(listing.id) && listing.status === ListingStatus.ACTIVE);
  }

  async saveListingForUser(data: InsertUserSavedListing): Promise<UserSavedListing> {
    const now = new Date();
    const savedListing: UserSavedListing = {
      id: this.userSavedListingIdCounter++,
      ...data,
      savedAt: now
    };
    this.userSavedListings.set(savedListing.id, savedListing);
    return savedListing;
  }

  async removeSavedListing(userId: number, listingId: number): Promise<boolean> {
    for (const [id, savedListing] of this.userSavedListings.entries()) {
      if (savedListing.userId === userId && savedListing.listingId === listingId) {
        return this.userSavedListings.delete(id);
      }
    }
    return false;
  }

  async isListingSavedByUser(userId: number, listingId: number): Promise<boolean> {
    for (const savedListing of this.userSavedListings.values()) {
      if (savedListing.userId === userId && savedListing.listingId === listingId) {
        return true;
      }
    }
    return false;
  }
}

export const storage = new MemStorage();
