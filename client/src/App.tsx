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
import AdminVendorsPage from "@/pages/admin/AdminVendorsPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderDetail from "@/pages/order-detail";
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/layout/AdminLayout";

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
  const renderAdminHomePage = () => <AdminHomePage />;
  const renderAdminProductsPage = () => <AdminProductsPage />;
  const renderAdminVendorsPage = () => <AdminVendorsPage />;
  const renderAdminOrdersPage = () => <AdminOrdersPage />;
  const renderAdminUsersPage = () => <AdminUsersPage />;
  const renderAdminDashboard = () => <AdminDashboard />;
  
  return (
    <Switch>
      <Route path="/admin" component={renderAdminHomePage} />
      <Route path="/admin/products" component={renderAdminProductsPage} />
      <Route path="/admin/vendors" component={renderAdminVendorsPage} />
      <Route path="/admin/orders" component={renderAdminOrdersPage} />
      <Route path="/admin/users" component={renderAdminUsersPage} />
      <Route path="/admin-dashboard" component={renderAdminDashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

// 路由器选择组件
function RouterSelector() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // 如果用户是管理员并且不在管理员路径，则自动重定向到管理员主页
  useEffect(() => {
    if (!isLoading && user && user.role === UserRole.ADMIN) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/admin')) {
        setLocation('/admin');
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  // 根据用户角色选择不同的路由和布局
  if (user && user.role === UserRole.ADMIN) {
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
