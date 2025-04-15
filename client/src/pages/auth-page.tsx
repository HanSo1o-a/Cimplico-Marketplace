import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserRole } from "@shared/schema";
import VendorForm from "@/components/vendor/VendorForm";

const AuthPage = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");
  const vendorParam = params.get("vendor");
  
  const [activeTab, setActiveTab] = useState<string>(tabParam === "register" ? "register" : "login");
  const [showVendorForm, setShowVendorForm] = useState<boolean>(!!vendorParam);
  
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      // 根据用户角色进行不同的重定向
      if (user.role === UserRole.ADMIN) {
        navigate("/admin"); // 管理员直接进入管理页面
      } else if (user.role === UserRole.VENDOR) {
        navigate("/vendor-dashboard"); // 供应商进入供应商控制台
      } else {
        navigate("/"); // 普通用户进入主页
      }
    }
  }, [user, navigate]);

  // Login form validation schema
  const loginSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

  // Register form validation schema
  const registerSchema = z.object({
    firstName: z.string().min(1, t("auth.firstNameRequired")),
    lastName: z.string().min(1, t("auth.lastNameRequired")),
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordMinLength")),
    confirmPassword: z.string().min(1, t("auth.passwordRequired")),
    role: z.enum([UserRole.USER, UserRole.VENDOR]).default(UserRole.USER),
    language: z.string().default("zh"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.passwordMismatch"),
    path: ["confirmPassword"],
  });

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: showVendorForm ? UserRole.VENDOR : UserRole.USER,
      language: "zh", // Default to Chinese
    },
  });

  // Update role when showVendorForm changes
  useEffect(() => {
    registerForm.setValue("role", showVendorForm ? UserRole.VENDOR : UserRole.USER);
  }, [showVendorForm, registerForm]);

  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values, {
      onSuccess: (user) => {
        // 根据用户角色进行不同的重定向
        if (user.role === UserRole.ADMIN) {
          navigate("/admin"); // 管理员直接进入管理页面
        } else if (user.role === UserRole.VENDOR) {
          navigate("/vendor-dashboard"); // 供应商进入供应商控制台
        } else {
          navigate("/"); // 普通用户进入主页
        }
      }
    });
  };

  // Handle register submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        if (values.role === UserRole.VENDOR) {
          navigate("/vendor-dashboard");
        } else {
          navigate("/");
        }
      }
    });
  };

  // Toggle between vendor and user registration
  const toggleVendorForm = () => {
    setShowVendorForm(!showVendorForm);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Cimplico <span className="text-primary-600">Marketplace</span>
        </h1>
      </div>

      <div className="flex flex-col md:flex-row container max-w-5xl mx-auto px-4 gap-8">
        {/* Form Section */}
        <div className="md:w-1/2 bg-white rounded-lg shadow-lg overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 rounded-none">
              <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login" className="p-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.email")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" autoComplete="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.password")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="current-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between">
                    <a href="#" className="text-sm text-primary hover:underline font-medium">
                      {t("auth.forgotPassword")}
                    </a>
                    <div className="text-sm">
                      {t("auth.noAccount")}{" "}
                      <button type="button" onClick={() => setActiveTab("register")} className="text-primary hover:underline font-medium">
                        {t("auth.register")}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? t("common.loading") : t("auth.login")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register" className="p-6">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t("auth.firstName")}</FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="given-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>{t("auth.lastName")}</FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="family-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.email")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" autoComplete="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.password")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="new-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="new-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center">
                    <Button 
                      type="button" 
                      variant={showVendorForm ? "default" : "outline"}
                      className="w-full mr-2"
                      onClick={toggleVendorForm}
                    >
                      {t("user.profile")}
                    </Button>
                    <Button 
                      type="button" 
                      variant={showVendorForm ? "outline" : "default"}
                      className="w-full ml-2"
                      onClick={toggleVendorForm}
                    >
                      {t("vendor.profile")}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-center">
                    {t("auth.alreadyRegistered")}{" "}
                    <button type="button" onClick={() => setActiveTab("login")} className="text-primary hover:underline font-medium">
                      {t("auth.login")}
                    </button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? t("common.loading") : t("auth.register")}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Information Section */}
        <div className="md:w-1/2 p-6 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg shadow-lg flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">
            {showVendorForm 
              ? t("vendor.becomeVendor") 
              : t("home.hero.title")}
          </h2>
          
          {showVendorForm ? (
            <div>
              <p className="mb-6">{t("home.becomeVendor.description")}</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("home.becomeVendor.benefit1")}
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("home.becomeVendor.benefit2")}
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("home.becomeVendor.benefit3")}
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("home.becomeVendor.benefit4")}
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <p className="mb-6">{t("home.hero.subtitle")}</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{t("categories.financial")}</h3>
                  <p className="text-sm">高质量的财务报表模板，帮助您快速创建专业报告。</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{t("categories.audit")}</h3>
                  <p className="text-sm">标准化的审计工作底稿，符合最新的行业标准。</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{t("categories.tax")}</h3>
                  <p className="text-sm">税务申报工具和模板，简化纳税申报流程。</p>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{t("categories.compliance")}</h3>
                  <p className="text-sm">全面的合规检查清单，确保业务合规运营。</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <p className="text-sm opacity-80">
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
