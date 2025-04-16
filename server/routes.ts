import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  ListingStatus, 
  UserRole, 
  VendorVerificationStatus,
  OrderStatus,
  PaymentStatus,
  CommentStatus
} from "@shared/schema";
import { i18nMiddleware, t } from "./i18n";

export async function registerRoutes(app: Express): Promise<Server> {
  // 设置国际化中间件
  app.use(i18nMiddleware);

  // 设置认证
  setupAuth(app);

  // 检查用户权限的中间件
  const checkRole = (role: UserRole) => (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: t('error.unauthorized', req.language) });
    }
    
    if (req.user.role !== role && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "权限不足" });
    }
    
    next();
  };

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 商品API路由
  // 获取商品列表（支持分页和过滤）
  app.get("/api/listings", async (req, res) => {
    try {
      const { 
        limit = 10, 
        offset = 0, 
        category,
        search,
        minPrice,
        maxPrice,
        tags 
      } = req.query;
      
      let listings;
      
      if (search) {
        // 搜索商品
        const filters = {
          category: category as string,
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
          tags: tags ? (tags as string).split(',') : undefined
        };
        
        listings = await storage.searchListings(search as string, filters);
      } else if (category) {
        // 按分类获取商品
        listings = await storage.getListingsByCategory(category as string);
      } else {
        // 获取所有活跃商品
        listings = await storage.getActiveListings(
          parseInt(limit as string), 
          parseInt(offset as string)
        );
      }
      
      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        listings.map(async (listing) => {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
            } : null
          };
        })
      );
      
      res.json(listingsWithVendorInfo);
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 获取所有商品 (仅管理员)
  app.get("/api/listings/all", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const allListings = await storage.getAllListings();
      
      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        allListings.map(async (listing) => {
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
            } : null
          };
        })
      );
      
      res.json(listingsWithVendorInfo);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 获取待审核的商品 (仅管理员)
  app.get("/api/listings/pending", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingListings = await storage.getPendingListings();
      
      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        pendingListings.map(async (listing) => {
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
            } : null
          };
        })
      );
      
      res.json(listingsWithVendorInfo);
    } catch (error) {
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
      
      const savedListing = await storage.saveListingForUser({
        userId: req.user.id,
        listingId: listing.id
      });
      
      res.status(201).json(savedListing);
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
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
    } catch (error) {
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
    } catch (error) {
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
      
      // 获取订单项的商品详情
      const orderItemsWithDetails = await Promise.all(
        orderItems.map(async (item) => {
          const listing = await storage.getListing(item.listingId);
          return {
            ...item,
            listing: listing ? {
              id: listing.id,
              title: listing.title,
              description: listing.description,
              price: listing.price,
              type: listing.type,
              images: listing.images,
              category: listing.category,
              downloadUrl: listing.downloadUrl
            } : null
          };
        })
      );
      
      // 获取支付信息
      const payment = await storage.getPaymentByOrderId(order.id);
      
      res.json({
        ...order,
        items: orderItemsWithDetails,
        payment
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
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
    } catch (error) {
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
                listing: listing ? {
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  type: listing.type,
                  images: listing.images
                } : null
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // 更新订单状态 (供应商)
  app.patch("/api/vendors/:vendorId/orders/:orderId", checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const orderId = parseInt(req.params.orderId);
      const { status } = req.body;
      
      const vendor = await storage.getVendorProfile(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "供应商不存在" });
      }
      
      // 确保只有供应商自己可以更新订单
      if (vendor.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "权限不足" });
      }
      
      // 确保订单包含供应商的商品
      const vendorOrders = await storage.getOrdersByVendorId(vendorId);
      const isVendorOrder = vendorOrders.some(order => order.id === orderId);
      
      if (!isVendorOrder) {
        return res.status(403).json({ message: "权限不足" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "订单不存在" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
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
          orderId: order.id,
          amount: order.totalAmount,
          currency: order.currency,
          status: paymentStatus,
          paymentMethod,
          transactionId
        });
      }
      
      // 更新订单状态
      await storage.updateOrderStatus(order.id, OrderStatus.PAID);
      
      res.status(201).json(payment);
    } catch (error) {
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
        return res.status(404).json({ message: "商品不存在" });
      }
      
      // 检查用户是否购买过该商品（实际应用中应该检查）
      // 这里简化处理，允许所有用户评论
      
      const comment = await storage.createComment({
        userId: req.user.id,
        listingId,
        content,
        rating,
        status: CommentStatus.PENDING // 评论需要审核
      });
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: error.message });
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 获取待审核的商品列表 (仅管理员)
  app.get("/api/admin/pending-listings", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const pendingListings = await storage.getPendingListings();
      
      // 获取每个商品的供应商信息
      const listingsWithVendorInfo = await Promise.all(
        pendingListings.map(async (listing) => {
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
            } : null
          };
        })
      );
      
      res.json(listingsWithVendorInfo);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 获取所有用户 (仅管理员)
  app.get("/api/users/all", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 更新用户信息 (仅管理员)
  app.patch("/api/users/:id", checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role, status } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { role, status });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "用户不存在" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 获取所有供应商 (仅管理员)
  app.get("/api/vendors/all", checkRole(UserRole.ADMIN), async (req, res) => {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 获取所有订单 (仅管理员)
  app.get("/api/orders/all", checkRole(UserRole.ADMIN), async (req, res) => {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
