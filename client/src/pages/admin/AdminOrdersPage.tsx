import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { UserRole, OrderStatus, Order } from "@shared/schema";
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
import { CheckCircle, Clock, Package, RefreshCcw, ShieldOff } from "lucide-react";

const AdminOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // 使用 react-query 获取所有订单列表
  const { data: orders = [], refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders/all"],
    queryFn: getQueryFn({ 
      on401: "throw",
      fallbackData: [] 
    }),
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  // 订单操作
  const handleShip = async (orderId: number) => {
    try {
      await apiRequest("POST", `/api/orders/${orderId}/ship`, {});
      toast({
        title: t("admin.orderShipped"),
        description: t("admin.orderShippedDesc"),
      });
      refetch();
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
      await apiRequest("POST", `/api/orders/${orderId}/complete`, {});
      toast({
        title: t("admin.orderCompleted"),
        description: t("admin.orderCompletedDesc"),
      });
      refetch();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.completeError"),
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (orderId: number, reason: string) => {
    try {
      await apiRequest("POST", `/api/orders/${orderId}/cancel`, { reason });
      toast({
        title: t("admin.orderCancelled"),
        description: t("admin.orderCancelledDesc"),
      });
      refetch();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.cancelError"),
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case OrderStatus.CREATED:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" /> {t("order.status.CREATED")}</Badge>;
      case OrderStatus.PAID:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" /> {t("order.status.PAID")}</Badge>;
      case OrderStatus.SHIPPED:
        return <Badge variant="outline" className="bg-purple-100 text-purple-800"><Package className="mr-1 h-3 w-3" /> {t("order.status.SHIPPED")}</Badge>;
      case OrderStatus.COMPLETED:
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" /> {t("order.status.COMPLETED")}</Badge>;
      case OrderStatus.CANCELLED:
        return <Badge variant="outline" className="bg-red-100 text-red-800"><ShieldOff className="mr-1 h-3 w-3" /> {t("order.status.CANCELLED")}</Badge>;
      case OrderStatus.REFUNDED:
        return <Badge variant="outline" className="bg-orange-100 text-orange-800"><RefreshCcw className="mr-1 h-3 w-3" /> {t("order.status.REFUNDED")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">{t("admin.orderManagement")}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.allOrders")}</CardTitle>
          <CardDescription>
            {t("admin.allOrdersDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">
                            {t("order.id")}: {order.id}
                          </h3>
                          {renderStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {t("order.date")}: {order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss') : ''}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t("order.customer")}: {order.userId ? `ID: ${order.userId}` : ''}
                        </p>
                        <p className="font-medium mt-2">
                          {t("order.total")}: ¥{order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            {t("common.view")}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {order.status === OrderStatus.PAID && (
                          <Button
                            size="sm"
                            onClick={() => handleShip(order.id)}
                          >
                            {t("admin.shipOrder")}
                          </Button>
                        )}
                        {order.status === OrderStatus.SHIPPED && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(order.id)}
                          >
                            {t("admin.completeOrder")}
                          </Button>
                        )}
                        {(order.status === OrderStatus.CREATED || order.status === OrderStatus.PAID) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const reason = prompt(t("admin.cancelReason"));
                              if (reason) {
                                handleCancel(order.id, reason);
                              }
                            }}
                          >
                            {t("admin.cancelOrder")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>{t("admin.noOrders")}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AdminOrdersPage;