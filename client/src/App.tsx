import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Auth0Provider } from "@/hooks/use-auth0";
import { ProtectedRoute } from "@/lib/protected-route";
import { UserRole } from "@shared/schema";
import { useEffect } from "react";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Marketplace from "@/pages/marketplace";
import ProductDetail from "@/pages/product-detail";
import UserProfile from "@/pages/user-profile";
import VendorDashboard from "@/pages/vendor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminVendorsPage from "@/pages/admin/AdminVendorsPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminStatisticsPage from "@/pages/admin/AdminStatisticsPage";
import AdminCommentsPage from "@/pages/admin/AdminCommentsPage";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderDetail from "@/pages/order-detail";
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminProductEditPage from "@/pages/admin/AdminProductEditPage";

// 用户路由
function UserRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/product/:id" component={ProductDetail} />
      <ProtectedRoute path="/profile" component={UserProfile} />
      <ProtectedRoute path="/vendor-dashboard" role={UserRole.VENDOR} component={VendorDashboard} />
      <ProtectedRoute path="/cart" component={Cart} />
      <ProtectedRoute path="/checkout" component={Checkout} />
      <ProtectedRoute path="/orders/:id" component={OrderDetail} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

// 管理员路由
function AdminRouter() {
  // 为每个管理页面添加AdminLayout包装
  const renderWithAdminLayout = (Component: React.ComponentType) => () => (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
  
  return (
    <Switch>
      <Route path="/admin" component={renderWithAdminLayout(AdminHomePage)} />
      <Route path="/admin/products" component={renderWithAdminLayout(AdminProductsPage)} />
      <Route path="/admin/products/edit/:id" component={renderWithAdminLayout(AdminProductEditPage)} />
      <Route path="/admin/categories" component={renderWithAdminLayout(AdminCategoriesPage)} />
      <Route path="/admin/vendors" component={renderWithAdminLayout(AdminVendorsPage)} />
      <Route path="/admin/orders" component={renderWithAdminLayout(AdminOrdersPage)} />
      <Route path="/admin/users" component={renderWithAdminLayout(AdminUsersPage)} />
      <Route path="/admin/comments" component={renderWithAdminLayout(AdminCommentsPage)} />
      <Route path="/admin/statistics" component={renderWithAdminLayout(AdminStatisticsPage)} />
      <Route path="/admin-dashboard" component={renderWithAdminLayout(AdminDashboard)} />
      <Route path="/auth" component={AuthPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

// 路由器选择组件
function RouterSelector() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // 移除管理员自动重定向逻辑
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  // 根据用户角色选择不同的路由和布局
  if (user && user.role === UserRole.ADMIN && window.location.pathname.startsWith('/admin')) {
    return <AdminRouter />;
  }

  return (
    <MainLayout>
      <UserRouter />
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Auth0Provider>
          <RouterSelector />
          <Toaster />
        </Auth0Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
