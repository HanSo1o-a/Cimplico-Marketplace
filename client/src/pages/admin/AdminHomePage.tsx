import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Store, ShoppingCart, Users } from "lucide-react";

const AdminHomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // 检查是否是管理员
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const dashboardItems = [
    {
      title: t("admin.productManagement"),
      description: t("admin.productManagementDesc"),
      icon: <Package className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/products"),
    },
    {
      title: t("admin.vendorManagement"),
      description: t("admin.vendorManagementDesc"),
      icon: <Store className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/vendors"),
    },
    {
      title: t("admin.orderManagement"),
      description: t("admin.orderManagementDesc"),
      icon: <ShoppingCart className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/orders"),
    },
    {
      title: t("admin.userManagement"),
      description: t("admin.userManagementDesc"),
      icon: <Users className="h-8 w-8 text-primary" />,
      onClick: () => navigate("/admin/users"),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active="dashboard" />
      
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">{t("admin.dashboard")}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {/* 将来可以在这里添加统计数据等 */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;