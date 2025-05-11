import {
  User, VendorProfile, Listing, Firm, FirmWhitelistedUser, InstalledListing,
  Order, OrderItem, Payment, Comment, UserSavedListing, Category,
  InsertUser, InsertVendorProfile, InsertListing, InsertFirm, InsertFirmWhitelistedUser,
  InsertInstalledListing, InsertOrder, InsertOrderItem, InsertPayment, InsertComment,
  InsertUserSavedListing, InsertCategory, ListingStatus, VendorVerificationStatus, UserRole, OrderStatus, PaymentStatus,
  users, vendorProfiles, listings, firms, firmWhitelistedUsers, installedListings,
  orders, orderItems, payments, comments, userSavedListings, categories
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, inArray, like, gte, lte, sql, SQL, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

// PostgreSQL会话存储
const PostgresSessionStore = connectPg(session);

// 数据库存储实现
export class DatabaseStorage implements IStorage {
  // 会话存储
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  //=======================
  // 用户相关方法实现
  //=======================
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  //=======================
  // 供应商相关方法实现
  //=======================
  async getVendorProfile(id: number): Promise<VendorProfile | undefined> {
    try {
      if (id === null || id === undefined || isNaN(id)) {
        console.warn("Invalid id passed to getVendorProfile:", id);
        return undefined;
      }
      const result = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, id));
      if (result.length > 0) {
        const vp = result[0];
        return {
          ...vp,
          userId: vp.userId!,
          companyName: vp.companyName!,
          businessNumber: vp.businessNumber!,
          verificationStatus: vp.verificationStatus!,
          createdAt: vp.createdAt!,
          updatedAt: vp.updatedAt!,
        };
      }
      return undefined;
    } catch (error) {
      console.error(`Error in getVendorProfile with id ${id}:`, error);
      return undefined;
    }
  }

  async getVendorProfileByUserId(userId: number): Promise<VendorProfile | undefined> {
    try {
      if (userId === null || userId === undefined || isNaN(userId)) {
        console.warn("Invalid userId passed to getVendorProfileByUserId:", userId);
        return undefined;
      }
      const result = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, userId));
      if (result.length > 0) {
        const vp = result[0];
        return {
          ...vp,
          userId: vp.userId!,
          companyName: vp.companyName!,
          businessNumber: vp.businessNumber!,
          verificationStatus: vp.verificationStatus!,
          createdAt: vp.createdAt!,
          updatedAt: vp.updatedAt!,
        };
      }
      return undefined;
    } catch (error) {
      console.error(`Error in getVendorProfileByUserId with userId ${userId}:`, error);
      return undefined;
    }
  }

  async createVendorProfile(profileData: InsertVendorProfile): Promise<VendorProfile> {
    const result = await db.insert(vendorProfiles).values(profileData).returning();
    const vp = result[0];
    return {
      ...vp,
      userId: vp.userId!,
      companyName: vp.companyName!,
      businessNumber: vp.businessNumber!,
      verificationStatus: vp.verificationStatus!,
      createdAt: vp.createdAt!,
      updatedAt: vp.updatedAt!,
    };
  }

  async updateVendorProfile(id: number, profileData: Partial<VendorProfile>): Promise<VendorProfile | undefined> {
    const result = await db
      .update(vendorProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(vendorProfiles.id, id))
      .returning();
    if (result.length > 0) {
      const vp = result[0];
      return {
        ...vp,
        userId: vp.userId!,
        companyName: vp.companyName!,
        businessNumber: vp.businessNumber!,
        verificationStatus: vp.verificationStatus!,
        createdAt: vp.createdAt!,
        updatedAt: vp.updatedAt!,
      };
    }
    return undefined;
  }

  async getPendingVendors(): Promise<VendorProfile[]> {
    try {
      const result = await db
        .select()
        .from(vendorProfiles)
        .where(eq(vendorProfiles.verificationStatus, VendorVerificationStatus.PENDING));
      return result.map(vp => ({
          ...vp,
          userId: vp.userId!,
          companyName: vp.companyName!,
          businessNumber: vp.businessNumber!,
          verificationStatus: vp.verificationStatus!,
          createdAt: vp.createdAt!,
          updatedAt: vp.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getPendingVendors:", error);
      return [];
    }
  }

  async getApprovedVendors(): Promise<VendorProfile[]> {
    try {
      const result = await db
        .select()
        .from(vendorProfiles)
        .where(eq(vendorProfiles.verificationStatus, VendorVerificationStatus.APPROVED));
      return result.map(vp => ({
        ...vp,
        userId: vp.userId!,
        companyName: vp.companyName!,
        businessNumber: vp.businessNumber!,
        verificationStatus: vp.verificationStatus!,
        createdAt: vp.createdAt!,
        updatedAt: vp.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getApprovedVendors:", error);
      return [];
    }
  }

  // 获取所有供应商
  async getAllVendors(): Promise<VendorProfile[]> {
    try {
      const result = await db.select().from(vendorProfiles);
      return result.map(vp => ({
        ...vp,
        userId: vp.userId!,
        companyName: vp.companyName!,
        businessNumber: vp.businessNumber!,
        verificationStatus: vp.verificationStatus!,
        createdAt: vp.createdAt!,
        updatedAt: vp.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getAllVendors:", error);
      return [];
    }
  }

  // 获取所有商品
  async getAllListings(): Promise<Listing[]> {
    try {
      const result = await db.select().from(listings);
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        title: listing.title!,
        description: listing.description!,
        price: listing.price!,
        type: listing.type!,
        status: listing.status!,
        images: listing.images!,
        category: listing.category!,
        tags: listing.tags!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getAllListings:", error);
      return [];
    }
  }

  async getOrderById(orderId: number): Promise<Order | undefined> {
    try {
      const result = await db.select().from(orders).where(eq(orders.id, orderId));
      if (result.length > 0) {
        const order = result[0];
        return {
          ...order,
          userId: order.userId!,
          status: order.status!,
          totalAmount: order.totalAmount!,
          currency: order.currency!,
          createdAt: order.createdAt!,
          updatedAt: order.updatedAt!,
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching order by ID:", error);
      throw error;
    }
  }
  
  // 实现IStorage的getOrder方法
  async getOrder(id: number): Promise<Order | undefined> {
    return this.getOrderById(id);
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const result = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));
      return result.map(order => ({
        ...order,
        userId: order.userId!,
        status: order.status!,
        totalAmount: order.totalAmount!,
        currency: order.currency!,
        createdAt: order.createdAt!,
        updatedAt: order.updatedAt!,
      }));
    } catch (error) {
      console.error('获取所有订单失败:', error);
      return []; 
    }
  }
  
  // 获取所有支付记录
  async getAllPayments(): Promise<Payment[]> {
    try {
      const result = await db.select().from(payments);
      return result.map(p => ({
        ...p,
        orderId: p.orderId!,
        amount: p.amount!,
        currency: p.currency!,
        status: p.status!,
        paymentMethod: p.paymentMethod!,
        createdAt: p.createdAt!,
        updatedAt: p.updatedAt!,
      }));
    } catch (error) {
      console.error('获取所有支付记录失败:', error);
      return [];
    }
  }

  async getListing(id: number): Promise<Listing | undefined> {
    try {
      const result = await db.select().from(listings).where(eq(listings.id, id));
      if (result.length > 0) {
        const listing = result[0];
        return {
          ...listing,
          vendorId: listing.vendorId!,
          title: listing.title!,
          description: listing.description!,
          price: listing.price!,
          type: listing.type!,
          status: listing.status!,
          images: listing.images!,
          category: listing.category!,
          tags: listing.tags!,
          createdAt: listing.createdAt!,
          updatedAt: listing.updatedAt!,
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error in getListing:", error);
      return undefined;
    }
  }

  async getListingsByVendorId(vendorId: number): Promise<Listing[]> {
    try {
      const result = await db.select().from(listings).where(eq(listings.vendorId, vendorId));
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        title: listing.title!,
        description: listing.description!,
        price: listing.price!,
        type: listing.type!,
        status: listing.status!,
        images: listing.images!,
        category: listing.category!,
        tags: listing.tags!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getListingsByVendorId:", error);
      return [];
    }
  }

  async getActiveListings(limit: number = 10, offset: number = 0): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(eq(listings.status, ListingStatus.ACTIVE))
        .limit(limit)
        .offset(offset);
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        title: listing.title!,
        description: listing.description!,
        price: listing.price!,
        status: listing.status!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getActiveListings:", error);
      return [];
    }
  }

  async getPendingListings(): Promise<Listing[]> {
    try {
      const result = await db.select().from(listings).where(eq(listings.status, ListingStatus.PENDING));
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        title: listing.title!,
        description: listing.description!,
        price: listing.price!,
        type: listing.type!,
        status: listing.status!,
        images: listing.images!,
        category: listing.category!,
        tags: listing.tags!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getPendingListings:", error);
      return [];
    }
  }

  async getFeaturedListings(limit: number = 5): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(eq(listings.status, ListingStatus.ACTIVE))
        .limit(limit);
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        title: listing.title!,
        description: listing.description!,
        price: listing.price!,
        type: listing.type!,
        status: listing.status!,
        images: listing.images!,
        category: listing.category!,
        tags: listing.tags!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getFeaturedListings:", error);
      return [];
    }
  }

  async getListingsByCategory(category: string): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.status, ListingStatus.ACTIVE),
            eq(listings.category, category)
          )
        );
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        title: listing.title!,
        description: listing.description!,
        price: listing.price!,
        type: listing.type!,
        status: listing.status!,
        images: listing.images!,
        category: listing.category!,
        tags: listing.tags!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getListingsByCategory:", error);
      return [];
    }
  }

  async getListingsByCategoryNameOrId(categoryName: string, categoryId: number): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.status, ListingStatus.ACTIVE),
            (eq(listings.categoryId, categoryId) as any) // drizzle-orm 不支持 or，这里用 as any hack
          )
        );
      if (result.length === 0) {
        const resultByName = await db
          .select()
          .from(listings)
          .where(
            and(
              eq(listings.status, ListingStatus.ACTIVE),
              eq(listings.category, categoryName)
            )
          );
        return resultByName.map(listing => ({
          ...listing,
          vendorId: listing.vendorId!,
          title: listing.title!,
          description: listing.description!,
          price: listing.price!,
          type: listing.type!,
          status: listing.status!,
          images: listing.images!,
          category: listing.category!,
          tags: listing.tags!,
          createdAt: listing.createdAt!,
          updatedAt: listing.updatedAt!,
        }));
      }
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        name: listing.name!,
        description: listing.description!,
        price: listing.price!,
        status: listing.status!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getListingsByCategoryNameOrId:", error);
      return [];
    }
  }

  async searchListings(query: string, filters?: any): Promise<Listing[]> {
    try {
      const conditions: SQL[] = [eq(listings.status, ListingStatus.ACTIVE)];

      if (query) {
        const searchTerm = `%${query.toLowerCase()}%`;
        conditions.push(
          or(
            like(listings.title, searchTerm),
            like(listings.description, searchTerm)
          )
        );
      }

      if (filters) {
        if (filters.category && filters.category !== 'all') {
          conditions.push(eq(listings.category, filters.category));
        }

        if (filters.minPrice !== undefined) {
          conditions.push(gte(listings.price, filters.minPrice));
        }

        if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
          conditions.push(lte(listings.price, filters.maxPrice));
        }
      }

      const result = await db
        .select()
        .from(listings)
        .where(and(...conditions));

      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        name: listing.name!,
        description: listing.description!,
        price: listing.price!,
        status: listing.status!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in searchListings:", error);
      return [];
    }
  }

  async createListing(listingData: InsertListing): Promise<Listing> {
    const result = await db.insert(listings).values(listingData).returning();
    return result[0];
  }

  async updateListing(id: number, listingData: Partial<Listing>): Promise<Listing | undefined> {
    const result = await db
      .update(listings)
      .set({ ...listingData, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return result[0];
  }

  async deleteListing(id: number): Promise<boolean> {
    try {
      await db.delete(listings).where(eq(listings.id, id));
      return true;
    } catch (error) {
      console.error('删除商品失败:', error);
      return false;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      await db.delete(orders).where(eq(orders.id, id));
      return true;
    } catch (error) {
      console.error('删除订单失败:', error);
      return false;
    }
  }

  //=======================
  // 企业相关方法实现
  //=======================
  async getFirm(id: number): Promise<Firm | undefined> {
    try {
      const result = await db.select().from(firms).where(eq(firms.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error fetching firm by ID:", error);
      return undefined;
    }
  }

  async createFirm(firmData: InsertFirm): Promise<Firm> {
    const result = await db.insert(firms).values(firmData).returning();
    return result[0];
  }

  //=======================
  // 企业白名单用户相关方法
  //=======================
  async addUserToFirmWhitelist(data: InsertFirmWhitelistedUser): Promise<FirmWhitelistedUser> {
    const result = await db.insert(firmWhitelistedUsers).values(data).returning();
    return result[0];
  }

  async removeUserFromFirmWhitelist(firmId: number, userId: number): Promise<boolean> {
    try {
      await db
        .delete(firmWhitelistedUsers)
        .where(
          and(
            eq(firmWhitelistedUsers.firmId, firmId),
            eq(firmWhitelistedUsers.userId, userId)
          )
        );
      return true;
    } catch (error) {
      console.error('从企业白名单中移除用户失败:', error);
      return false;
    }
  }

  //=======================
  // 已安装商品相关方法
  //=======================
  async installListingForFirm(data: InsertInstalledListing): Promise<InstalledListing> {
    const result = await db.insert(installedListings).values(data).returning();
    return result[0];
  }

  async getInstalledListingsByFirmId(firmId: number): Promise<InstalledListing[]> {
    try {
      const result = await db.select().from(installedListings).where(eq(installedListings.firmId, firmId));
      return result.map(item => item);
    } catch (error) {
      console.error("Error in getInstalledListingsByFirmId:", error);
      return [];
    }
  }

  //=======================
  // 订单相关方法
  //=======================


  async getOrdersByUserId(userId: number): Promise<Order[]> {
    try {
      const result = await db.select().from(orders).where(eq(orders.userId, userId));
      return result.map(order => ({
        ...order,
        userId: order.userId!,
        status: order.status!,
        totalAmount: order.totalAmount!,
        currency: order.currency!,
        createdAt: order.createdAt!,
        updatedAt: order.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getOrdersByUserId:", error);
      return [];
    }
  }

  async getOrdersByVendorId(vendorId: number): Promise<Order[]> {
    try {
      const vendorListings = await db.select({ id: listings.id }).from(listings).where(eq(listings.vendorId, vendorId));
      if (vendorListings.length === 0) {
        return [];
      }
      const listingIds = vendorListings.map(l => l.id);

      const items = await db.selectDistinct({ orderId: orderItems.orderId }).from(orderItems).where(inArray(orderItems.listingId, listingIds));
      if (items.length === 0) {
        return [];
      }
      const orderIds = items.map(item => item.orderId);

      const result = await db.select().from(orders).where(inArray(orders.id, orderIds));
      return result.map(order => ({
        ...order,
        userId: order.userId!,
        status: order.status!,
        totalAmount: order.totalAmount!,
        currency: order.currency!,
        createdAt: order.createdAt!,
        updatedAt: order.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getOrdersByVendorId:", error);
      return [];
    }
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(orderData).returning();
    return result[0];
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  //=======================
  // 订单项相关方法
  //=======================
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(itemData: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(itemData).returning();
    return result[0];
  }

  //=======================
  // 支付相关方法
  //=======================
  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      const result = await db.select().from(payments).where(eq(payments.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error fetching payment by ID:", error);
      return undefined;
    }
  }

  async getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
    try {
      const result = await db.select().from(payments).where(eq(payments.orderId, orderId));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error fetching payment by order ID:", error);
      return undefined;
    }
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(paymentData).returning();
    return result[0];
  }

  async updatePaymentStatus(id: number, status: PaymentStatus, transactionId?: string): Promise<Payment | undefined> {
    const updateData: Partial<Payment> = {
      status,
      updatedAt: new Date()
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    const result = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  //=======================
  // 评论相关方法
  //=======================
  async getCommentsByListingId(listingId: number): Promise<Comment[]> {
    try {
      const result = await db
        .select()
        .from(comments)
        .where(eq(comments.listingId, listingId));
      return result.map(comment => comment);
    } catch (error) {
      console.error("Error in getCommentsByListingId:", error);
      return [];
    }
  }

  async getCommentsByUserId(userId: number): Promise<Comment[]> {
    try {
      const result = await db
        .select()
        .from(comments)
        .where(eq(comments.userId, userId));
      return result.map(comment => comment);
    } catch (error) {
      console.error("Error in getCommentsByUserId:", error);
      return [];
    }
  }

  async getPendingComments(): Promise<Comment[]> {
    try {
      const result = await db
        .select()
        .from(comments)
        .where(eq(comments.status, "PENDING"));
      return result.map(comment => comment);
    } catch (error) {
      console.error("Error in getPendingComments:", error);
      return [];
    }
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(commentData).returning();
    return result[0];
  }

  async updateCommentStatus(id: number, status: string, reason?: string): Promise<Comment | undefined> {
    const result = await db
      .update(comments)
      .set({ status, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  //=======================
  // 用户收藏相关方法
  //=======================
  async getUserSavedListings(userId: number): Promise<Listing[]> {
    try {
      const saved = await db.select({ listingId: userSavedListings.listingId })
        .from(userSavedListings)
        .where(eq(userSavedListings.userId, userId));
      if (saved.length === 0) {
        return [];
      }
      const listingIds = saved.map(s => s.listingId);
      const result = await db.select().from(listings).where(inArray(listings.id, listingIds));
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        name: listing.name!,
        description: listing.description!,
        price: listing.price!,
        status: listing.status!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getUserSavedListings:", error);
      return [];
    }
  }

  async saveListingForUser(data: InsertUserSavedListing): Promise<UserSavedListing> {
    const result = await db.insert(userSavedListings).values(data).returning();
    return result[0];
  }

  async removeSavedListing(userId: number, listingId: number): Promise<boolean> {
    try {
      await db
        .delete(userSavedListings)
        .where(
          and(
            eq(userSavedListings.userId, userId),
            eq(userSavedListings.listingId, listingId)
          )
        );
      return true;
    } catch (error) {
      console.error('移除收藏商品失败:', error);
      return false;
    }
  }

  async isListingSavedByUser(userId: number, listingId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(userSavedListings)
      .where(
        and(
          eq(userSavedListings.userId, userId),
          eq(userSavedListings.listingId, listingId)
        )
      );
    return result.length > 0;
  }

  //=======================
  // 商品分类相关方法
  //=======================
  async getAllCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories);
    } catch (error) {
      console.error("Error in getAllCategories:", error);
      return [];
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const result = await db.select().from(categories).where(eq(categories.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error fetching category by ID:", error);
      return undefined;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const result = await db.select().from(categories).where(eq(categories.slug, slug));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error fetching category by slug:", error);
      return undefined;
    }
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    try {
      const result = await db.insert(categories).values(categoryData).returning();
      return result[0];
    } catch (error) {
      console.error("Error in createCategory:", error);
      throw error;
    }
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    try {
      const result = await db
        .update(categories)
        .set({ ...categoryData, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error in updateCategory:", error);
      return undefined;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
      return true;
    } catch (error) {
      console.error("Error in deleteCategory:", error);
      throw error;
    }
  }

  async getListingsByCategoryId(categoryId: number): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.status, ListingStatus.ACTIVE),
            eq(listings.categoryId, categoryId)
          )
        );
      return result.map(listing => ({
        ...listing,
        vendorId: listing.vendorId!,
        name: listing.name!,
        description: listing.description!,
        price: listing.price!,
        status: listing.status!,
        createdAt: listing.createdAt!,
        updatedAt: listing.updatedAt!,
      }));
    } catch (error) {
      console.error("Error in getListingsByCategoryId:", error);
      return [];
    }
  }

  async getCategoryWithProductCount(): Promise<(Category & { productsCount: number })[]> {
    try {
      const allCategories = await this.getAllCategories();

      const categoriesWithCount = await Promise.all(
        allCategories.map(async (category) => {
          const products = await this.getListingsByCategoryId(category.id);
          return {
            ...category,
            productsCount: products.length
          };
        })
      );

      return categoriesWithCount;
    } catch (error) {
      console.error("Error in getCategoryWithProductCount:", error);
      return [];
    }
  }
}

function or(...conditions: SQL[]): SQL {
  if (conditions.length === 0) {
    return sql`TRUE`;
  }

  const conditionsStr = conditions.map(c => `(${c.toString()})`).join(' OR ');
  return sql`(${conditionsStr})`;
}