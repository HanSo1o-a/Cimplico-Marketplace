import { Order as BaseOrder, OrderItem, Listing, OrderStatus } from "../../../shared/schema";

// 扩展订单类型，包含管理员订单管理页面所需的额外属性
export interface ExtendedOrder extends BaseOrder {
  // 订单项目
  items?: ExtendedOrderItem[];
  
  // 支付相关信息
  paymentMethod?: string;
  paymentId?: string;
  
  // 订单状态时间戳
  paidAt?: Date | string | null;
  shippedAt?: Date | string | null;
  completedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  
  // 订单备注
  notes?: string;
}

// 扩展订单项类型，包含商品信息
export interface ExtendedOrderItem extends OrderItem {
  listing?: ExtendedListing;
}

// 扩展商品类型，包含下载链接
export interface ExtendedListing extends Omit<Listing, 'downloadUrl'> {
  downloadUrl?: string | null;
}

// 订单状态文本映射
export const orderStatusText = {
  [OrderStatus.CREATED]: "已下单",
  [OrderStatus.PAID]: "已支付",
  [OrderStatus.SHIPPED]: "已发货",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.REFUNDED]: "已退款"
};
