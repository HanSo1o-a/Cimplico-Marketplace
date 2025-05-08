import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { OrderStatus } from "@shared/schema";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  Clock, 
  Package, 
  RefreshCcw, 
  ShieldOff, 
  Search, 
  Filter, 
  User, 
  Download,
  ChevronDown,
  ChevronUp,
  Eye
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner"; // 使用正确的Spinner组件导入路径

// 扩展订单类型
interface ExtendedOrder {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string | null;
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
  paidAt?: string | null;
  shippedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  items?: ExtendedOrderItem[];
}

// 扩展订单项类型
interface ExtendedOrderItem {
  id: number;
  orderId: number;
  listingId: number;
  quantity: number;
  unitPrice: number;
  listing?: ExtendedListing;
}

// 扩展商品类型
interface ExtendedListing {
  id: number;
  title: string;
  description: string;
  price: number;
  type: string;
  status: string;
  images: string[];
  downloadUrl: string;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason: string | null;
  vendorId: number;
  categoryId: number;
  category: string;
  tags: string[];
}

// 用户类型
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

const AdminOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // 状态管理
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<number, any[]>>({});
  const [loadingOrderItems, setLoadingOrderItems] = useState<Record<number, boolean>>({});
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userOrders, setUserOrders] = useState<ExtendedOrder[]>([]);
  const [userFavorites, setUserFavorites] = useState<any[]>([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);
  const [loadingUserFavorites, setLoadingUserFavorites] = useState(false);

  // 加载订单项数据
  const loadOrderItems = async (orderId: number) => {
    if (orderItemsMap[orderId]) return; // 已加载过，不重复加载
    
    try {
      setLoadingOrderItems(prev => ({ ...prev, [orderId]: true }));
      const details = await fetchOrderDetails(orderId);
      if (details && details.items) {
        setOrderItemsMap(prev => ({ ...prev, [orderId]: details.items }));
      }
    } catch (error) {
      console.error("获取订单项目失败:", error);
    } finally {
      setLoadingOrderItems(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // 当展开订单时加载订单项
  useEffect(() => {
    expandedOrders.forEach(orderId => {
      loadOrderItems(orderId);
    });
  }, [expandedOrders]);

  // 获取所有订单
  const { data: orders = [], isLoading, error, refetch } = useQuery<ExtendedOrder[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      try {
        // 使用真实API获取所有订单
        const response = await apiRequest("GET", "/api/orders/all");
        return response || [];
      } catch (error) {
        console.error("获取订单失败:", error);
        toast({
          title: t("admin.fetchOrdersError"),
          variant: "destructive"
        });
        return [];
      }
    },
    refetchOnWindowFocus: false
  });

  // 获取所有用户数据
  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiRequest("GET", "/api/admin/users");
      if (response && Array.isArray(response)) {
        setUsers(response);
      }
    } catch (error) {
      console.error("获取用户列表失败:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 获取用户详情
  const fetchUserDetails = async (userId: number) => {
    try {
      setLoadingUserData(true);
      // 首先尝试从已加载的用户列表中查找
      const userFromList = users.find((u: User) => u.id === userId);
      
      if (userFromList) {
        setSelectedUserData(userFromList);
        return userFromList;
      }
      
      // 如果列表中没有，尝试从API获取
      const response = await apiRequest("GET", `/api/users/${userId}`);
      setSelectedUserData(response);
      return response;
    } catch (error) {
      console.error("获取用户详情失败:", error);
      toast({
        title: t("admin.fetchUserError"),
        description: t("admin.userDetailsFetchFailed"),
        variant: "destructive"
      });
      return null;
    } finally {
      setLoadingUserData(false);
    }
  };

  // 获取用户订单
  const fetchUserOrders = async (userId: number) => {
    try {
      setLoadingUserOrders(true);
      // 使用真实API获取用户订单
      const response = await apiRequest("GET", `/api/users/${userId}/orders`);
      if (response && Array.isArray(response)) {
        setUserOrders(response);
      } else {
        setUserOrders([]);
      }
    } catch (error) {
      console.error("获取用户订单失败:", error);
      toast({
        title: t("admin.fetchUserError"),
        description: t("admin.userOrdersFetchFailed"),
        variant: "destructive"
      });
      setUserOrders([]);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  // 获取用户收藏
  const fetchUserFavorites = async (userId: number) => {
    try {
      setLoadingUserFavorites(true);
      // 使用真实API获取用户收藏
      const response = await apiRequest("GET", `/api/users/${userId}/favorites`);
      if (response && Array.isArray(response)) {
        setUserFavorites(response);
      } else {
        setUserFavorites([]);
      }
    } catch (error) {
      console.error("获取用户收藏失败:", error);
      toast({
        title: t("admin.fetchUserError"),
        description: t("admin.userFavoritesFetchFailed"),
        variant: "destructive"
      });
      setUserFavorites([]);
    } finally {
      setLoadingUserFavorites(false);
    }
  };

  // 加载数据
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // 获取订单详情
  const fetchOrderDetails = async (orderId: number) => {
    try {
      // 使用真实API获取订单详情
      const orderDetails = await apiRequest("GET", `/api/orders/${orderId}`);
      return orderDetails;
    } catch (error) {
      console.error("获取订单详情失败:", error);
      return null;
    }
  };

  // 打开订单详情对话框
  const openOrderDetail = async (order: ExtendedOrder) => {
    try {
      // 获取订单详情，包括订单项
      const orderDetails = await fetchOrderDetails(order.id);
      if (orderDetails) {
        setSelectedOrder(orderDetails as unknown as ExtendedOrder);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("获取订单详情失败:", error);
    }
  };

  // 打开用户详情对话框
  const openUserDialog = async (userId: number) => {
    setSelectedUserId(userId);
    setUserDialogOpen(true);
    await fetchUserDetails(userId);
    await fetchUserOrders(userId);
    await fetchUserFavorites(userId);
  };

  // 订单操作
  const handleShip = async (orderId: number) => {
    try {
      // 模拟发货操作
      toast({
        title: t("admin.orderShipped"),
        description: t("admin.orderShippedDesc"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.shipError"),
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (orderId: number) => {
    try {
      // 模拟完成订单操作
      toast({
        title: t("admin.orderCompleted"),
        description: t("admin.orderCompletedDesc"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.completeError"),
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    
    try {
      // 模拟取消订单操作
      toast({
        title: t("admin.orderCancelled"),
        description: t("admin.orderCancelledDesc"),
      });
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedOrder(null);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.cancelError"),
        variant: "destructive",
      });
    }
  };

  // 切换订单展开状态
  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  // 切换订单项目的展开/折叠状态
  const toggleOrderItems = (orderId: number) => {
    setExpandedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        // 加载订单项数据
        loadOrderItems(orderId);
        return [...prev, orderId];
      }
    });
  };

  // 打开取消订单对话框
  const openCancelDialog = (order: ExtendedOrder) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  // 过滤订单
  const filteredOrders = orders.filter((order: ExtendedOrder) => {
    // 状态过滤
    if (statusFilter !== "ALL" && order.status !== statusFilter) {
      return false;
    }
    
    // 搜索过滤
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const orderIdMatch = order.id.toString().includes(searchLower);
      const userIdMatch = order.userId.toString().includes(searchLower);
      const customerMatch = getUserName(order.userId).toLowerCase().includes(searchLower);
      
      return orderIdMatch || userIdMatch || customerMatch;
    }
    
    return true;
  });

  // 排序订单
  const sortedOrders = [...filteredOrders].sort((a: ExtendedOrder, b: ExtendedOrder) => {
    // 默认按创建时间降序排序（最新的在前面）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "CREATED":
        return <Badge variant="outline">{t("order.status.CREATED")}</Badge>;
      case "PAID":
        return <Badge variant="secondary">{t("order.status.PAID")}</Badge>;
      case "SHIPPED":
        return <Badge variant="default" className="bg-blue-500">{t("order.status.SHIPPED")}</Badge>;
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-500">{t("order.status.COMPLETED")}</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">{t("order.status.CANCELLED")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStatusText = (status: string) => {
    switch (status) {
      case "CREATED":
        return "已下单";
      case "PAID":
        return "已支付";
      case "SHIPPED":
        return "已发货";
      case "COMPLETED":
        return "已完成";
      case "CANCELLED":
        return "已取消";
      default:
        return status;
    }
  };

  // 根据用户ID获取用户信息
  const getUserName = (userId: number) => {
    const user = users.find((u: User) => u.id === userId);
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return `用户 #${userId}`;
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">{t("admin.orderManagement")}</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("admin.orderFilters")}</CardTitle>
          <CardDescription>
            {t("admin.orderFiltersDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("admin.searchOrders")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("admin.allStatuses")}</SelectItem>
                  <SelectItem value="CREATED">{t("order.status.CREATED")}</SelectItem>
                  <SelectItem value="PAID">{t("order.status.PAID")}</SelectItem>
                  <SelectItem value="SHIPPED">{t("order.status.SHIPPED")}</SelectItem>
                  <SelectItem value="COMPLETED">{t("order.status.COMPLETED")}</SelectItem>
                  <SelectItem value="CANCELLED">{t("order.status.CANCELLED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
              >
                {t("admin.clearFilters")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.allOrders")}</CardTitle>
          <CardDescription>
            {t("admin.allOrdersDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedOrders.length > 0 ? (
            <div className="space-y-4">
              {sortedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500">{t("order.statusLabel")}:</span>
                          <div className="mt-1">
                            {renderStatusBadge(order.status)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-1 text-sm text-gray-500">
                          <p>
                            {t("order.date")}: {order.createdAt ? formatDate(order.createdAt) : ''}
                          </p>
                          <p>
                            {t("order.customer")}: {order.userId ? getUserName(order.userId) : ''}
                          </p>
                          <p className="font-medium text-black">
                            {t("order.total")}: ¥{formatPrice(order.totalAmount)}
                          </p>
                        </div>
                        
                        {/* 展开/折叠的订单项目 */}
                        {expandedOrders.includes(order.id) && (
                          <div className="mt-4 space-y-2">
                            {loadingOrderItems[order.id] ? (
                              <div className="text-center py-4"><Spinner size="sm" /></div>
                            ) : orderItemsMap[order.id] && orderItemsMap[order.id].length > 0 ? (
                              orderItemsMap[order.id].map(item => (
                                <div key={item.id} className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex items-start">
                                    <div className="h-12 w-12 rounded overflow-hidden mr-3 flex-shrink-0">
                                      <img 
                                        src={item.listing?.images?.[0] || "https://via.placeholder.com/150"}
                                        alt={item.listing?.title || "商品图片"} 
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex justify-between">
                                        <h3 className="font-medium">{item.listing?.title || `商品 #${item.listingId}`}</h3>
                                        <p className="font-medium">¥{formatPrice(item.unitPrice)}</p>
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        数量: {item.quantity}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-2 text-gray-500">{t("order.noItems")}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleOrderItems(order.id)}
                            className="mr-2"
                          >
                            {expandedOrders.includes(order.id) ? (
                              <>
                                <ChevronUp className="mr-1 h-3 w-3" />
                                {t("admin.hideItems")}
                              </>
                            ) : (
                              <>
                                <ChevronDown className="mr-1 h-3 w-3" />
                                {t("admin.showItems")}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                          >
                            <Eye className="mr-1 h-3 w-3" /> {t("common.view")}
                          </Button>
                        </div>
                        
                        <div className="flex gap-2 justify-end mt-2">
                          {order.status === "PAID" && (
                            <Button
                              size="sm"
                              onClick={() => handleShip(order.id)}
                            >
                              {t("admin.shipOrder")}
                            </Button>
                          )}
                          {order.status === "SHIPPED" && (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(order.id)}
                            >
                              {t("admin.completeOrder")}
                            </Button>
                          )}
                          {(order.status === "CREATED" || order.status === "PAID") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCancelDialog(order)}
                            >
                              {t("admin.cancelOrder")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{t("admin.noOrders")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 订单详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("admin.orderDetails")}</DialogTitle>
            <DialogDescription>
              {t("admin.orderDetailsDesc")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="mt-4">
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">{t("admin.basicDetails")}</TabsTrigger>
                  <TabsTrigger value="items">{t("admin.orderItems")}</TabsTrigger>
                  <TabsTrigger value="customer">{t("admin.customerInfo")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">{t("order.id")}</h3>
                      <p className="font-medium">{selectedOrder.id}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">{t("order.date")}</h3>
                      <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">{t("order.statusLabel")}</h3>
                      <div className="mt-1">
                        {renderStatusBadge(selectedOrder.status)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">{t("order.total")}</h3>
                      <p className="font-medium text-lg">¥{formatPrice(selectedOrder.totalAmount)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">{t("order.paymentMethod")}</h3>
                      <p className="font-medium">{selectedOrder?.paymentMethod || t("order.notSpecified")}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">{t("order.paymentId")}</h3>
                      <p className="font-medium">{selectedOrder?.paymentId || t("order.notSpecified")}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h3 className="font-medium text-sm text-gray-500 mb-1">{t("order.notes")}</h3>
                    <p className="font-medium">{selectedOrder?.notes || t("order.noNotes")}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      {selectedOrder.status === "PAID" && (
                        <Button onClick={() => handleShip(selectedOrder.id)}>
                          {t("admin.shipOrder")}
                        </Button>
                      )}
                      {selectedOrder.status === "SHIPPED" && (
                        <Button onClick={() => handleComplete(selectedOrder.id)}>
                          {t("admin.completeOrder")}
                        </Button>
                      )}
                      {(selectedOrder.status === "CREATED" || selectedOrder.status === "PAID") && (
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() => {
                            setDetailDialogOpen(false);
                            openCancelDialog(selectedOrder);
                          }}
                        >
                          {t("admin.cancelOrder")}
                        </Button>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                      {t("common.close")}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="items">
                  <div className="space-y-4">
                    {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-start">
                            {item.listing?.images && Array.isArray(item.listing.images) && item.listing.images.length > 0 && (
                              <div className="h-16 w-16 rounded overflow-hidden mr-4 flex-shrink-0">
                                <img 
                                  src={typeof item.listing.images[0] === 'string' ? item.listing.images[0] : ''}
                                  alt={item.listing?.title || '商品图片'} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <h3 className="font-medium">{item.listing?.title || `商品 #${item.listingId}`}</h3>
                                <p className="font-medium">¥{formatPrice(item.unitPrice)}</p>
                              </div>
                              <div className="flex justify-between text-sm text-gray-500 mt-1">
                                <p>数量: {item.quantity}</p>
                                <p>类型: {item.listing?.type === "DIGITAL" ? "数字产品" : "实体产品"}</p>
                              </div>
                              {(selectedOrder.status === "SHIPPED" || selectedOrder.status === "COMPLETED") && 
                               item.listing?.downloadUrl && (
                                <div className="mt-3">
                                  <a 
                                    href={item.listing.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90"
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    {t("order.download")}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-gray-500">{t("order.noItems")}</p>
                    )}
                    
                    <div className="bg-white p-4 rounded-md border">
                      <div className="flex justify-between py-2">
                        <span>{t("order.subtotal")}</span>
                        <span>¥{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between py-2 font-bold">
                        <span>{t("order.total")}</span>
                        <span>¥{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="customer">
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center mb-4">
                      <User className="h-10 w-10 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium">{t("order.customerInfo")}</h3>
                        <p className="text-sm text-gray-500">{t("order.userId")}: {selectedOrder.userId ? getUserName(selectedOrder.userId) : ''}</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (selectedOrder.userId) {
                          openUserDialog(selectedOrder.userId);
                        }
                      }}
                    >
                      {t("admin.viewCustomer")}
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">{t("order.orderHistory")}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t("order.created")}</span>
                        <span>{formatDate(selectedOrder?.createdAt)}</span>
                      </div>
                      {selectedOrder?.paidAt && (
                        <div className="flex justify-between text-sm">
                          <span>{t("order.paid")}</span>
                          <span>{formatDate(selectedOrder.paidAt)}</span>
                        </div>
                      )}
                      {selectedOrder?.shippedAt && (
                        <div className="flex justify-between text-sm">
                          <span>{t("order.shipped")}</span>
                          <span>{formatDate(selectedOrder.shippedAt)}</span>
                        </div>
                      )}
                      {selectedOrder?.completedAt && (
                        <div className="flex justify-between text-sm">
                          <span>{t("order.completed")}</span>
                          <span>{formatDate(selectedOrder.completedAt)}</span>
                        </div>
                      )}
                      {selectedOrder?.cancelledAt && (
                        <div className="flex justify-between text-sm">
                          <span>{t("order.cancelled")}</span>
                          <span>{formatDate(selectedOrder.cancelledAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 取消订单对话框 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("admin.cancelOrder")}</DialogTitle>
            <DialogDescription>
              {t("admin.cancelOrderDesc")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="cancelReason" className="text-sm font-medium">
                {t("admin.cancelReason")}
              </label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t("admin.cancelReasonPlaceholder")}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
            >
              {t("admin.confirmCancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 用户详情对话框 */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.customerDetails")}</DialogTitle>
            <DialogDescription>
              {t("admin.customerDetailsDesc")}
            </DialogDescription>
          </DialogHeader>
          
          {loadingUserData ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : selectedUserData ? (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-4">
                  <User className="h-10 w-10 text-gray-400 mr-3" />
                  <div>
                    <h3 className="font-medium">{selectedUserData.firstName} {selectedUserData.lastName}</h3>
                    <p className="text-sm text-gray-500">{t("admin.userId")}: {selectedUserData.id}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("admin.email")}:</span>
                    <span>{selectedUserData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("admin.role")}:</span>
                    <span>{selectedUserData.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("admin.status")}:</span>
                    <span>{selectedUserData.status}</span>
                  </div>
                  {selectedUserData.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("admin.phone")}:</span>
                      <span>{selectedUserData.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("admin.language")}:</span>
                    <span>{selectedUserData.language === "zh" ? t("admin.languageChinese") : t("admin.languageEnglish")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("admin.createdAt")}:</span>
                    <span>{formatDate(selectedUserData.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">{t("admin.orders")}</h3>
                <div className="space-y-2">
                  {userOrders.length > 0 ? (
                    userOrders.map(order => (
                      <div key={order.id} className="flex justify-between">
                        <span>订单 # {order.id}</span>
                        <span>¥{formatPrice(order.totalAmount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t("admin.noOrders")}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">{t("admin.favorites")}</h3>
                <div className="space-y-2">
                  {userFavorites.length > 0 ? (
                    userFavorites.map(favorite => (
                      <div key={favorite.id} className="flex justify-between">
                        <span>{favorite.title}</span>
                        <span>¥{formatPrice(favorite.price)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">{t("admin.noFavorites")}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                  {t("common.close")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("admin.userNotFound")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminOrdersPage;