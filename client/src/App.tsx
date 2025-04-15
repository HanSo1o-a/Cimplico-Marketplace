import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { Auth0Provider } from "@/hooks/use-auth0";
import { ProtectedRoute } from "@/lib/protected-route";
import { UserRole } from "@shared/schema";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Marketplace from "@/pages/marketplace";
import ProductDetail from "@/pages/product-detail";
import UserProfile from "@/pages/user-profile";
import VendorDashboard from "@/pages/vendor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderDetail from "@/pages/order-detail";
import MainLayout from "@/components/layout/MainLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/product/:id" component={ProductDetail} />
      <ProtectedRoute path="/profile" component={UserProfile} />
      <ProtectedRoute path="/vendor-dashboard" role={UserRole.VENDOR} component={VendorDashboard} />
      <ProtectedRoute path="/admin-dashboard" role={UserRole.ADMIN} component={AdminDashboard} />
      <ProtectedRoute path="/cart" component={Cart} />
      <ProtectedRoute path="/checkout" component={Checkout} />
      <ProtectedRoute path="/orders/:id" component={OrderDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Auth0Provider>
          <MainLayout>
            <Router />
          </MainLayout>
          <Toaster />
        </Auth0Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
