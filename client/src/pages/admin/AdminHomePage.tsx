import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Package, 
  Store, 
  ShoppingCart, 
  Users, 
  BarChart4, 
  AlertCircle, 
  FileText 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

const AdminHomePage: React.FC = () => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();

  // 获取统计数据
  const { data: stats = { orderCount: 0, revenue: 0, reportCount: 0 } } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn({ 
      on401: "throw",
      fallbackData: { orderCount: 0, revenue: 0, reportCount: 0 } 
    }),
  });

  // 获取待审核数据
  const { data: pendingVendors = [] } = useQuery({
    queryKey: ["/api/admin/pending-vendors"],
    queryFn: getQueryFn({ 
      on401: "throw",
      fallbackData: [] 
    }),
  });

  const { data: pendingListings = [] } = useQuery({
    queryKey: ["/api/admin/pending-listings"],
    queryFn: getQueryFn({ 
      on401: "throw",
      fallbackData: [] 
    }),
  });

  const dashboardItems = [
    {
      title: t("admin.productManagement"),
      description: t("admin.approveProducts"),
      icon: <Package className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/products"),
      count: pendingListings?.length || 0,
      countLabel: t("admin.pendingApproval"),
    },
    {
      title: t("admin.vendorManagement"),
      description: t("admin.approveVendors"),
      icon: <Store className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/vendors"),
      count: pendingVendors?.length || 0,
      countLabel: t("admin.pendingApproval"),
    },
    {
      title: t("admin.orderManagement"),
      description: t("admin.viewSales"),
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/orders"),
      count: stats?.orderCount || 0,
      countLabel: t("admin.totalOrders"),
    },
    {
      title: t("admin.statistics"),
      description: t("admin.platformData"),
      icon: <BarChart4 className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/statistics"),
      count: stats?.revenue || 0,
      countLabel: t("admin.totalRevenue"),
      prefix: "$",
    },
    {
      title: t("admin.reportManagement"),
      description: t("admin.handleReports"),
      icon: <AlertCircle className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/reports"),
      count: stats?.reportCount || 0,
      countLabel: t("admin.pendingReports"),
    },
    {
      title: t("admin.apiDocumentation"),
      description: t("admin.manageApiDocs"),
      icon: <FileText className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/api-docs"),
    },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">{t("admin.dashboard")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={item.onClick}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{item.title}</CardTitle>
                {item.icon}
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {item.count !== undefined && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{item.countLabel}</p>
                  <p className="text-2xl font-bold text-primary">
                    {item.prefix || ''}{item.count}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default AdminHomePage;