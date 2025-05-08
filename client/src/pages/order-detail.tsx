import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import { ChevronLeft, Download, ShoppingBag, CheckCircle, Clock, Package, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { OrderStatus } from "@shared/schema";

const OrderDetail = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const [_, navigate] = useLocation();
  
  const { data: order, isLoading, error } = useQuery({
    queryKey: [`/api/orders/${id}`],
    queryFn: getQueryFn(),
    enabled: !!id && !!user
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "错误",
        description: "订单未找到",
        variant: "destructive"
      });
      navigate("/profile");
    }
  }, [error, navigate, toast]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 py-12">
        <div className="w-full h-64 flex flex-col items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-neutral-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-4xl mx-auto p-6 py-12">
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">订单未找到</h3>
          <p className="text-neutral-500 mb-4">请稍后再试</p>
          <Button onClick={() => navigate("/profile")}>
            返回个人中心
          </Button>
        </div>
      </div>
    );
  }

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return <CheckCircle className="h-10 w-10 text-green-500" />;
      case OrderStatus.PAID:
        return <Clock className="h-10 w-10 text-blue-500" />;
      case OrderStatus.SHIPPED:
        return <Package className="h-10 w-10 text-orange-500" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-10 w-10 text-red-500" />;
      default:
        return <Clock className="h-10 w-10 text-yellow-500" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="outline" 
          className="flex items-center space-x-2" 
          onClick={() => navigate("/profile")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>返回</span>
        </Button>
        
        <div className="text-right">
          <h1 className="text-2xl font-bold">订单详情</h1>
          <p className="text-neutral-500">订单号: #{order.id}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">订单日期</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{formatDate(order.createdAt)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">订单状态</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center space-x-3">
            {renderStatusIcon(order.status)}
            <div>
              <p className="font-medium">
                {order.status === "PAID" && "已支付"}
                {order.status === "COMPLETED" && "已完成"}
                {order.status === "CANCELLED" && "已取消"}
                {order.status === "CREATED" && "已下单"}
                {order.status === "SHIPPED" && "已发货"}
                {order.status === "REFUNDED" && "已退款"}
              </p>
              {order.status === OrderStatus.PAID && (
                <p className="text-sm text-neutral-500">订单已支付，等待处理</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">订单总额</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">¥{order.totalAmount.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>订单项目</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items && order.items.map((item) => (
            <div key={item.id} className="py-4 border-b border-neutral-100 last:border-0">
              <div className="flex items-start">
                {item.listing?.images && item.listing.images.length > 0 && (
                  <div className="h-16 w-16 rounded overflow-hidden mr-4 flex-shrink-0">
                    <img 
                      src={item.listing.images[0] as string} 
                      alt={item.listing.title} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{item.listing?.title}</h3>
                    <p className="font-medium">¥{item.unitPrice?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-500 mt-1">
                    <p>数量: {item.quantity}</p>
                    <p>类型: {item.listing?.type === "DIGITAL" ? "数字产品" : "实体产品"}</p>
                  </div>
                  {(order.status === OrderStatus.SHIPPED || order.status === OrderStatus.COMPLETED) && 
                   item.listing?.downloadUrl && (
                    <div className="mt-3">
                      <a 
                        href={item.listing.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        下载
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4">
            <div className="flex justify-between py-2">
              <span>小计</span>
              <span>¥{order.totalAmount.toFixed(2)}</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between py-2 font-bold">
              <span>总计</span>
              <span>¥{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/profile")}>
          返回个人中心
        </Button>
      </div>
    </div>
  );
};

export default OrderDetail;