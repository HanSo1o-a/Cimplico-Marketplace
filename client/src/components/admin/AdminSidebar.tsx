import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Package, Store, ShoppingCart } from "lucide-react";

interface AdminSidebarProps {
  active: "products" | "vendors" | "orders";
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ active }) => {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const { user } = useAuth();

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const menuItems = [
    {
      id: "products",
      label: t("admin.productManagement"),
      icon: <Package className="mr-2 h-5 w-5" />,
      onClick: () => navigate("/admin/products"),
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

  return (
    <div className="w-64 min-h-screen border-r border-gray-200 p-4">
      <h2 className="text-2xl font-bold mb-6">{t("admin.dashboard")}</h2>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              "flex items-center w-full px-3 py-3 text-left rounded-md transition-colors",
              active === item.id
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;