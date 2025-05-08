import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  VendorProfile 
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type AuthContextType = {
  user: User | null;
  vendorProfile: VendorProfile | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterCredentials>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // 如果用户是供应商，获取供应商资料
  const { data: vendorProfile } = useQuery<VendorProfile | undefined, Error>({
    queryKey: ["/api/user/vendor-profile"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && user.role === "VENDOR", // 仅当用户是供应商时启用
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return await apiRequest("POST", "/api/login", credentials);
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.welcomeBack"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.loginFailed"),
        description: error.message || t("auth.invalidCredentials"),
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const { confirmPassword, ...userData } = credentials;
      return await apiRequest("POST", "/api/register", userData);
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: t("auth.registerSuccess"),
        description: t("auth.accountCreated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.registerFailed"),
        description: error.message || t("auth.registerError"),
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: t("auth.logoutSuccess"),
        description: t("auth.loggedOut"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.logoutFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        vendorProfile: vendorProfile ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
