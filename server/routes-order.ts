import { Express } from "express";
import { storage } from "./storage";
import { OrderStatus } from "@shared/schema";
import { t } from "./i18n";

/**
 * 注册订单相关的路由
 */
export function registerOrderRoutes(app: Express) {
  // 用户确认收货（更新订单状态为已完成或已交付）
  app.patch("/api/orders/:orderId/confirm", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const orderId = parseInt(req.params.orderId);
      const { status } = req.body; // 可以是 DELIVERED 或 COMPLETED
      
      // 验证状态值
      if (status !== "DELIVERED" && status !== "COMPLETED") {
        return res.status(400).json({ 
          message: "状态值无效，只能设置为'已交付'或'已完成'" 
        });
      }

      // 检查订单是否存在
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "订单不存在" });
      }

      // 检查是否为订单所有者
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "权限不足" });
      }

      // 检查订单当前状态是否为已发货
      if (order.status !== "SHIPPED") {
        return res.status(400).json({ 
          message: "只能确认已发货的订单" 
        });
      }

      // 更新订单状态
      const updatedOrder = await storage.updateOrderStatus(orderId, status);

      res.json(updatedOrder);
    } catch (error) {
      console.error("确认收货失败:", error);
      res.status(500).json({ message: "确认收货失败，请稍后再试" });
    }
  });

  // 获取用户订单详情
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      const orderId = parseInt(req.params.orderId);
      
      // 检查订单是否存在
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "订单不存在" });
      }

      // 检查是否为订单所有者或管理员
      if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "权限不足" });
      }

      // 获取订单项
      const orderItems = await storage.getOrderItems(orderId);
      
      // 获取订单项的商品详情
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
              images: listing.images,
              downloadUrl: listing.downloadUrl
            } : null
          };
        })
      );

      // 获取支付信息
      const payment = await storage.getPaymentByOrderId(orderId);

      // 返回完整订单信息
      const orderDetails = {
        ...order,
        items: itemsWithDetails,
        payment
      };

      res.json(orderDetails);
    } catch (error) {
      console.error("获取订单详情失败:", error);
      res.status(500).json({ message: "获取订单详情失败，请稍后再试" });
    }
  });

  // 管理员获取所有订单
  app.get("/api/orders/all", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: t('error.unauthorized', req.language) });
      }

      // 检查是否为管理员
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: t('error.unauthorized', req.language) });
      }

      console.log('开始获取所有订单...');
      // 获取所有订单
      const allOrders = await storage.getAllOrders();
      console.log(`成功获取订单数量: ${allOrders.length}`);
      
      // 获取订单详情（包括用户信息和订单项）
      const detailedOrders = await Promise.all(
        allOrders.map(async (order) => {
          try {
            // 基本订单信息
            const orderData = {
              ...order,
              user: null,
              items: []
            };
            
            // 获取用户信息
            try {
              if (order.userId) {
                const user = await storage.getUser(order.userId);
                if (user) {
                  orderData.user = {
                    id: user.id,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || ''
                  };
                }
              }
            } catch (userError) {
              console.error(`获取订单 ${order.id} 的用户信息失败:`, userError);
              // 继续处理其他数据，不中断整个过程
            }
            
            // 获取订单项
            try {
              const items = await storage.getOrderItems(order.id);
              
              // 获取订单项的商品详情
              const itemsWithDetails = await Promise.all(
                items.map(async (item) => {
                  try {
                    const itemData = { ...item, listing: null };
                    
                    if (item.listingId) {
                      const listing = await storage.getListing(item.listingId);
                      if (listing) {
                        itemData.listing = {
                          id: listing.id,
                          title: listing.title || '商品名称不可用',
                          vendorId: listing.vendorId,
                          price: listing.price || 0,
                          images: listing.images || []
                        };
                      }
                    }
                    
                    return itemData;
                  } catch (itemError) {
                    console.error(`获取订单项 ${item.id} 的商品详情失败:`, itemError);
                    // 返回基本订单项信息，不包含商品详情
                    return { ...item, listing: null };
                  }
                })
              );
              
              orderData.items = itemsWithDetails;
            } catch (itemsError) {
              console.error(`获取订单 ${order.id} 的订单项失败:`, itemsError);
              // 继续处理其他订单，不中断整个过程
            }
            
            return orderData;
          } catch (orderError) {
            console.error(`处理订单 ${order.id} 时出错:`, orderError);
            // 返回基本订单信息，确保不会中断整个过程
            return {
              ...order,
              user: null,
              items: []
            };
          }
        })
      );

      console.log(`成功处理订单详情，准备返回 ${detailedOrders.length} 条记录`);
      res.json(detailedOrders);
    } catch (error) {
      console.error("获取所有订单失败:", error);
      if (error instanceof Error) {
        console.error("错误详情:", error.message);
        console.error("错误堆栈:", error.stack);
      }
      res.status(500).json({ message: "获取订单详情失败，请稍后再试" });
    }
  });
}
