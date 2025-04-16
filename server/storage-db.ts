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
import { eq, and, inArray, like, gte, lte, sql, SQL } from "drizzle-orm";
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
  
  // 获取所有供应商
  async getAllVendors(): Promise<VendorProfile[]> {
    return await db.select().from(vendorProfiles);
  }
  
  // 获取所有商品
  async getAllListings(): Promise<Listing[]> {
    try {
      const result = await db.select().from(listings);
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
    } catch (error) {
      console.error("Error in getAllListings:", error);
      return [];
    }
  }
  
  // 获取所有订单
  async getAllOrders(): Promise<Order[]> {
    try {
      const result = await db.select().from(orders);
      
      // 确保userId是数字类型
      return result.map(order => {
        // 处理userId
        let processedUserId = order.userId;
        if (typeof processedUserId === 'string') {
          // 尝试转换为数字
          const parsedUserId = parseInt(processedUserId);
          // 如果转换结果是NaN，则使用null
          processedUserId = isNaN(parsedUserId) ? null : parsedUserId;
        }
        
        return {
          ...order,
          userId: processedUserId
        };
      });
    } catch (error) {
      console.error("Error in getAllOrders:", error);
      return [];
    }
  }
  
  // 获取所有支付记录
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  //=======================
  // 供应商相关方法实现
  //=======================
  async getVendorProfile(id: number): Promise<VendorProfile | undefined> {
    const result = await db.select().from(vendorProfiles).where(eq(vendorProfiles.id, id));
    return result[0];
  }

  async getVendorProfileByUserId(userId: number): Promise<VendorProfile | undefined> {
    const result = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, userId));
    return result[0];
  }

  async createVendorProfile(profileData: InsertVendorProfile): Promise<VendorProfile> {
    const result = await db.insert(vendorProfiles).values(profileData).returning();
    return result[0];
  }

  async updateVendorProfile(id: number, profileData: Partial<VendorProfile>): Promise<VendorProfile | undefined> {
    const result = await db
      .update(vendorProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(vendorProfiles.id, id))
      .returning();
    return result[0];
  }

  async getPendingVendors(): Promise<VendorProfile[]> {
    return await db
      .select()
      .from(vendorProfiles)
      .where(eq(vendorProfiles.verificationStatus, VendorVerificationStatus.PENDING));
  }

  async getApprovedVendors(): Promise<VendorProfile[]> {
    return await db
      .select()
      .from(vendorProfiles)
      .where(eq(vendorProfiles.verificationStatus, VendorVerificationStatus.APPROVED));
  }

  //=======================
  // 商品相关方法实现
  //=======================
  async getListing(id: number): Promise<Listing | undefined> {
    const result = await db.select().from(listings).where(eq(listings.id, id));
    return result[0];
  }

  async getListingsByVendorId(vendorId: number): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(eq(listings.vendorId, vendorId));
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
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
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
    } catch (error) {
      console.error("Error in getActiveListings:", error);
      return [];
    }
  }

  async getPendingListings(): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(eq(listings.status, ListingStatus.PENDING));
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
    } catch (error) {
      console.error("Error in getPendingListings:", error);
      return [];
    }
  }

  async getFeaturedListings(limit: number = 4): Promise<Listing[]> {
    try {
      const result = await db
        .select()
        .from(listings)
        .where(eq(listings.status, ListingStatus.ACTIVE))
        .limit(limit);
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
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
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
    } catch (error) {
      console.error("Error in getListingsByCategory:", error);
      return [];
    }
  }

  async searchListings(query: string, filters?: any): Promise<Listing[]> {
    try {
      // 构建WHERE条件
      const conditions: SQL[] = [eq(listings.status, ListingStatus.ACTIVE)];
      
      // 搜索词匹配
      if (query) {
        const searchTerm = `%${query.toLowerCase()}%`;
        conditions.push(
          or(
            like(listings.title, searchTerm),
            like(listings.description, searchTerm)
          )
        );
      }
      
      // 应用额外过滤条件
      if (filters) {
        // 分类过滤
        if (filters.category && filters.category !== 'all') {
          conditions.push(eq(listings.category, filters.category));
        }
        
        // 价格范围过滤
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
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
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

  //=======================
  // 企业相关方法实现
  //=======================
  async getFirm(id: number): Promise<Firm | undefined> {
    const result = await db.select().from(firms).where(eq(firms.id, id));
    return result[0];
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
    return await db
      .select()
      .from(installedListings)
      .where(eq(installedListings.firmId, firmId));
  }

  //=======================
  // 订单相关方法
  //=======================
  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
  }

  async getOrdersByVendorId(vendorId: number): Promise<Order[]> {
    // 获取供应商的所有商品ID
    const vendorListings = await this.getListingsByVendorId(vendorId);
    const listingIds = vendorListings.map(listing => listing.id);
    
    if (listingIds.length === 0) {
      return [];
    }
    
    // 查找包含供应商商品的订单项
    const ordersWithVendorItems = await db
      .select({
        orderId: orderItems.orderId
      })
      .from(orderItems)
      .where(inArray(orderItems.listingId, listingIds))
      .groupBy(orderItems.orderId);
    
    const orderIds = ordersWithVendorItems.map(item => item.orderId);
    
    if (orderIds.length === 0) {
      return [];
    }
    
    // 获取订单详情
    return await db
      .select()
      .from(orders)
      .where(inArray(orders.id, orderIds));
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
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return result[0];
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
    return await db
      .select()
      .from(comments)
      .where(eq(comments.listingId, listingId));
  }

  async getCommentsByUserId(userId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.userId, userId));
  }

  async getPendingComments(): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.status, "PENDING"));
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
      // 获取用户收藏的商品ID
      const savedItems = await db
        .select()
        .from(userSavedListings)
        .where(eq(userSavedListings.userId, userId));
      
      const listingIds = savedItems.map(item => item.listingId);
      
      if (listingIds.length === 0) {
        return [];
      }
      
      // 获取商品详情
      const result = await db
        .select()
        .from(listings)
        .where(inArray(listings.id, listingIds));
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
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
      return result[0];
    } catch (error) {
      console.error("Error in getCategory:", error);
      return undefined;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const result = await db.select().from(categories).where(eq(categories.slug, slug));
      return result[0];
    } catch (error) {
      console.error("Error in getCategoryBySlug:", error);
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
      // 先检查是否有商品使用此分类
      const listingsWithCategory = await db
        .select()
        .from(listings)
        .where(eq(listings.categoryId, id));
      
      if (listingsWithCategory.length > 0) {
        throw new Error("无法删除分类，因为有商品正在使用此分类");
      }

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
      
      // 确保vendorId和categoryId是数字类型
      return result.map(listing => {
        // 处理vendorId
        let processedVendorId = listing.vendorId;
        if (typeof processedVendorId === 'string') {
          // 尝试转换为数字
          const parsedVendorId = parseInt(processedVendorId);
          // 如果转换结果是NaN，则使用null
          processedVendorId = isNaN(parsedVendorId) ? null : parsedVendorId;
        }
        
        // 处理categoryId
        let processedCategoryId = listing.categoryId;
        if (processedCategoryId && typeof processedCategoryId === 'string') {
          // 尝试转换为数字
          const parsedCategoryId = parseInt(processedCategoryId);
          // 如果转换结果是NaN，则使用null
          processedCategoryId = isNaN(parsedCategoryId) ? null : parsedCategoryId;
        }
        
        return {
          ...listing,
          vendorId: processedVendorId,
          categoryId: processedCategoryId
        };
      });
    } catch (error) {
      console.error("Error in getListingsByCategoryId:", error);
      return [];
    }
  }

  async getCategoryWithProductCount(): Promise<(Category & { productsCount: number })[]> {
    try {
      // 先获取所有分类
      const allCategories = await this.getAllCategories();
      
      // 为每个分类统计商品数量
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

// 引入or函数
function or(...conditions: SQL[]): SQL {
  // 如果没有条件，返回true
  if (conditions.length === 0) {
    return sql`TRUE`;
  }

  // 否则创建OR语句
  const conditionsStr = conditions.map(c => `(${c.toString()})`).join(' OR ');
  return sql`(${conditionsStr})`;
}