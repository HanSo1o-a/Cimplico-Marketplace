import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@shared/schema";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // 如果不是管理员，重定向到首页
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{t("adminDashboard.title")}</h1>
      
      <Tabs defaultValue="vendors">
        <TabsList className="mb-4">
          <TabsTrigger value="vendors">{t("adminDashboard.tabs.vendors")}</TabsTrigger>
          <TabsTrigger value="listings">{t("adminDashboard.tabs.listings")}</TabsTrigger>
          <TabsTrigger value="users">{t("adminDashboard.tabs.users")}</TabsTrigger>
          <TabsTrigger value="orders">{t("adminDashboard.tabs.orders")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminDashboard.pendingVendors.title")}</CardTitle>
              <CardDescription>{t("adminDashboard.pendingVendors.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>{t("adminDashboard.pendingVendors.noVendors")}</p>
                {/* 这里将来会展示待审核的供应商列表 */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminDashboard.pendingListings.title")}</CardTitle>
              <CardDescription>{t("adminDashboard.pendingListings.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>{t("adminDashboard.pendingListings.noListings")}</p>
                {/* 这里将来会展示待审核的商品列表 */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminDashboard.users.title")}</CardTitle>
              <CardDescription>{t("adminDashboard.users.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>{t("adminDashboard.users.noUsers")}</p>
                {/* 这里将来会展示用户列表 */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminDashboard.orders.title")}</CardTitle>
              <CardDescription>{t("adminDashboard.orders.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>{t("adminDashboard.orders.noOrders")}</p>
                {/* 这里将来会展示订单列表 */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;