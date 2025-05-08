import { Request, Response } from "express";
import { OrderStatus, UserRole } from "@shared/schema";
import { storage } from "./storage";

// 检查用户权限的中间件
const checkRole = (role: UserRole) => (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "未授权访问" });
  }

  if (req.user.role !== role && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "权限不足" });
  }

  next();
};

/**
 * 注册统计相关的API路由
 * @param app Express应用实例
 */
export function registerStatisticsRoutes(app: any) {
  // 获取管理员统计数据 - 用户消费统计
  app.get("/api/admin/statistics/users", checkRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      console.log("开始获取用户消费统计数据");
      const timeRange = req.query.timeRange as string || 'all';
      
      // 获取所有订单
      const allOrders = await storage.getAllOrders();
      console.log(`从数据库获取到 ${allOrders.length} 个订单`);
      
      // 根据时间范围筛选订单
      const filteredOrders = filterOrdersByTimeRange(allOrders, timeRange);
      console.log(`时间范围筛选后还有 ${filteredOrders.length} 个订单`);
      
      // 按用户ID分组统计
      const userStats = new Map<number, {
        userId: number;
        firstName: string;
        lastName: string;
        email: string;
        totalSpent: number;
        orderCount: number;
        lastOrderDate: string;
      }>();
      
      // 处理每个订单
      for (const order of filteredOrders) {
        // 只统计已完成或处理中的订单
        if (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.PROCESSING) {
          continue;
        }
        
        const userId = Number(order.userId);
        if (isNaN(userId)) {
          console.log(`订单 ${order.id} 的用户ID无效: ${order.userId}`);
          continue;
        }
        
        // 获取用户信息
        const user = await storage.getUser(userId);
        if (!user) {
          console.log(`找不到用户ID: ${userId}`);
          continue;
        }
        
        const orderDate = order.createdAt instanceof Date 
          ? order.createdAt.toISOString() 
          : new Date(order.createdAt).toISOString();
        
        if (userStats.has(userId)) {
          const stat = userStats.get(userId)!;
          stat.totalSpent += Number(order.totalAmount) || 0;
          stat.orderCount += 1;
          
          // 更新最后订单日期（如果更新）
          const lastOrderDate = new Date(stat.lastOrderDate);
          const currentOrderDate = new Date(orderDate);
          if (currentOrderDate > lastOrderDate) {
            stat.lastOrderDate = orderDate;
          }
        } else {
          userStats.set(userId, {
            userId,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            totalSpent: Number(order.totalAmount) || 0,
            orderCount: 1,
            lastOrderDate: orderDate
          });
        }
      }
      
      // 转换为数组并返回
      const result = Array.from(userStats.values());
      console.log(`生成了 ${result.length} 条用户消费统计数据`);
      res.json(result);
    } catch (error) {
      console.error("获取用户消费统计失败:", error);
      res.status(500).json({ message: "获取用户消费统计失败" });
    }
  });

  // 获取管理员统计数据 - 供应商销售统计
  app.get("/api/admin/statistics/vendors", checkRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      console.log("开始获取供应商销售统计数据");
      const timeRange = req.query.timeRange as string || 'all';
      
      // 获取所有订单
      const allOrders = await storage.getAllOrders();
      console.log(`从数据库获取到 ${allOrders.length} 个订单`);
      
      // 根据时间范围筛选订单
      const filteredOrders = filterOrdersByTimeRange(allOrders, timeRange);
      console.log(`时间范围筛选后还有 ${filteredOrders.length} 个订单`);
      
      // 获取所有订单项
      const orderItems = await Promise.all(
        filteredOrders.map(async (order) => {
          try {
            const items = await storage.getOrderItems(order.id);
            return items;
          } catch (error) {
            console.error(`获取订单项失败 (订单ID: ${order.id}):`, error);
            return [];
          }
        })
      );
      
      // 扁平化订单项数组
      const allOrderItems = orderItems.flat();
      console.log(`共获取到 ${allOrderItems.length} 个订单项`);
      
      // 按供应商ID分组统计
      const vendorStats = new Map<number, {
        vendorId: number;
        companyName: string;
        totalSales: number;
        productCount: number;
        orderCount: number;
        lastSaleDate: string;
        productIds: Set<number>; // 用于计算不同商品数量
        orderIds: Set<number>;   // 用于计算不同订单数量
      }>();
      
      // 处理每个订单项
      for (const item of allOrderItems) {
        // 获取商品信息
        const listing = await storage.getListing(item.listingId);
        if (!listing) {
          console.log(`找不到商品ID: ${item.listingId}`);
          continue;
        }
        
        const vendorId = Number(listing.vendorId);
        if (isNaN(vendorId)) {
          console.log(`商品 ${item.listingId} 的供应商ID无效: ${listing.vendorId}`);
          continue;
        }
        
        // 获取供应商信息
        const vendor = await storage.getVendorProfile(vendorId);
        if (!vendor) {
          console.log(`找不到供应商ID: ${vendorId}`);
          continue;
        }
        
        // 获取订单信息
        const order = filteredOrders.find(o => o.id === item.orderId);
        if (!order) {
          console.log(`找不到订单ID: ${item.orderId}`);
          continue;
        }
        
        // 只统计已完成或处理中的订单
        if (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.PROCESSING) {
          continue;
        }
        
        const orderDate = order.createdAt instanceof Date 
          ? order.createdAt.toISOString() 
          : new Date(order.createdAt).toISOString();
        
        const itemTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
        
        if (vendorStats.has(vendorId)) {
          const stat = vendorStats.get(vendorId)!;
          stat.totalSales += itemTotal;
          stat.productIds.add(item.listingId);
          stat.orderIds.add(item.orderId);
          
          // 更新最后销售日期（如果更新）
          const lastSaleDate = new Date(stat.lastSaleDate);
          const currentOrderDate = new Date(orderDate);
          if (currentOrderDate > lastSaleDate) {
            stat.lastSaleDate = orderDate;
          }
        } else {
          vendorStats.set(vendorId, {
            vendorId,
            companyName: vendor.companyName || '',
            totalSales: itemTotal,
            productCount: 0, // 稍后计算
            orderCount: 0,   // 稍后计算
            lastSaleDate: orderDate,
            productIds: new Set([item.listingId]),
            orderIds: new Set([item.orderId])
          });
        }
      }
      
      // 计算不同商品和订单数量，并转换为数组
      const result = Array.from(vendorStats.values()).map(stat => ({
        vendorId: stat.vendorId,
        companyName: stat.companyName,
        totalSales: stat.totalSales,
        productCount: stat.productIds.size,
        orderCount: stat.orderIds.size,
        lastSaleDate: stat.lastSaleDate
      }));
      
      console.log(`生成了 ${result.length} 条供应商销售统计数据`);
      res.json(result);
    } catch (error) {
      console.error("获取供应商销售统计失败:", error);
      res.status(500).json({ message: "获取供应商销售统计失败" });
    }
  });

  // 获取管理员统计数据 - 订单记录
  app.get("/api/admin/statistics/orders", checkRole(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      console.log("开始获取订单记录数据");
      const timeRange = req.query.timeRange as string || 'all';
      
      // 获取所有订单
      const allOrders = await storage.getAllOrders();
      console.log(`从数据库获取到 ${allOrders.length} 个订单`);
      
      // 根据时间范围筛选订单
      const filteredOrders = filterOrdersByTimeRange(allOrders, timeRange);
      console.log(`时间范围筛选后还有 ${filteredOrders.length} 个订单`);
      
      // 获取订单详情
      const orderRecords = await Promise.all(
        filteredOrders.map(async (order) => {
          try {
            const userId = Number(order.userId);
            if (isNaN(userId)) {
              console.log(`订单 ${order.id} 的用户ID无效: ${order.userId}`);
              return null;
            }
            
            // 获取用户信息
            const user = await storage.getUser(userId);
            if (!user) {
              console.log(`找不到用户ID: ${userId}`);
              return null;
            }
            
            // 获取支付信息
            const payment = await storage.getPaymentByOrderId(order.id);
            
            // 获取订单项
            const orderItems = await storage.getOrderItems(order.id);
            console.log(`订单 ${order.id} 有 ${orderItems.length} 个订单项`);
            
            // 获取订单项详情
            const itemsWithDetails = await Promise.all(
              orderItems.map(async (item) => {
                try {
                  const listing = await storage.getListing(item.listingId);
                  if (!listing) {
                    console.log(`找不到商品ID: ${item.listingId}`);
                    return null;
                  }
                  
                  const vendorId = Number(listing.vendorId);
                  if (isNaN(vendorId)) {
                    console.log(`商品 ${item.listingId} 的供应商ID无效: ${listing.vendorId}`);
                    return null;
                  }
                  
                  const vendor = await storage.getVendorProfile(vendorId);
                  if (!vendor) {
                    console.log(`找不到供应商ID: ${vendorId}`);
                  }
                  
                  return {
                    id: item.id,
                    listingId: item.listingId,
                    listingTitle: listing.title || '',
                    vendorId: vendorId,
                    vendorName: vendor ? vendor.companyName : '',
                    unitPrice: Number(item.unitPrice) || 0,
                    quantity: Number(item.quantity) || 1
                  };
                } catch (error) {
                  console.error(`获取订单项详情失败 (订单项ID: ${item.id}):`, error);
                  return null;
                }
              })
            );
            
            // 过滤掉无效的订单项
            const validItems = itemsWithDetails.filter(item => item !== null) as any[];
            console.log(`订单 ${order.id} 有 ${validItems.length} 个有效订单项`);
            
            return {
              id: order.id,
              userId: userId,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              userEmail: user.email || '',
              totalAmount: Number(order.totalAmount) || 0,
              status: order.status || '',
              createdAt: order.createdAt instanceof Date 
                ? order.createdAt.toISOString() 
                : new Date(order.createdAt).toISOString(),
              paymentStatus: payment ? payment.status : '',
              items: validItems
            };
          } catch (error) {
            console.error(`获取订单记录失败 (订单ID: ${order.id}):`, error);
            return null;
          }
        })
      );
      
      // 过滤掉无效的订单记录
      const validOrderRecords = orderRecords.filter(record => record !== null);
      console.log(`生成了 ${validOrderRecords.length} 条有效订单记录`);
      
      res.json(validOrderRecords);
    } catch (error) {
      console.error("获取订单记录失败:", error);
      res.status(500).json({ message: "获取订单记录失败" });
    }
  });
}

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
