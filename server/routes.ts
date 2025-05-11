import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { hashPassword, comparePasswords } from "./auth";
import { registerStatisticsRoutes } from "./routes-statistics";
import { registerOrderRoutes } from "./routes-order";
import {
  UserRole,
  UserStatus,
  VendorVerificationStatus,
  ListingStatus,
  ListingType,
  OrderStatus,
  PaymentStatus,
  CommentStatus,
  insertCategorySchema,
  orders,
  orderItems,
  listings,
  users,
  userSavedListings,
  vendorProfiles, // Ensure vendorProfiles is imported
  insertVendorProfileSchema // Ensure insertVendorProfileSchema is imported
} from "@shared/schema";
import express, { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq, and, desc, asc, or, inArray } from "drizzle-orm";
import { i18nMiddleware, t } from "./i18n";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // 设置国际化中间件
  app.use(i18nMiddleware);

  // 设置认证
  setupAuth(app);
  
  // 注册订单相关路由
  registerOrderRoutes(app);
  
  // 注册统计相关路由
  registerStatisticsRoutes(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: t('error.unauthorized', req.language) });
    }
    next();
  };

  // 检查用户权限的中间件
  const checkRole = (role: UserRole) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: t('error.unauthorized', req.language) });
    }
    // Add type assertion for req.user within checkRole if needed, or ensure passport types are extended globally
    const user = req.user as { role: UserRole } | undefined;
    if (!user || (user.role !== role && user.role !== UserRole.ADMIN)) {
      return res.status(403).json({ message: t('error.forbidden', req.language) });
    }
    next();
  };

  // --- Vendor Profile Routes ---

  // Create a new vendor profile
  app.post("/api/vendor-profiles", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Check if a vendor profile already exists for this user
      const existingProfile = await db
        .select()
        .from(vendorProfiles)
        .where(eq(vendorProfiles.userId, userId))
        .limit(1);

      if (existingProfile.length > 0) {
        return res.status(409).json({ message: t('error.vendorProfileExists', req.language) });
      }

      // Validate request body
      const validationResult = insertVendorProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: t('error.validationFailed', req.language), errors: validationResult.error.flatten() });
      }

      const { companyName, businessNumber, website, description } = validationResult.data;

      // Create new vendor profile
      const newProfile = await db
        .insert(vendorProfiles)
        .values({
          userId,
          companyName,
          businessNumber,
          website: website || null, // Ensure optional fields are handled
          description: description || null,
          verificationStatus: VendorVerificationStatus.PENDING, // Default status
          // createdAt and updatedAt have defaultNow()
        })
        .returning();
        
      // Optionally, update user role to VENDOR if not already
      if (req.user!.role !== UserRole.VENDOR) {
        await db.update(users).set({ role: UserRole.VENDOR }).where(eq(users.id, userId));
      }

      res.status(201).json(newProfile[0]);
    } catch (error) {
      console.error("Failed to create vendor profile:", error);
      res.status(500).json({ message: t('error.serverError', req.language), error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update an existing vendor profile
  app.patch("/api/vendor-profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Fetch the vendor profile to check ownership
      const profileToUpdate = await db
        .select()
        .from(vendorProfiles)
        .where(eq(vendorProfiles.id, profileId))
        .limit(1);

      if (profileToUpdate.length === 0) {
        return res.status(404).json({ message: t('error.vendorProfileNotFound', req.language) });
      }

      // Authorization: User must be owner or admin
      if (userRole !== UserRole.ADMIN && profileToUpdate[0].userId !== userId) {
        return res.status(403).json({ message: t('error.forbidden', req.language) });
      }

      // Validate request body (allow partial updates)
      const validationResult = insertVendorProfileSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: t('error.validationFailed', req.language), errors: validationResult.error.flatten() });
      }

      const dataToUpdate = validationResult.data;
      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: t('error.noDataToUpdate', req.language) });
      }
      
      // Add updatedAt timestamp
      (dataToUpdate as any).updatedAt = new Date();

      const updatedProfile = await db
        .update(vendorProfiles)
        .set(dataToUpdate)
        .where(eq(vendorProfiles.id, profileId))
        .returning();

      res.status(200).json(updatedProfile[0]);
    } catch (error) {
      console.error("Failed to update vendor profile:", error);
      res.status(500).json({ message: t('error.serverError', req.language), error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 获取当前用户的订单
  app.get("/api/users/current/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      // 获取用户的所有订单
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, req.user.id))
        .orderBy(desc(orders.createdAt));

      res.json(userOrders);
    } catch (error: any) {
      console.error("获取用户订单失败:", error);
      res.status(500).json({ message: "获取订单失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 获取当前用户的收藏
  app.get("/api/users/current/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }
      
      // 获取用户收藏的商品ID
      const savedListings = await db
        .select()
        .from(userSavedListings)
        .where(eq(userSavedListings.userId, req.user.id));
      
      if (savedListings.length === 0) {
        return res.json([]);
      }
      
      // 获取收藏的商品详情
      const listingIds = savedListings.map(item => item.listingId);
      const favorites = await db
        .select()
        .from(listings)
        .where(
          and(
            inArray(listings.id, listingIds),
            eq(listings.status, ListingStatus.ACTIVE)
          )
        );
      
      // 获取每个商品的供应商信息并添加isSaved属性
      const listingsWithVendorInfo = await Promise.all(
        favorites.map(async (listing) => {
          const vendor = await storage.getVendorProfile(listing.vendorId);
          const user = vendor ? await storage.getUser(vendor.userId) : null;
          
          return {
            ...listing,
            vendor: vendor ? {
              id: vendor.id,
              companyName: vendor.companyName,
              verificationStatus: vendor.verificationStatus,
              user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
              } : null
            } : null,
            isSaved: true // 收藏列表中的商品必然是已收藏的
          };
        })
      );
      
      // 只返回真正收藏的商品
      const savedListingsOnly = listingsWithVendorInfo.filter(item => item.isSaved === true);
      
      res.json(savedListingsOnly);
    } catch (error: any) {
      console.error("获取用户收藏失败:", error);
      res.status(500).json({ message: "获取收藏失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 管理员获取所有订单
  app.get("/api/orders/all", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      // 获取所有订单
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      
      // 为每个订单获取订单项和商品信息
      const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
        const orderItemsData = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        const items = await Promise.all(orderItemsData.map(async (item) => {
          const product = await db
            .select()
            .from(listings)
            .where(eq(listings.id, item.listingId))
            .then(res => res[0]); // 获取单个商品
          return {
            ...item,
            listing: product
          };
        }));
        
        return {
          ...order,
          items
        };
      }));
      
      res.json(ordersWithItems);
    } catch (error) {
      console.error("获取所有订单失败:", error);
      res.status(500).json({ message: "获取订单失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 管理员发货订单
  app.post("/api/orders/:id/ship", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // 更新订单状态为已发货
      const updatedOrder = await db
        .update(orders)
        .set({ 
          status: OrderStatus.SHIPPED,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      if (updatedOrder.length === 0) {
        return res.status(404).json({ message: "订单不存在" });
      }
      
      res.json(updatedOrder[0]);
    } catch (error: any) {
      console.error("发货订单失败:", error);
      res.status(500).json({ message: "发货订单失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 管理员完成订单
  app.post("/api/orders/:id/complete", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // 更新订单状态为已完成
      const updatedOrder = await db
        .update(orders)
        .set({ 
          status: OrderStatus.COMPLETED,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      if (updatedOrder.length === 0) {
        return res.status(404).json({ message: "订单不存在" });
      }
      
      res.json(updatedOrder[0]);
    } catch (error: any) {
      console.error("完成订单失败:", error);
      res.status(500).json({ message: "完成订单失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 管理员取消订单
  app.post("/api/orders/:id/cancel", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "取消原因不能为空" });
      }
      
      // 更新订单状态为已取消
      const updatedOrder = await db
        .update(orders)
        .set({ 
          status: OrderStatus.CANCELLED,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      if (updatedOrder.length === 0) {
        return res.status(404).json({ message: "订单不存在" });
      }
      
      res.json(updatedOrder[0]);
    } catch (error: any) {
      console.error("取消订单失败:", error);
      res.status(500).json({ message: "取消订单失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 管理员获取所有用户订单
  app.get("/api/users/orders", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      // 获取所有订单
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      res.json(allOrders);
    } catch (error: any) {
      console.error("获取所有订单失败:", error);
      res.status(500).json({ message: "获取订单失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 获取单个订单详情
  app.get("/api/orders/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }
      
      const orderId = parseInt(req.params.id);
      
      // 获取订单基本信息
      const orderResult = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (orderResult.length === 0) {
        return res.status(404).json({ message: "订单不存在" });
      }
      
      const order = orderResult[0];
      
      // 检查权限：只有管理员或订单所有者可以查看
      if (req.user && (req.user.role !== UserRole.ADMIN && req.user.id !== order.userId)) {
        return res.status(403).json({ message: "权限不足" });
      }
      
      // 获取订单项
      const orderItemsResult = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      
      // 获取订单项对应的商品
      const listingIds = orderItemsResult.map(item => item.listingId);
      const listingsResult = listingIds.length > 0 ? 
        await db.select().from(listings).where(inArray(listings.id, listingIds)) : 
        [];
      
      // 将商品信息添加到订单项中
      const itemsWithListings = orderItemsResult.map(item => {
        const listing = listingsResult.find(l => l.id === item.listingId);
        return {
          ...item,
          listing
        };
      });
      
      // 返回包含订单项和商品信息的完整订单
      res.json({
        ...order,
        items: itemsWithListings
      });
    } catch (error: any) {
      console.error("获取订单详情失败:", error);
      res.status(500).json({ message: "获取订单详情失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 获取用户详情（管理员使用）
  app.get("/api/users/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // 获取用户信息
      const userResult = await db.select().from(users).where(eq(users.id, userId));
      
      if (userResult.length === 0) {
        return res.status(404).json({ message: "用户不存在" });
      }
      
      const user = userResult[0];
      
      // 返回用户信息（不包含密码）
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("获取用户详情失败:", error);
      res.status(500).json({ message: "获取用户详情失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 获取指定用户的订单（管理员使用）
  app.get("/api/users/:id/orders", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // 获取用户的所有订单
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));
      
      res.json(userOrders);
    } catch (error: any) {
      console.error("获取用户订单失败:", error);
      res.status(500).json({ message: "获取用户订单失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 获取指定用户的收藏（管理员使用）
  app.get("/api/users/:id/favorites", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // 获取用户收藏的商品ID
      const savedListings = await db
        .select()
        .from(userSavedListings)
        .where(eq(userSavedListings.userId, userId));
      
      if (savedListings.length === 0) {
        return res.json([]);
      }
      
      // 获取收藏的商品详情
      const listingIds = savedListings.map(item => item.listingId);
      const favorites = await db
        .select()
        .from(listings)
        .where(inArray(listings.id, listingIds));
      
      res.json(favorites);
    } catch (error: any) {
      console.error("获取用户收藏失败:", error);
      res.status(500).json({ message: "获取用户收藏失败", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // 供应商API路由
  app.post("/api/vendors", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      // 更新用户角色为供应商
      const updatedUser = await storage.updateUser(req.user.id, { role: UserRole.VENDOR });

      // 创建供应商资料
      const vendorProfile = await storage.createVendorProfile({
        userId: req.user.id,
        companyName: req.body.companyName,
        businessNumber: req.body.businessNumber,
        website: req.body.website || "",
        description: req.body.description || "",
        verificationStatus: VendorVerificationStatus.PENDING,
        rejectionReason: ""
      });

      res.status(201).json(vendorProfile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 更新供应商资料
  app.put("/api/vendors/:id", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const vendorProfile = await storage.getVendorProfile(vendorId);

      if (!vendorProfile) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      // 确保只有供应商自己或管理员可以更新
      if (vendorProfile.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }

      const updatedProfile = await storage.updateVendorProfile(vendorId, req.body);
      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取待审核的供应商列表 (仅管理员)
  app.get("/api/admin/vendors/pending", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingVendors = await storage.getPendingVendors();

      // 获取每个供应商的用户信息
      const vendorsWithUserInfo = await Promise.all(
        pendingVendors.map(async (vendor) => {
          try {
            const userId = typeof vendor.userId === 'string' ? parseInt(vendor.userId) : vendor.userId;
            const user = await storage.getUser(userId);
            return {
              ...vendor,
              user: user ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
              } : null
            };
          } catch (err) {
            console.error(`Error processing vendor ${vendor.id}:`, err);
            return vendor; // 返回没有用户信息的供应商
          }
        })
      );

      res.json(vendorsWithUserInfo);
    } catch (error: any) {
      console.error("Error in /api/admin/vendors/pending:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 获取所有供应商列表 (仅管理员)
  app.get("/api/vendors/all", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const allVendors = await storage.getAllVendors();

      // 获取每个供应商的用户信息
      const vendorsWithUserInfo = await Promise.all(
        allVendors.map(async (vendor) => {
          try {
            const userId = typeof vendor.userId === 'string' ? parseInt(vendor.userId) : vendor.userId;
            const user = await storage.getUser(userId);
            return {
              ...vendor,
              user: user ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
              } : null
            };
          } catch (err) {
            console.error(`Error processing vendor ${vendor.id}:`, err);
            return vendor; // 返回没有用户信息的供应商
          }
        })
      );

      res.json(vendorsWithUserInfo);
    } catch (error: any) {
      console.error("Error in /api/vendors/all:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 获取待审核的供应商列表 (仅管理员)
  app.get("/api/vendors/pending", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingVendors = await storage.getPendingVendors();

      // 获取每个供应商的用户信息
      const vendorsWithUserInfo = await Promise.all(
        pendingVendors.map(async (vendor) => {
          try {
            const userId = typeof vendor.userId === 'string' ? parseInt(vendor.userId) : vendor.userId;
            const user = await storage.getUser(userId);
            return {
              ...vendor,
              user: user ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
              } : null
            };
          } catch (err) {
            console.error(`Error processing vendor ${vendor.id}:`, err);
            return vendor; // 返回没有用户信息的供应商
          }
        })
      );

      res.json(vendorsWithUserInfo);
    } catch (error: any) {
      console.error("Error in /api/vendors/pending:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 审核供应商 (仅管理员)
  app.patch("/api/admin/vendors/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const { verificationStatus, rejectionReason } = req.body;

      const updatedProfile = await storage.updateVendorProfile(vendorId, {
        verificationStatus,
        rejectionReason: verificationStatus === VendorVerificationStatus.REJECTED ? rejectionReason : null
      });

      if (!updatedProfile) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 批准供应商 (仅管理员)
  app.post("/api/vendors/:id/approve", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      const vendor = await storage.getVendorProfile(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      const updatedProfile = await storage.updateVendorProfile(vendorId, {
        verificationStatus: VendorVerificationStatus.APPROVED,
        rejectionReason: null
      });

      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error in /api/vendors/:id/approve:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 拒绝供应商 (仅管理员)
  app.post("/api/vendors/:id/reject", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const { reason } = req.body;

      const vendor = await storage.getVendorProfile(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      const updatedProfile = await storage.updateVendorProfile(vendorId, {
        verificationStatus: VendorVerificationStatus.REJECTED,
        rejectionReason: reason || "未提供拒绝原因"
      });

      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error in /api/vendors/:id/reject:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 获取认证供应商列表
  app.get("/api/vendors", async (req, res) => {
    try {
      const approvedVendors = await storage.getApprovedVendors();

      // 获取每个供应商的用户信息和商品数量
      const vendorsWithDetails = await Promise.all(
        approvedVendors.map(async (vendor) => {
          const user = await storage.getUser(vendor.userId);
          const listings = await storage.getListingsByVendorId(vendor.id);
          const activeListings = listings.filter(listing => listing.status === ListingStatus.ACTIVE);

          return {
            ...vendor,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            } : null,
            listingsCount: activeListings.length
          };
        })
      );

      res.json(vendorsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取指定供应商资料
  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const vendor = await storage.getVendorProfile(vendorId);

      if (!vendor) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      const user = await storage.getUser(vendor.userId);
      const listings = await storage.getListingsByVendorId(vendor.id);
      const activeListings = listings.filter(listing => listing.status === ListingStatus.ACTIVE);

      res.json({
        ...vendor,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        } : null,
        listings: activeListings
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 商品API路由
  app.get("/api/listings", async (req, res) => {
    try {
      const showAll = req.query.all === 'true' || (req.user && req.user.role === UserRole.ADMIN);
      const categorySlug = req.query.category;
      let allListings;
      const categories = await storage.getAllCategories();
      if (showAll) {
        allListings = await storage.getAllListings();
      } else if (categorySlug && categorySlug !== 'all') {
        const cat = categories.find(c => c.slug === categorySlug);
        if (cat) {
          allListings = await storage.getListingsByCategoryNameOrId(cat.name, cat.id);
        } else {
          allListings = [];
        }
      } else {
        allListings = await db.query.listings.findMany({
          where: eq(listings.status, ListingStatus.ACTIVE),
          orderBy: [desc(listings.createdAt)],
        });
      }
      // 增加 categorySlug 字段
      const listingsWithSlug = allListings.map(listing => {
        let slug = null;
        if (listing.categoryId) {
          const cat = categories.find(c => c.id === listing.categoryId);
          slug = cat ? cat.slug : null;
        } else if (listing.category) {
          const cat = categories.find(c => c.name === listing.category);
          slug = cat ? cat.slug : null;
        }
        return { ...listing, categorySlug: slug };
      });
      res.json(listingsWithSlug);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/pending", async (req, res) => {
    try {
      const pendingListings = await db.query.listings.findMany({
        where: eq(listings.status, ListingStatus.PENDING),
        orderBy: [desc(listings.createdAt)],
      });
      res.json(pendingListings);
    } catch (error: any) {
      console.error("Error fetching pending listings:", error);
      res.status(500).json({ error: "Failed to fetch pending listings" });
    }
  });

  // 获取特色商品
  app.get("/api/listings/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const featuredListings = await storage.getFeaturedListings(limit);

      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        featuredListings.map(async (listing) => {
          const vendor = await storage.getVendorProfile(listing.vendorId);
          const user = vendor ? await storage.getUser(vendor.userId) : null;

          // 检查当前用户是否收藏了这个商品
          let isSaved = false;
          if (req.isAuthenticated()) {
            isSaved = await storage.isListingSavedByUser(req.user.id, listing.id);
          }

          return {
            ...listing,
            vendor: vendor ? {
              id: vendor.id,
              companyName: vendor.companyName,
              verificationStatus: vendor.verificationStatus,
              user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
              } : null
            } : null,
            isSaved
          };
        })
      );

      res.json(listingsWithVendorInfo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取商品详情
  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const listing = await storage.getListing(listingId);

      if (!listing) {
        return res.status(404).json({ message: "商品不存在" });
      }

      const vendor = await storage.getVendorProfile(listing.vendorId);
      const user = vendor ? await storage.getUser(vendor.userId) : null;

      // 获取商品评论
      const comments = await storage.getCommentsByListingId(listingId);
      const approvedComments = comments.filter(comment => comment.status === CommentStatus.APPROVED);

      // 获取评论用户信息
      const commentsWithUserInfo = await Promise.all(
        approvedComments.map(async (comment) => {
          const commentUser = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: commentUser ? {
              id: commentUser.id,
              firstName: commentUser.firstName,
              lastName: commentUser.lastName,
              avatar: commentUser.avatar
            } : null
          };
        })
      );

      // 检查当前用户是否收藏了这个商品
      let isSaved = false;
      if (req.isAuthenticated()) {
        isSaved = await storage.isListingSavedByUser(req.user.id, listing.id);
      }

      res.json({
        ...listing,
        vendor: vendor ? {
          id: vendor.id,
          companyName: vendor.companyName,
          verificationStatus: vendor.verificationStatus,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          } : null
        } : null,
        comments: commentsWithUserInfo,
        isSaved
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 编辑商品 PATCH /api/listings/:id
  app.patch("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "无效的商品ID" });
      }
      // 检查商品是否存在
      const existing = await storage.getListing(id);
      if (!existing) {
        return res.status(404).json({ message: "商品不存在" });
      }
      // 更新商品
      const updated = await storage.updateListing(id, req.body);
      if (!updated) {
        return res.status(500).json({ message: "商品更新失败" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error in PATCH /api/listings/:id:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 创建商品 (供应商)
  app.post("/api/vendors/:vendorId/listings", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendorProfile(vendorId);

      if (!vendor) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      // 确保只有供应商自己可以创建商品
      if (vendor.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 验证供应商状态
      if (vendor.verificationStatus !== VendorVerificationStatus.APPROVED) {
        return res.status(403).json({ message: "供应商未通过认证" });
      }

      const listing = await storage.createListing({
        ...req.body,
        vendorId,
        status: ListingStatus.PENDING // 新创建的商品需要审核
      });

      res.status(201).json(listing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 更新商品 (供应商)
  app.put("/api/vendors/:vendorId/listings/:id", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const listingId = parseInt(req.params.id);

      const listing = await storage.getListing(listingId);

      if (!listing) {
        return res.status(404).json({ message: "商品不存在" });
      }

      if (listing.vendorId !== vendorId) {
        return res.status(403).json({ message: "权限不足" });
      }

      const vendor = await storage.getVendorProfile(vendorId);

      // 确保只有供应商自己可以更新商品
      if (vendor.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 如果对已激活的商品进行了重大更改，则将状态改为待审核
      const significantChanges = ['title', 'description', 'price', 'category', 'type'];
      const needsReview = listing.status === ListingStatus.ACTIVE &&
        Object.keys(req.body).some(key => significantChanges.includes(key));

      const statusUpdate = needsReview ? { status: ListingStatus.PENDING } : {};

      const updatedListing = await storage.updateListing(listingId, {
        ...req.body,
        ...statusUpdate
      });

      res.json(updatedListing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 删除商品 (供应商)
  app.delete("/api/vendors/:vendorId/listings/:id", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const listingId = parseInt(req.params.id);

      const listing = await storage.getListing(listingId);

      if (!listing) {
        return res.status(404).json({ message: "商品不存在" });
      }

      if (listing.vendorId !== vendorId) {
        return res.status(403).json({ message: "权限不足" });
      }

      const vendor = await storage.getVendorProfile(vendorId);

      // 确保只有供应商自己可以删除商品
      if (vendor.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }

      const result = await storage.deleteListing(listingId);

      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "删除失败" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取待审核的商品列表 (仅管理员)
  app.get("/api/admin/listings/pending", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingListings = await storage.getPendingListings();

      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        pendingListings.map(async (listing) => {
          try {
            if (!listing || !listing.id) {
              console.log("Warning: Invalid listing object:", listing);
              return null;
            }

            if (!listing.vendorId) {
              console.log(`Warning: Listing without vendorId: ${listing.id}`);
              return { ...listing, vendor: null };
            }

            // 确保vendorId是数字或null
            let vendorId = null;
            if (listing.vendorId !== null) {
              if (typeof listing.vendorId === 'string') {
                const parsedId = parseInt(listing.vendorId);
                vendorId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof listing.vendorId === 'number') {
                vendorId = listing.vendorId;
              }
            }

            if (vendorId === null) {
              console.log(`Warning: Invalid vendorId format for listing ${listing.id}:`, listing.vendorId);
              return { ...listing, vendor: null };
            }

            const vendor = await storage.getVendorProfile(vendorId);
            if (!vendor) {
              console.log(`Warning: Vendor not found for listing ${listing.id}, vendorId:`, vendorId);
              return { ...listing, vendor: null };
            }

            // 处理用户ID转换问题
            let user = null;
            if (vendor.userId) {
              // 确保userId是数字
              let userId = null;
              if (typeof vendor.userId === 'string') {
                const parsedId = parseInt(vendor.userId);
                userId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof vendor.userId === 'number') {
                userId = vendor.userId;
              }

              if (userId !== null) {
                user = await storage.getUser(userId);
              }
            }

            return {
              ...listing,
              vendor: vendor ? {
                id: vendor.id,
                companyName: vendor.companyName || "未命名公司",
                verificationStatus: vendor.verificationStatus,
                user: user ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatar: user.avatar
                } : null
              } : null
            };
          } catch (err) {
            console.error(`Error processing listing ${listing?.id || 'unknown'}:`, err);
            return listing ? { ...listing, vendor: null } : null;
          }
        })
      );

      // 过滤掉null值
      const validListings = listingsWithVendorInfo.filter(item => item !== null);

      res.json(validListings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 审核商品 (仅管理员)
  app.patch("/api/admin/listings/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;

      const updatedListing = await storage.updateListing(listingId, {
        status,
        rejectionReason: status === ListingStatus.REJECTED ? rejectionReason : null
      });

      if (!updatedListing) {
        return res.status(404).json({ message: "商品不存在" });
      }

      res.json(updatedListing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 批准商品 (仅管理员)
  app.post("/api/listings/:id/approve", async (req, res) => {
    const { id } = req.params;
    try {
      await db.update(listings)
        .set({
          status: ListingStatus.ACTIVE,
          updatedAt: new Date()
        })
        .where(eq(listings.id, parseInt(id)));
      res.json({ message: "Listing approved successfully" });
    } catch (error: any) {
      console.error("Error approving listing:", error);
      res.status(500).json({ error: "Failed to approve listing" });
    }
  });

  // 拒绝商品 (仅管理员)
  app.post("/api/listings/:id/reject", async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    try {
      await db.update(listings)
        .set({
          status: ListingStatus.REJECTED,
          rejectionReason: reason,
          updatedAt: new Date()
        })
        .where(eq(listings.id, parseInt(id)));
      res.json({ message: "Listing rejected successfully" });
    } catch (error: any) {
      console.error("Error rejecting listing:", error);
      res.status(500).json({ error: "Failed to reject listing" });
    }
  });

  // 获取所有商品 (仅管理员)
  app.get("/api/listings/all", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const allListings = await storage.getAllListings();

      if (!allListings || allListings.length === 0) {
        return res.json([]);
      }

      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        allListings.map(async (listing) => {
          try {
            if (!listing || !listing.id) {
              console.log("Warning: Invalid listing object:", listing);
              return null;
            }

            if (!listing.vendorId) {
              console.log(`Warning: Listing without vendorId: ${listing.id}`);
              return { ...listing, vendor: null };
            }

            // 确保vendorId是数字或null
            let vendorId = null;
            if (listing.vendorId !== null) {
              if (typeof listing.vendorId === 'string') {
                const parsedId = parseInt(listing.vendorId);
                vendorId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof listing.vendorId === 'number') {
                vendorId = listing.vendorId;
              }
            }

            if (vendorId === null) {
              console.log(`Warning: Invalid vendorId format for listing ${listing.id}:`, listing.vendorId);
              return { ...listing, vendor: null };
            }

            const vendor = await storage.getVendorProfile(vendorId);
            if (!vendor) {
              console.log(`Warning: Vendor not found for listing ${listing.id}, vendorId:`, vendorId);
              return { ...listing, vendor: null };
            }

            // 处理用户ID转换问题
            let user = null;
            if (vendor.userId) {
              // 确保userId是数字
              let userId = null;
              if (typeof vendor.userId === 'string') {
                const parsedId = parseInt(vendor.userId);
                userId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof vendor.userId === 'number') {
                userId = vendor.userId;
              }

              if (userId !== null) {
                user = await storage.getUser(userId);
              }
            }

            return {
              ...listing,
              vendor: {
                id: vendor.id,
                companyName: vendor.companyName || "未命名公司",
                verificationStatus: vendor.verificationStatus,
                user: user ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatar: user.avatar
                } : null
              }
            };
          } catch (err) {
            console.error(`Error processing listing ${listing?.id || 'unknown'}:`, err);
            return listing ? { ...listing, vendor: null } : null;
          }
        })
      );

      // 过滤掉null值
      const validListings = listingsWithVendorInfo.filter(item => item !== null);

      res.json(validListings);
    } catch (error: any) {
      console.error("Error in /api/listings/all:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 获取待审核的商品 (仅管理员)
  app.get("/api/listings/pending", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingListings = await storage.getPendingListings();

      if (!pendingListings || pendingListings.length === 0) {
        return res.json([]);
      }

      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        pendingListings.map(async (listing) => {
          try {
            if (!listing || !listing.id) {
              console.log("Warning: Invalid pending listing object:", listing);
              return null;
            }

            if (!listing.vendorId) {
              console.log(`Warning: Pending listing without vendorId: ${listing.id}`);
              return { ...listing, vendor: null };
            }

            // 确保vendorId是数字或null
            let vendorId = null;
            if (listing.vendorId !== null) {
              if (typeof listing.vendorId === 'string') {
                const parsedId = parseInt(listing.vendorId);
                vendorId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof listing.vendorId === 'number') {
                vendorId = listing.vendorId;
              }
            }

            if (vendorId === null) {
              console.log(`Warning: Invalid vendorId format for pending listing ${listing.id}:`, listing.vendorId);
              return { ...listing, vendor: null };
            }

            const vendor = await storage.getVendorProfile(vendorId);
            if (!vendor) {
              console.log(`Warning: Vendor not found for pending listing ${listing.id}, vendorId:`, vendorId);
              return { ...listing, vendor: null };
            }

            // 处理用户ID转换问题
            let user = null;
            if (vendor.userId) {
              // 确保userId是数字
              let userId = null;
              if (typeof vendor.userId === 'string') {
                const parsedId = parseInt(vendor.userId);
                userId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof vendor.userId === 'number') {
                userId = vendor.userId;
              }

              if (userId !== null) {
                user = await storage.getUser(userId);
              }
            }

            return {
              ...listing,
              vendor: {
                id: vendor.id,
                companyName: vendor.companyName || "未命名公司",
                verificationStatus: vendor.verificationStatus,
                user: user ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatar: user.avatar
                } : null
              }
            };
          } catch (err) {
            console.error(`Error processing pending listing ${listing?.id || 'unknown'}:`, err);
            // 返回没有供应商信息的商品
            return listing ? { ...listing, vendor: null } : null;
          }
        })
      );

      // 过滤掉null值
      const validListings = listingsWithVendorInfo.filter(item => item !== null);

      res.json(validListings);
    } catch (error: any) {
      console.error("Error in /api/listings/pending:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 收藏商品
  app.post("/api/users/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const { listingId } = req.body;

      // 检查商品是否存在
      const listing = await storage.getListing(parseInt(listingId));
      if (!listing) {
        return res.status(404).json({ message: "商品不存在" });
      }

      // 检查是否已经收藏
      const isAlreadySaved = await storage.isListingSavedByUser(req.user.id, listing.id);
      if (isAlreadySaved) {
        return res.status(400).json({ message: "已经收藏过该商品" });
      }

      // 保存收藏关系
      await storage.saveListingForUser({
        userId: req.user.id,
        listingId: listing.id
      });
      
      // 获取商品的供应商信息
      const vendor = await storage.getVendorProfile(listing.vendorId);
      const user = vendor ? await storage.getUser(vendor.userId) : null;
      
      // 返回完整的商品信息，并设置isSaved为true
      const responseData = {
        ...listing,
        vendor: vendor ? {
          id: vendor.id,
          companyName: vendor.companyName,
          verificationStatus: vendor.verificationStatus,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          } : null
        } : null,
        isSaved: true // 设置为已收藏
      };

      res.status(201).json(responseData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 收藏商品 (别名路由，与前端路径匹配)
  app.post("/api/users/current/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const { listingId } = req.body;

      // 检查商品是否存在
      const listing = await storage.getListing(parseInt(listingId));
      if (!listing) {
        return res.status(404).json({ message: "商品不存在" });
      }

      // 检查是否已经收藏
      const isAlreadySaved = await storage.isListingSavedByUser(req.user.id, listing.id);
      if (isAlreadySaved) {
        return res.status(400).json({ message: "已经收藏过该商品" });
      }

      // 保存收藏关系
      await storage.saveListingForUser({
        userId: req.user.id,
        listingId: listing.id
      });
      
      // 获取商品的供应商信息
      const vendor = await storage.getVendorProfile(listing.vendorId);
      const user = vendor ? await storage.getUser(vendor.userId) : null;
      
      // 返回完整的商品信息，并设置isSaved为true
      const responseData = {
        ...listing,
        vendor: vendor ? {
          id: vendor.id,
          companyName: vendor.companyName,
          verificationStatus: vendor.verificationStatus,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          } : null
        } : null,
        isSaved: true // 设置为已收藏
      };

      res.status(201).json(responseData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 取消收藏商品
  app.delete("/api/users/favorites/:listingId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const listingId = parseInt(req.params.listingId);

      const result = await storage.removeSavedListing(req.user.id, listingId);

      if (result) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "收藏不存在" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 取消收藏商品 (别名路由，与前端路径匹配)
  app.delete("/api/users/current/favorites/:listingId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const listingId = parseInt(req.params.listingId);

      const result = await storage.removeSavedListing(req.user.id, listingId);

      if (result) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "收藏不存在" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 用户修改自己的密码
  app.post("/api/user/change-password", async (req, res) => {
    try {
      console.log("Received user password change request:", { body: req.body });

      if (!req.isAuthenticated()) {
        console.log("User not authenticated");
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword, password } = req.body;

      // 兼容前端发送的newPassword或password参数
      const newPass = newPassword || password;

      if (!currentPassword || !newPass) {
        return res.status(400).json({ message: "当前密码和新密码不能为空" });
      }

      if (newPass.length < 6) {
        return res.status(400).json({ message: "新密码至少需要6个字符" });
      }

      // 获取用户信息
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "用户不存在" });
      }

      // 验证当前密码
      console.log(`Validating current password for user ${userId}`);
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      console.log(`Password validation result: ${isPasswordValid}`);

      if (!isPasswordValid) {
        console.log("Current password is invalid");
        return res.status(400).json({ message: "当前密码错误" });
      }

      // 生成新密码的哈希
      console.log(`Generating hash for new password`);
      const hashedPassword = await hashPassword(newPass);
      console.log(`Password hash generated successfully`);

      // 更新密码
      console.log(`Updating password for user ${userId}`);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });

      if (!updatedUser) {
        console.log(`Failed to update password for user ${userId}`);
        return res.status(500).json({ message: "更新密码失败" });
      }

      console.log(`Password updated successfully for user ${userId}`);

      // 返回成功消息
      res.json({ message: "密码更新成功" });
    } catch (error: any) {
      console.error("Error in POST /api/user/change-password:", error);
      res.status(500).json({ message: "修改密码失败" });
    }
  });

  // 获取用户收藏的商品
  app.get("/api/users/favorites", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const savedListings = await storage.getUserSavedListings(req.user.id);

      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        savedListings.map(async (listing) => {
          const vendor = await storage.getVendorProfile(listing.vendorId);
          const user = vendor ? await storage.getUser(vendor.userId) : null;

          return {
            ...listing,
            vendor: vendor ? {
              id: vendor.id,
              companyName: vendor.companyName,
              verificationStatus: vendor.verificationStatus,
              user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
              } : null
            } : null,
            isSaved: true
          };
        })
      );

      res.json(listingsWithVendorInfo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 订单API路由
  // 创建订单
  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const { items, totalAmount, currency = "CNY" } = req.body;

      // 创建订单
      const order = await storage.createOrder({
        userId: req.user.id,
        status: OrderStatus.CREATED,
        totalAmount,
        currency
      });

      // 创建订单项
      for (const item of items) {
        const listing = await storage.getListing(item.listingId);
        if (!listing) {
          continue;
        }

        await storage.createOrderItem({
          orderId: order.id,
          listingId: listing.id,
          quantity: item.quantity || 1,
          unitPrice: listing.price
        });
      }

      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取订单详情
  app.get("/api/orders/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "订单不存在" });
      }

      // 检查是否有权限查看订单
      if (order.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        // 如果是供应商，检查订单是否包含供应商的商品
        let hasPermission = false;

        if (req.user.role === UserRole.VENDOR) {
          const vendorProfile = await storage.getVendorProfileByUserId(req.user.id);
          if (vendorProfile) {
            const vendorOrders = await storage.getOrdersByVendorId(vendorProfile.id);
            hasPermission = vendorOrders.some(o => o.id === order.id);
          }
        }

        if (!hasPermission) {
          return res.status(403).json({ message: "权限不足" });
        }
      }

      // 获取订单项
      const orderItems = await storage.getOrderItems(order.id);

      // 获取订单项对应的商品
      const listingIds = orderItems.map(item => item.listingId);
      const listingsResult = listingIds.length > 0 ? 
        await db.select().from(listings).where(inArray(listings.id, listingIds)) : 
        [];
      
      // 将商品信息添加到订单项中
      const itemsWithListings = orderItems.map(item => {
        const listing = listingsResult.find(l => l.id === item.listingId);
        return {
          ...item,
          listing
        };
      });
      
      // 获取支付信息
      const payment = await storage.getPaymentByOrderId(order.id);

      res.json({
        ...order,
        items: itemsWithListings,
        payment
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取所有订单列表 (仅管理员)
  app.get("/api/orders/all", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const allOrders = await storage.getAllOrders();

      // 获取每个订单的详细信息
      const ordersWithDetails = await Promise.all(
        allOrders.map(async (order) => {
          try {
            // 处理用户ID转换问题
            const userId = Number(order.userId);
            if (isNaN(userId)) {
              console.log(`Warning: Invalid userId format for order ${order.id}:`, order.userId);
              return order;
            }

            const user = await storage.getUser(userId);
            const payment = await storage.getPaymentByOrderId(order.id);

            return {
              ...order,
              user: user ? user : null
            };
          } catch (error) {
            console.error(`获取订单记录失败 (订单ID: ${order.id}):`, error);
            return null;
          }
        })
      );
      
      // 过滤掉无效的订单记录
      const validOrderRecords = orderRecords.filter(record => record !== null);
      
      res.json(validOrderRecords);
    } catch (error: any) {
      console.error("获取订单记录失败:", error);
      res.status(500).json({ message: "获取订单记录失败" });
    }
  });

  // 获取用户订单列表
  app.get("/api/users/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const orders = await storage.getOrdersByUserId(req.user.id);

      // 获取每个订单的支付状态
      const ordersWithPaymentStatus = await Promise.all(
        orders.map(async (order) => {
          const payment = await storage.getPaymentByOrderId(order.id);
          return {
            ...order,
            paymentStatus: payment ? payment.status : null
          };
        })
      );

      res.json(ordersWithPaymentStatus);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取供应商商品列表
  app.get("/api/vendors/:vendorId/listings", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendorProfile(vendorId);

      if (!vendor) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      // 确保只有供应商自己可以查看商品
      if (vendor.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 获取供应商的所有商品（不管状态）
      const listings = await storage.getListingsByVendorId(vendorId);

      res.json(listings);
    } catch (error: any) {
      console.error("Error fetching vendor listings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 获取供应商订单列表
  app.get("/api/vendors/:vendorId/orders", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const vendor = await storage.getVendorProfile(vendorId);

      if (!vendor) {
        return res.status(404).json({ message: "供应商不存在" });
      }

      // 确保只有供应商自己可以查看订单
      if (vendor.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }

      const orders = await storage.getOrdersByVendorId(vendorId);

      // 获取每个订单的详细信息
      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          const orderItems = await storage.getOrderItems(order.id);
          const user = await storage.getUser(order.userId);

          // 筛选只属于该供应商的订单项
          const vendorListings = await storage.getListingsByVendorId(vendorId);
          const vendorListingIds = vendorListings.map(listing => listing.id);

          const vendorOrderItems = orderItems.filter(item =>
            vendorListingIds.includes(item.listingId)
          );

          // 获取订单项的商品详情
          const itemsWithDetails = await Promise.all(
            vendorOrderItems.map(async (item) => {
              const listing = await storage.getListing(item.listingId);
              return {
                ...item,
                listing
              };
            })
          );

          return {
            ...order,
            items: itemsWithDetails,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            } : null
          };
        })
      );

      res.json(detailedOrders);
    } catch (error: any) {
      console.error("获取供应商订单失败:", error);
      res.status(500).json({ message: t('error.serverError', req.language) });
    }
  });

  app.patch("/api/vendors/:vendorId/orders/:orderId", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const orderId = parseInt(req.params.orderId);
      const { status } = req.body;

      // 确保是当前供应商
      const vendorProfile = await storage.getVendorProfileByUserId(req.user.id);
      if (!vendorProfile || vendorProfile.id !== vendorId) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 获取订单
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "订单不存在" });
      }

      // 检查订单是否包含该供应商的商品
      const orderItems = await storage.getOrderItems(orderId);
      const vendorListings = await storage.getListingsByVendorId(vendorId);
      const vendorListingIds = vendorListings.map(listing => listing.id);
      
      const hasVendorItems = orderItems.some(item => 
        vendorListingIds.includes(item.listingId)
      );

      if (!hasVendorItems) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 更新订单状态
      const updatedOrder = await storage.updateOrderStatus(orderId, status as OrderStatus);

      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 删除订单
  app.delete("/api/vendors/:vendorId/orders/:orderId", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const orderId = parseInt(req.params.orderId);

      // 确保是当前供应商
      const vendorProfile = await storage.getVendorProfileByUserId(req.user.id);
      if (!vendorProfile || vendorProfile.id !== vendorId) {
        return res.status(403).json({ message: t('error.unauthorized', req.language) });
      }

      // 获取订单
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: t('error.orderNotFound', req.language) });
      }

      // 检查订单是否包含该供应商的商品
      const orderItems = await storage.getOrderItems(orderId);
      const vendorListings = await storage.getListingsByVendorId(vendorId);
      const vendorListingIds = vendorListings.map(listing => listing.id);
      
      const hasVendorItems = orderItems.some(item => 
        vendorListingIds.includes(item.listingId)
      );

      if (!hasVendorItems) {
        return res.status(403).json({ message: t('error.unauthorized', req.language) });
      }

      // 删除订单
      const success = await storage.deleteOrder(orderId);
      if (success) {
        res.json({ success: true, message: t('vendor.orderDeletedSuccess', req.language) });
      } else {
        res.status(500).json({ message: t('error.serverError', req.language) });
      }
    } catch (error: any) {
      console.error("删除订单失败:", error);
      res.status(500).json({ message: t('error.serverError', req.language) });
    }
  });

  // 支付API路由
  // 创建支付
  app.post("/api/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const { orderId, paymentMethod } = req.body;

      // 检查订单是否存在
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "订单不存在" });
      }

      // 检查是否为订单所有者
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 检查是否已经支付
      const existingPayment = await storage.getPaymentByOrderId(order.id);
      if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
        return res.status(400).json({ message: "订单已支付" });
      }

      // 模拟支付处理
      const paymentStatus = PaymentStatus.COMPLETED; // 在实际应用中，这将取决于支付网关的响应
      const transactionId = `TR${Date.now()}`;

      // 创建或更新支付记录
      let payment;
      if (existingPayment) {
        payment = await storage.updatePaymentStatus(existingPayment.id, paymentStatus, transactionId);
      } else {
        payment = await storage.createPayment({
          orderId,
          amount: order.totalAmount,
          currency: order.currency,
          status: paymentStatus,
          paymentMethod,
          transactionId
        });
      }

      // 更新订单状态
      await storage.updateOrderStatus(orderId, OrderStatus.PAID);

      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 评论API路由
  // 创建评论
  app.post("/api/listings/:listingId/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const listingId = parseInt(req.params.listingId);
      const { content, rating } = req.body;

      // 检查商品是否存在
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: t('error.productNotFound', req.language) });
      }

      // 检查用户是否购买过该商品
      const userOrders = await storage.getOrdersByUserId(req.user.id);
      
      // 筛选已支付、已处理、已发货、已交付或已完成的订单
      const validOrders = userOrders.filter(order => 
        order.status === OrderStatus.PAID || 
        order.status === OrderStatus.PROCESSING || 
        order.status === OrderStatus.SHIPPED || 
        order.status === OrderStatus.DELIVERED || 
        order.status === OrderStatus.COMPLETED);
      
      if (validOrders.length === 0) {
        return res.status(403).json({ 
          message: t('error.purchaseRequired', req.language) 
        });
      }
      
      // 检查这些订单中是否包含当前商品
      let hasPurchased = false;
      for (const order of validOrders) {
        const orderItems = await storage.getOrderItems(order.id);
        if (orderItems.some(item => item.listingId === listingId)) {
          hasPurchased = true;
          break;
        }
      }
      
      if (!hasPurchased) {
        return res.status(403).json({ 
          message: t('error.productPurchaseRequired', req.language) 
        });
      }
      
      // 检查用户是否已经评论过该商品
      const existingComments = await storage.getCommentsByListingId(listingId);
      const userComment = existingComments.find(comment => 
        comment.userId === req.user.id && 
        (comment.status === CommentStatus.APPROVED || comment.status === CommentStatus.PENDING)
      );
      
      if (userComment) {
        return res.status(400).json({ 
          message: t('error.alreadyReviewed', req.language) 
        });
      }

      const comment = await storage.createComment({
        userId: req.user.id,
        listingId,
        content,
        rating,
        status: CommentStatus.PENDING // 评论需要审核
      });

      res.status(201).json(comment);
    } catch (error: any) {
      console.error("提交评论失败:", error);
      res.status(500).json({ message: t('error.internalError', req.language) });
    }
  });

  // 获取待审核的评论 (仅管理员)
  app.get("/api/admin/comments/pending", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingComments = await storage.getPendingComments();

      // 获取每个评论的用户和商品信息
      const commentsWithDetails = await Promise.all(
        pendingComments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          const listing = await storage.getListing(comment.listingId);

          return {
            ...comment,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              avatar: user.avatar
            } : null,
            listing: listing ? {
              id: listing.id,
              title: listing.title,
              vendorId: listing.vendorId
            } : null
          };
        })
      );

      res.json(commentsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 审核评论 (仅管理员)
  app.patch("/api/admin/comments/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { status, reason } = req.body;

      const updatedComment = await storage.updateCommentStatus(commentId, status, reason);

      if (!updatedComment) {
        return res.status(404).json({ message: "评论不存在" });
      }

      res.json(updatedComment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 统计API路由 (仅管理员)
  app.get("/api/admin/statistics/vendors", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const vendors = await storage.getApprovedVendors();

      // 获取每个供应商的销售统计
      const vendorStats = await Promise.all(
        vendors.map(async (vendor) => {
          const user = await storage.getUser(vendor.userId);
          const listings = await storage.getListingsByVendorId(vendor.id);
          const activeListings = listings.filter(listing => listing.status === ListingStatus.ACTIVE);

          // 获取供应商的订单
          const orders = await storage.getOrdersByVendorId(vendor.id);
          const completedOrders = orders.filter(order =>
            order.status === OrderStatus.PAID ||
            order.status === OrderStatus.COMPLETED
          );

          // 计算总销售额
          let totalSales = 0;
          for (const order of completedOrders) {
            const orderItems = await storage.getOrderItems(order.id);
            const vendorListings = listings.map(listing => listing.id);

            for (const item of orderItems) {
              if (vendorListings.includes(item.listingId)) {
                totalSales += item.unitPrice * item.quantity;
              }
            }
          }

          return {
            vendor: {
              id: vendor.id,
              companyName: vendor.companyName,
              user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
              } : null
            },
            activeListingsCount: activeListings.length,
            totalListingsCount: listings.length,
            ordersCount: completedOrders.length,
            totalSales
          };
        })
      );

      res.json(vendorStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/statistics/users", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const regularUsers = users.filter(user => user.role === UserRole.USER);

      // 获取每个用户的消费统计
      const userStats = await Promise.all(
        regularUsers.map(async (user) => {
          const orders = await storage.getOrdersByUserId(user.id);
          const completedOrders = orders.filter(order =>
            order.status === OrderStatus.PAID ||
            order.status === OrderStatus.COMPLETED
          );

          // 计算总消费
          const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

          return {
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            },
            ordersCount: completedOrders.length,
            totalSpent
          };
        })
      );

      res.json(userStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 订单API路由
  // 创建订单
  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const { items, totalAmount, currency } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "订单项不能为空" });
      }

      // 创建订单
      const order = await storage.createOrder({
        userId: req.user.id,
        totalAmount,
        currency: currency || "CNY",
        status: OrderStatus.CREATED
      });

      // 创建订单项
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          listingId: item.listingId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      }

      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取用户订单
  app.get("/api/users/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const orders = await storage.getOrdersByUserId(req.user.id);

      // 获取每个订单的详细信息
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const orderItems = await storage.getOrderItems(order.id);
          const payment = await storage.getPaymentByOrderId(order.id);

          // 获取订单项的商品信息
          const itemsWithDetails = await Promise.all(
            orderItems.map(async (item) => {
              const listing = await storage.getListing(item.listingId);
              return {
                ...item,
                listing: listing ? {
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  type: listing.type,
                  downloadUrl: listing.downloadUrl
                } : null
              };
            })
          );

          return {
            ...order,
            items: itemsWithDetails,
            payment
          };
        })
      );

      res.json(ordersWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 支付API路由
  // 创建支付
  app.post("/api/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const { orderId, paymentMethod, amount, currency } = req.body;

      if (!orderId || !paymentMethod || !amount) {
        return res.status(400).json({ message: "缺少必要参数" });
      }

      // 获取订单信息
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "订单不存在" });
      }

      // 验证订单所有者
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 验证支付金额
      if (order.totalAmount !== amount) {
        return res.status(400).json({ message: "支付金额不匹配" });
      }

      // 创建支付记录
      const payment = await storage.createPayment({
        orderId,
        amount,
        currency: currency || "CNY",
        paymentMethod,
        status: PaymentStatus.PENDING,
        transactionId: null
      });

      // 模拟支付处理
      // 在真实应用中，这里应该调用支付网关API

      // 更新支付状态为完成
      const updatedPayment = await storage.updatePaymentStatus(
        payment.id,
        PaymentStatus.COMPLETED,
        `TRANS-${Date.now()}`
      );

      // 更新订单状态
      const updatedOrder = await storage.updateOrderStatus(orderId, OrderStatus.PAID);

      res.status(201).json({
        payment: updatedPayment,
        order: updatedOrder
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取支付详情
  app.get("/api/payments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);

      if (!payment) {
        return res.status(404).json({ message: "支付记录不存在" });
      }

      // 获取关联订单
      const order = await storage.getOrder(payment.orderId);

      // 验证支付所有者
      if (order.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 管理员API路由
  // 管理员统计数据
  app.get("/api/admin/stats", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      // 获取基础数据
      const users = await storage.getAllUsers();
      const vendors = await storage.getAllVendors();
      const listings = await storage.getAllListings();
      const orders = await storage.getAllOrders();
      const payments = await storage.getAllPayments();

      // 计算统计数据
      const totalUsers = users.length;
      const totalVendors = vendors.length;
      const pendingVendors = vendors.filter(v => v.verificationStatus === VendorVerificationStatus.PENDING).length;
      const activeListings = listings.filter(l => l.status === ListingStatus.ACTIVE).length;
      const pendingListings = listings.filter(l => l.status === ListingStatus.PENDING).length;
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length;
      const totalSales = payments
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0);

      res.json({
        users: {
          total: totalUsers,
          admins: users.filter(u => u.role === UserRole.ADMIN).length,
          vendors: users.filter(u => u.role === UserRole.VENDOR).length,
          customers: users.filter(u => u.role === UserRole.USER).length
        },
        vendors: {
          total: totalVendors,
          pending: pendingVendors,
          approved: vendors.filter(v => v.verificationStatus === VendorVerificationStatus.APPROVED).length,
          rejected: vendors.filter(v => v.verificationStatus === VendorVerificationStatus.REJECTED).length
        },
        listings: {
          total: listings.length,
          active: activeListings,
          pending: pendingListings,
          rejected: listings.filter(l => l.status === ListingStatus.REJECTED).length,
          draft: listings.filter(l => l.status === ListingStatus.DRAFT).length
        },
        orders: {
          total: totalOrders,
          created: orders.filter(o => o.status === OrderStatus.CREATED).length,
          paid: orders.filter(o => o.status === OrderStatus.PAID).length,
          completed: completedOrders,
          cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length
        },
        sales: {
          total: totalSales,
          currency: "CNY"
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取待审核的供应商列表 (仅管理员)
  app.get("/api/admin/pending-vendors", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingVendors = await storage.getPendingVendors();

      // 获取每个供应商的用户信息
      const vendorsWithUserInfo = await Promise.all(
        pendingVendors.map(async (vendor) => {
          const user = await storage.getUser(vendor.userId);
          return {
            ...vendor,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            } : null
          };
        })
      );

      res.json(vendorsWithUserInfo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取待审核的商品列表 (仅管理员)
  app.get("/api/admin/pending-listings", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingListings = await storage.getPendingListings();

      if (!pendingListings || pendingListings.length === 0) {
        return res.json([]);
      }

      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        pendingListings.map(async (listing) => {
          try {
            if (!listing || !listing.id) {
              console.log("Warning: Invalid listing object:", listing);
              return null;
            }

            if (!listing.vendorId) {
              console.log(`Warning: Listing without vendorId: ${listing.id}`);
              return { ...listing, vendor: null };
            }

            // 确保vendorId是数字或null
            let vendorId = null;
            if (listing.vendorId !== null) {
              if (typeof listing.vendorId === 'string') {
                const parsedId = parseInt(listing.vendorId);
                vendorId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof listing.vendorId === 'number') {
                vendorId = listing.vendorId;
              }
            }

            if (vendorId === null) {
              console.log(`Warning: Invalid vendorId format for listing ${listing.id}:`, listing.vendorId);
              return { ...listing, vendor: null };
            }

            const vendor = await storage.getVendorProfile(vendorId);
            if (!vendor) {
              console.log(`Warning: Vendor not found for listing ${listing.id}, vendorId:`, vendorId);
              return { ...listing, vendor: null };
            }

            // 处理用户ID转换问题
            let user = null;
            if (vendor.userId) {
              // 确保userId是数字
              let userId = null;
              if (typeof vendor.userId === 'string') {
                const parsedId = parseInt(vendor.userId);
                userId = isNaN(parsedId) ? null : parsedId;
              } else if (typeof vendor.userId === 'number') {
                userId = vendor.userId;
              }

              if (userId !== null) {
                user = await storage.getUser(userId);
              }
            }

            return {
              ...listing,
              vendor: vendor ? {
                id: vendor.id,
                companyName: vendor.companyName || "未命名公司",
                verificationStatus: vendor.verificationStatus,
                user: user ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatar: user.avatar
                } : null
              } : null
            };
          } catch (err) {
            console.error(`Error processing listing ${listing?.id || 'unknown'}:`, err);
            // 返回没有供应商信息的商品
            return listing ? { ...listing, vendor: null } : null;
          }
        })
      );

      // 过滤掉null值
      const validListings = listingsWithVendorInfo.filter(item => item !== null);

      res.json(validListings);
    } catch (error: any) {
      console.error("Error in /api/admin/pending-listings:", error);
      res.status(500).json({ message: error.message || "获取待审核商品列表失败" });
    }
  });

  // 获取所有用户 (仅管理员)
  app.get("/api/admin/users", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      console.log("获取所有用户列表...");
      const users = await storage.getAllUsers();
      console.log(`成功获取${users.length}个用户`);
      res.json(users);
    } catch (error: any) {
      console.error("Error in /api/admin/users:", error);
      res.status(500).json({ message: error.message || "获取用户列表失败" });
    }
  });

  // 更新用户信息 (仅管理员)
  app.patch("/api/admin/users/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { firstName, lastName, email, phone, role, status, language } = req.body;

      // 检查用户是否存在
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "用户不存在" });
      }

      // 如果要更新邮箱，检查邮箱是否已被其他用户使用
      if (email && email !== existingUser.email) {
        const userWithEmail = await storage.getUserByEmail(email);
        if (userWithEmail && userWithEmail.id !== userId) {
          return res.status(400).json({ message: "该邮箱已被其他用户使用" });
        }
      }

      // 更新用户信息
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
        phone,
        role,
        status,
        language
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "用户不存在" });
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/users/:id:", error);
      res.status(500).json({ message: error.message || "更新用户信息失败" });
    }
  });

  // 修改用户密码 (仅管理员)
  app.patch("/api/admin/users/:id/password", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      console.log("Received password change request:", { userId: req.params.id });

      const userId = parseInt(req.params.id);
      const { password } = req.body;

      if (!password || password.length < 6) {
        console.log("Password validation failed: too short or missing");
        return res.status(400).json({ message: "密码至少需要6个字符" });
      }

      // 检查用户是否存在
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        console.log(`User with ID ${userId} not found`);
        return res.status(404).json({ message: "用户不存在" });
      }

      console.log(`User found: ${existingUser.email}, generating password hash...`);

      // 使用我们的密码哈希函数
      try {
        // 使用用户输入的密码生成哈希
        const hashedPassword = await hashPassword(password);
        console.log("Password hashed successfully");

        // 更新用户密码
        const updatedUser = await storage.updateUser(userId, { password: hashedPassword });

        if (!updatedUser) {
          console.log(`Failed to update user ${userId}`);
          return res.status(404).json({ message: "用户不存在" });
        }

        console.log(`User ${userId} password updated successfully`);

        // 返回成功消息，不包含密码
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (updateError) {
        console.error("Error updating user password:", updateError);
        throw new Error("Password update failed");
      }
    } catch (error: any) {
      console.error("Error in PATCH /api/admin/users/:id/password:", error);
      res.status(500).json({ message: error.message || "修改密码失败" });
    }
  });

  // 获取所有供应商 (仅管理员)
  app.get("/api/admin/vendors", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const vendors = await storage.getAllVendors();

      // 获取每个供应商的用户信息
      const vendorsWithUserInfo = await Promise.all(
        vendors.map(async (vendor) => {
          const user = await storage.getUser(vendor.userId);
          return {
            ...vendor,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            } : null
          };
        })
      );

      res.json(vendorsWithUserInfo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 获取所有订单 (仅管理员)
  app.get("/api/admin/orders", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const orders = await storage.getAllOrders();

      // 获取每个订单的用户和支付信息
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const user = await storage.getUser(order.userId);
          const payment = await storage.getPaymentByOrderId(order.id);
          const orderItems = await storage.getOrderItems(order.id);

          return {
            ...order,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            } : null,
            payment,
            itemCount: orderItems.length
          };
        })
      );

      res.json(ordersWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 管理员更新订单状态
  app.patch("/api/admin/orders/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      const updatedOrder = await storage.updateOrderStatus(orderId, status);

      if (!updatedOrder) {
        return res.status(404).json({ message: "订单不存在" });
      }

      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===========================
  // 分类管理API路由
  // ===========================

  // 获取所有分类
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategoryWithProductCount();
      res.json(categories);
    } catch (error: any) {
      console.error("Error in /api/categories:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 获取单个分类
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategory(categoryId);

      if (!category) {
        return res.status(404).json({ message: "分类不存在" });
      }

      // 获取该分类下的商品数量
      const products = await storage.getListingsByCategoryId(categoryId);

      res.json({
        ...category,
        productsCount: products.length
      });
    } catch (error: any) {
      console.error("Error in /api/categories/:id:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 通过slug获取分类
  app.get("/api/categories/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getCategoryBySlug(slug);

      if (!category) {
        return res.status(404).json({ message: "分类不存在" });
      }

      // 获取该分类下的商品数量
      const products = await storage.getListingsByCategoryId(category.id);

      res.json({
        ...category,
        productsCount: products.length
      });
    } catch (error: any) {
      console.error("Error in /api/categories/slug/:slug:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 创建分类(仅管理员)
  app.post("/api/categories", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);

      // 检查slug是否已存在
      const existingCategory = await storage.getCategoryBySlug(categoryData.slug);
      if (existingCategory) {
        return res.status(400).json({ message: "Slug已被使用，请使用其他slug" });
      }

      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error: any) {
      console.error("Error in POST /api/categories:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "验证错误",
          errors: error.errors
        });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // 更新分类(仅管理员)
  app.patch("/api/categories/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData = req.body;

      // 如果要更新slug，检查是否已存在
      if (categoryData.slug) {
        const existingCategory = await storage.getCategoryBySlug(categoryData.slug);
        if (existingCategory && existingCategory.id !== categoryId) {
          return res.status(400).json({ message: "Slug已被使用，请使用其他slug" });
        }
      }

      const updatedCategory = await storage.updateCategory(categoryId, categoryData);

      if (!updatedCategory) {
        return res.status(404).json({ message: "分类不存在" });
      }

      res.json(updatedCategory);
    } catch (error: any) {
      console.error("Error in PATCH /api/categories/:id:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 删除分类(仅管理员)
  app.delete("/api/categories/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);

      // 检查分类是否存在
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "分类不存在" });
      }

      // 删除分类
      const result = await storage.deleteCategory(categoryId);

      res.json({ success: result });
    } catch (error: any) {
      console.error("Error in DELETE /api/categories/:id:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 获取分类下的商品
  app.get("/api/categories/:id/listings", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);

      // 检查分类是否存在
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "分类不存在" });
      }

      // 获取该分类的商品
      const listings = await storage.getListingsByCategoryId(categoryId);

      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        listings.map(async (listing) => {
          const vendor = await storage.getVendorProfile(listing.vendorId);
          const user = vendor ? await storage.getUser(vendor.userId) : null;

          return {
            ...listing,
            vendor: vendor ? {
              id: vendor.id,
              companyName: vendor.companyName,
              user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                avatar: user.avatar
              } : null
            } : null
          };
        })
      );

      res.json(listingsWithVendorInfo);
    } catch (error: any) {
      console.error("Error in /api/categories/:id/listings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // 图片上传接口
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "未收到文件" });
    }
    // 返回可访问的图片URL
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // 更新用户个人资料
  app.put("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const userId = parseInt(req.params.id);
      
      // 确保用户只能更新自己的资料，或者是管理员
      if (req.user.id !== userId && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: t('error.forbidden', req.language) });
      }

      const { firstName, lastName, email, phone, language } = req.body;
      
      // 验证必填字段
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: t('error.missingFields', req.language) });
      }

      // 更新用户资料
      const updatedUser = await db.update(users)
        .set({
          firstName,
          lastName,
          email,
          phone: phone || null,
          language: language || 'zh',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser || updatedUser.length === 0) {
        return res.status(404).json({ message: t('error.userNotFound', req.language) });
      }

      // 返回更新后的用户资料（不包含密码）
      const { password, ...userWithoutPassword } = updatedUser[0];
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("更新用户资料失败:", error);
      res.status(500).json({ message: t('error.updateFailed', req.language) });
    }
  });

  // 供应商更新商品信息
  app.patch("/api/listings/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const listingId = parseInt(req.params.id);
      
      // 获取商品信息
      const listing = await db.select().from(listings).where(eq(listings.id, listingId));
      
      if (listing.length === 0) {
        return res.status(404).json({ message: t('error.listingNotFound', req.language) });
      }
      
      // 检查权限：只有商品所有者或管理员可以更新
      if (req.user.role !== UserRole.ADMIN && listing[0].vendorId !== req.user.id) {
        return res.status(403).json({ message: t('error.forbidden', req.language) });
      }
      
      // 获取请求体中的更新数据
      const { 
        title, 
        description, 
        price, 
        type, 
        category, 
        tags, 
        images, 
        downloadUrl 
      } = req.body;
      
      // 构建更新数据
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // 只更新提供的字段
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (type !== undefined) updateData.type = type;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (images !== undefined) updateData.images = images;
      if (downloadUrl !== undefined) updateData.downloadUrl = downloadUrl;
      
      // 如果商品之前被拒绝，更新后将状态改为待审核
      if (listing[0].status === ListingStatus.REJECTED) {
        updateData.status = ListingStatus.PENDING; // 待审核
        updateData.rejectionReason = null; // 清除拒绝原因
      }
      
      // 更新商品
      const updatedListing = await db.update(listings)
        .set(updateData)
        .where(eq(listings.id, listingId))
        .returning();
      
      if (!updatedListing || updatedListing.length === 0) {
        return res.status(500).json({ message: t('error.updateFailed', req.language) });
      }
      
      res.json(updatedListing[0]);
    } catch (error: any) {
      console.error("更新商品失败:", error);
      res.status(500).json({ message: t('error.updateFailed', req.language) });
    }
  });

  // 辅助函数：根据时间范围筛选订单
  function filterOrdersByTimeRange(orders: any[], timeRange: string): any[] {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 从周日开始
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    return orders.filter(order => {
      const orderDate = order.createdAt instanceof Date 
        ? order.createdAt 
        : new Date(order.createdAt);
      
      switch (timeRange) {
        case 'today':
          return orderDate >= startOfDay;
        case 'week':
          return orderDate >= startOfWeek;
        case 'month':
          return orderDate >= startOfMonth;
        case 'year':
          return orderDate >= startOfYear;
        case 'all':
        default:
          return true;
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
