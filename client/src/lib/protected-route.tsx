import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Redirect, Route } from "wouter";
import { UserRole } from "@shared/schema";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
  role?: UserRole | UserRole[];
};

export function ProtectedRoute({
  path,
  component: Component,
  role
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">{t("common.loading")}</span>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // 如果指定了角色要求，检查用户角色
  if (role) {
    const requiredRoles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = requiredRoles.includes(user.role as UserRole) || user.role === UserRole.ADMIN;
    
    if (!hasRequiredRole) {
      return (
        <Route path={path}>
          <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-2xl font-bold text-red-600 mb-2">{t("auth.accessDenied")}</h1>
            <p className="mb-4">{t("auth.noPermission")}</p>
            <a href="/" className="text-primary hover:underline">
              {t("common.backToHome")}
            </a>
          </div>
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
