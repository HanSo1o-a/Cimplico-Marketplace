import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Search, 
  Download, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Store,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

// 用户消费统计类型
interface UserSpendingStat {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
}

// 供应商销售统计类型
interface VendorSalesStat {
  vendorId: number;
  companyName: string;
  totalSales: number;
  productCount: number;
  orderCount: number;
  lastSaleDate: string;
}

// 订单记录类型
interface OrderRecord {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
  items: {
    id: number;
    listingId: number;
    listingTitle: string;
    vendorId: number;
    vendorName: string;
    unitPrice: number;
    quantity: number;
  }[];
}

const AdminStatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<string>("totalSpent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

  // 获取用户消费统计
  const { data: userStats = [], isLoading: isLoadingUserStats } = useQuery<UserSpendingStat[]>({
    queryKey: ["admin", "statistics", "users", timeRange],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          "GET", 
          `/api/admin/statistics/users?timeRange=${timeRange}`
        );
        return response || [];
      } catch (error) {
        console.error("获取用户消费统计失败:", error);
        toast({
          title: t("common.error"),
          description: t("admin.statistics.fetchUserStatsFailed"),
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // 获取供应商销售统计
  const { data: vendorStats = [], isLoading: isLoadingVendorStats } = useQuery<VendorSalesStat[]>({
    queryKey: ["admin", "statistics", "vendors", timeRange],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          "GET", 
          `/api/admin/statistics/vendors?timeRange=${timeRange}`
        );
        return response || [];
      } catch (error) {
        console.error("获取供应商销售统计失败:", error);
        toast({
          title: t("common.error"),
          description: t("admin.statistics.fetchVendorStatsFailed"),
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // 获取订单记录
  const { data: orderRecords = [], isLoading: isLoadingOrderRecords } = useQuery<OrderRecord[]>({
    queryKey: ["admin", "statistics", "orders", timeRange],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          "GET", 
          `/api/admin/statistics/orders?timeRange=${timeRange}`
        );
        return response || [];
      } catch (error) {
        console.error("获取订单记录失败:", error);
        toast({
          title: t("common.error"),
          description: t("admin.statistics.fetchOrdersFailed"),
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // 计算总计
  const totalUserSpending = userStats.reduce((sum, user) => sum + user.totalSpent, 0);
  const totalVendorSales = vendorStats.reduce((sum, vendor) => sum + vendor.totalSales, 0);
  const totalOrders = orderRecords.length;

  // 过滤和排序用户统计
  const filteredUserStats = userStats.filter(user => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const email = user.email || '';
    
    return firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedUserStats = [...filteredUserStats].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "name":
        const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim();
        const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
        comparison = aName.localeCompare(bName);
        break;
      case "email":
        const aEmail = a.email || '';
        const bEmail = b.email || '';
        comparison = aEmail.localeCompare(bEmail);
        break;
      case "totalSpent":
        const aTotalSpent = a.totalSpent || 0;
        const bTotalSpent = b.totalSpent || 0;
        comparison = aTotalSpent - bTotalSpent;
        break;
      case "orderCount":
        const aOrderCount = a.orderCount || 0;
        const bOrderCount = b.orderCount || 0;
        comparison = aOrderCount - bOrderCount;
        break;
      case "lastOrderDate":
        const aDate = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const bDate = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        comparison = aDate - bDate;
        break;
      default:
        comparison = (a.totalSpent || 0) - (b.totalSpent || 0);
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // 过滤和排序供应商统计
  const filteredVendorStats = vendorStats.filter(vendor => {
    const companyName = vendor.companyName || '';
    return companyName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedVendorStats = [...filteredVendorStats].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "name":
        const aName = a.companyName || '';
        const bName = b.companyName || '';
        comparison = aName.localeCompare(bName);
        break;
      case "totalSales":
        const aTotalSales = a.totalSales || 0;
        const bTotalSales = b.totalSales || 0;
        comparison = aTotalSales - bTotalSales;
        break;
      case "productCount":
        const aProductCount = a.productCount || 0;
        const bProductCount = b.productCount || 0;
        comparison = aProductCount - bProductCount;
        break;
      case "orderCount":
        const aOrderCount = a.orderCount || 0;
        const bOrderCount = b.orderCount || 0;
        comparison = aOrderCount - bOrderCount;
        break;
      case "lastSaleDate":
        const aDate = a.lastSaleDate ? new Date(a.lastSaleDate).getTime() : 0;
        const bDate = b.lastSaleDate ? new Date(b.lastSaleDate).getTime() : 0;
        comparison = aDate - bDate;
        break;
      default:
        comparison = (a.totalSales || 0) - (b.totalSales || 0);
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // 过滤订单记录
  const filteredOrderRecords = orderRecords.filter(order => {
    const userName = order.userName || '';
    const userEmail = order.userEmail || '';
    
    // 检查用户名和邮箱
    const userMatch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 检查订单项
    const itemsMatch = order.items && order.items.some(item => {
      const listingTitle = item.listingTitle || '';
      const vendorName = item.vendorName || '';
      
      return listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
             vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    return userMatch || itemsMatch;
  });

  // 切换排序方向
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
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

  // 渲染排序图标
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" /> 
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // 渲染状态徽章
  const renderStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-100 text-blue-800">处理中</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">待处理</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 渲染支付状态徽章
  const renderPaymentStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">已支付</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">待支付</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">支付失败</Badge>;
      case "REFUNDED":
        return <Badge className="bg-purple-100 text-purple-800">已退款</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t("admin.statistics")}</h1>
      
      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              {t("admin.statistics.userSpending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatPrice(totalUserSpending)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {userStats.length} {t("admin.statistics.activeUsers")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Store className="mr-2 h-5 w-5 text-primary" />
              {t("admin.statistics.vendorSales")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatPrice(totalVendorSales)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {vendorStats.length} {t("admin.statistics.activeVendors")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
              {t("admin.statistics.totalOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {totalOrders}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("admin.statistics.processedOrders")}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 时间范围和搜索筛选 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t("admin.statistics.selectTimeRange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.statistics.allTime")}</SelectItem>
              <SelectItem value="today">{t("admin.statistics.today")}</SelectItem>
              <SelectItem value="week">{t("admin.statistics.thisWeek")}</SelectItem>
              <SelectItem value="month">{t("admin.statistics.thisMonth")}</SelectItem>
              <SelectItem value="year">{t("admin.statistics.thisYear")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="ml-2">
            <Download className="mr-2 h-4 w-4" />
            {t("admin.statistics.exportData")}
          </Button>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("admin.statistics.search")}
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* 统计数据标签页 */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {t("admin.statistics.userSpending")}
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center">
            <Store className="mr-2 h-4 w-4" />
            {t("admin.statistics.vendorSales")}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center">
            <ShoppingBag className="mr-2 h-4 w-4" />
            {t("admin.statistics.orderRecords")}
          </TabsTrigger>
        </TabsList>
        
        {/* 用户消费标签页 */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.statistics.userSpendingDetails")}</CardTitle>
              <CardDescription>
                {t("admin.statistics.userSpendingDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserStats ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sortedUserStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => toggleSort("name")} className="cursor-pointer">
                        <div className="flex items-center">
                          {t("admin.statistics.userName")}
                          {renderSortIcon("name")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("email")} className="cursor-pointer">
                        <div className="flex items-center">
                          {t("admin.statistics.userEmail")}
                          {renderSortIcon("email")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("totalSpent")} className="cursor-pointer text-right">
                        <div className="flex items-center justify-end">
                          {t("admin.statistics.totalSpent")}
                          {renderSortIcon("totalSpent")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("orderCount")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center">
                          {t("admin.statistics.orderCount")}
                          {renderSortIcon("orderCount")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("lastOrderDate")} className="cursor-pointer">
                        <div className="flex items-center">
                          {t("admin.statistics.lastOrderDate")}
                          {renderSortIcon("lastOrderDate")}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUserStats.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(user.totalSpent)}
                        </TableCell>
                        <TableCell className="text-center">{user.orderCount}</TableCell>
                        <TableCell>{formatDate(user.lastOrderDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm 
                    ? t("admin.statistics.noMatchingUsers") 
                    : t("admin.statistics.noUserData")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 供应商销售标签页 */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.statistics.vendorSalesDetails")}</CardTitle>
              <CardDescription>
                {t("admin.statistics.vendorSalesDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVendorStats ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sortedVendorStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => toggleSort("name")} className="cursor-pointer">
                        <div className="flex items-center">
                          {t("admin.statistics.vendorName")}
                          {renderSortIcon("name")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("totalSales")} className="cursor-pointer text-right">
                        <div className="flex items-center justify-end">
                          {t("admin.statistics.totalSales")}
                          {renderSortIcon("totalSales")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("productCount")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center">
                          {t("admin.statistics.productCount")}
                          {renderSortIcon("productCount")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("orderCount")} className="cursor-pointer text-center">
                        <div className="flex items-center justify-center">
                          {t("admin.statistics.orderCount")}
                          {renderSortIcon("orderCount")}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => toggleSort("lastSaleDate")} className="cursor-pointer">
                        <div className="flex items-center">
                          {t("admin.statistics.lastSaleDate")}
                          {renderSortIcon("lastSaleDate")}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedVendorStats.map((vendor) => (
                      <TableRow key={vendor.vendorId}>
                        <TableCell>{vendor.companyName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(vendor.totalSales)}
                        </TableCell>
                        <TableCell className="text-center">{vendor.productCount}</TableCell>
                        <TableCell className="text-center">{vendor.orderCount}</TableCell>
                        <TableCell>{formatDate(vendor.lastSaleDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm 
                    ? t("admin.statistics.noMatchingVendors") 
                    : t("admin.statistics.noVendorData")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 订单记录标签页 */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.statistics.orderRecordsDetails")}</CardTitle>
              <CardDescription>
                {t("admin.statistics.orderRecordsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrderRecords ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredOrderRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">{t("admin.statistics.orderId")}</TableHead>
                      <TableHead>{t("admin.statistics.userName")}</TableHead>
                      <TableHead>{t("admin.statistics.orderDate")}</TableHead>
                      <TableHead className="text-right">{t("admin.statistics.totalAmount")}</TableHead>
                      <TableHead className="text-center">{t("admin.statistics.status")}</TableHead>
                      <TableHead className="text-center">{t("admin.statistics.paymentStatus")}</TableHead>
                      <TableHead className="text-center">{t("admin.statistics.details")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrderRecords.map((order) => (
                      <React.Fragment key={order.id}>
                        <TableRow>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            <div>{order.userName}</div>
                            <div className="text-sm text-muted-foreground">{order.userEmail}</div>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(order.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderPaymentStatusBadge(order.paymentStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleOrderExpand(order.id)}
                            >
                              {expandedOrders.includes(order.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {/* 展开的订单详情 */}
                        {expandedOrders.includes(order.id) && (
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={7} className="p-0">
                              <div className="p-4">
                                <h4 className="font-medium mb-2">{t("admin.statistics.orderItems")}</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>{t("admin.statistics.product")}</TableHead>
                                      <TableHead>{t("admin.statistics.vendor")}</TableHead>
                                      <TableHead className="text-right">{t("admin.statistics.unitPrice")}</TableHead>
                                      <TableHead className="text-center">{t("admin.statistics.quantity")}</TableHead>
                                      <TableHead className="text-right">{t("admin.statistics.subtotal")}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {order.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.listingTitle}</TableCell>
                                        <TableCell>{item.vendorName}</TableCell>
                                        <TableCell className="text-right">
                                          {formatPrice(item.unitPrice)}
                                        </TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">
                                          {formatPrice(item.unitPrice * item.quantity)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm 
                    ? t("admin.statistics.noMatchingOrders") 
                    : t("admin.statistics.noOrderData")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStatisticsPage;
