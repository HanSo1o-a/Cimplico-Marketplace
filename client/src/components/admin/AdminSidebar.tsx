import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Package, Store, ShoppingCart, LayoutDashboard, LogOut, Users, Tag } from "lucide-react";

interface AdminSidebarProps {
  active?: "dashboard" | "products" | "categories" | "vendors" | "orders" | "users";
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ active }) => {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // 根据当前URL路径自动确定活动项
  const currentPath = location;
  const currentActive = active || 
    (currentPath.includes('/admin/products') ? 'products' : 
     currentPath.includes('/admin/categories') ? 'categories' : 
     currentPath.includes('/admin/vendors') ? 'vendors' : 
     currentPath.includes('/admin/orders') ? 'orders' : 
     currentPath.includes('/admin/users') ? 'users' : 'dashboard');

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const menuItems = [
    {
      id: "dashboard",
      label: t("admin.dashboard"),
      icon: <LayoutDashboard className="mr-2 h-5 w-5" />,
      onClick: () => navigate("/admin"),
    },
    {
      id: "users",
      label: t("admin.userManagement"),
      icon: <Users className="mr-2 h-5 w-5" />,
      onClick: () => navigate("/admin/users"),
    },
    {
      id: "products",
      label: t("admin.productManagement"),
      icon: <Package className="mr-2 h-5 w-5" />,
      onClick: () => navigate("/admin/products"),
    },
    {
      id: "categories",
      label: t("admin.categoryManagement"),
      icon: <Tag className="mr-2 h-5 w-5" />,
      onClick: () => navigate("/admin/categories"),
    },
    {
      id: "vendors",
      label: t("admin.vendorManagement"),
      icon: <Store className="mr-2 h-5 w-5" />,
      onClick: () => navigate("/admin/vendors"),
    },
    {
      id: "orders",
      label: t("admin.orderManagement"),
      icon: <ShoppingCart className="mr-2 h-5 w-5" />,
      onClick: () => navigate("/admin/orders"),
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/auth');
  };

  return (
    <div className="fixed left-0 top-0 w-64 min-h-screen border-r border-gray-200 p-4 bg-white">
      <h2 className="text-2xl font-bold mb-6">{t("admin.dashboard")}</h2>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "flex items-center w-full px-3 py-3 text-left rounded-md transition-colors",
              currentActive === item.id
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
        
        <div className="pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-3 text-left rounded-md text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-2 h-5 w-5" />
            {t("auth.logout")}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;