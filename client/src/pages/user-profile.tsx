import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User, Listing, Order } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductGrid from "@/components/product/ProductGrid";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User as UserIcon,
  Package,
  Heart,
  Settings,
  Calendar,
  CreditCard,
  ExternalLink,
  Download,
  ChevronRight,
  ArrowRight,
  Check,
  Clock,
  ShoppingBag,
  X
} from "lucide-react";

const UserProfile = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab");
  
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(tabParam || "profile");

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };

  // Fetch user's favorites
  const { data: favorites, isLoading: favoritesLoading } = useQuery<Listing[]>({
    queryKey: ["/api/users/favorites"],
    enabled: activeTab === "favorites" && !!user,
  });

  // Fetch user's orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/users/orders"],
    enabled: activeTab === "orders" && !!user,
  });

  // Profile update schema
  const profileSchema = z.object({
    firstName: z.string().min(1, { message: t("auth.firstNameRequired") }),
    lastName: z.string().min(1, { message: t("auth.lastNameRequired") }),
    email: z.string().email({ message: t("auth.invalidEmail") }),
    phone: z.string().optional(),
    language: z.string().default("zh"),
  });

  // Password change schema
  const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: t("user.currentPasswordRequired") }),
    newPassword: z.string().min(6, { message: t("auth.passwordMinLength") }),
    confirmPassword: z.string().min(1, { message: t("auth.passwordRequired") }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t("auth.passwordMismatch"),
    path: ["confirmPassword"],
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      language: user?.language || "zh",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        language: user.language || "zh",
      });
    }
  }, [user, profileForm]);

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("user.profileUpdated"),
      });
      queryClient.invalidateQueries(["/api/user"]);
    },
    onError: (error) => {
      toast({
        title: t("user.updateFailed"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      const res = await apiRequest("POST", "/api/user/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: t("user.passwordChanged"),
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: t("user.passwordChangeFailed"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(values);
  };

  // Handle password form submission
  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate(values);
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/4 lg:w-1/5">
          <Card className="sticky top-24">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-primary-100 text-primary-700">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{user.firstName} {user.lastName}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("profile")}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  {t("user.profile")}
                </Button>
                <Button
                  variant={activeTab === "orders" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("orders")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {t("user.orders")}
                </Button>
                <Button
                  variant={activeTab === "favorites" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("favorites")}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {t("user.favorites")}
                </Button>
                <Button
                  variant={activeTab === "settings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTabChange("settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t("user.settings")}
                </Button>
              </nav>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                onClick={handleLogout}
              >
                {t("auth.logout")}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4 lg:w-4/5">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("user.personalInfo")}</CardTitle>
                <CardDescription>
                  {t("user.updateProfileDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.firstName")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.lastName")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.email")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("user.phone")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("user.language")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("user.selectLanguage")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="zh">简体中文</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending 
                        ? t("common.loading") 
                        : t("user.updateProfile")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("user.orders")}</CardTitle>
                <CardDescription>
                  {t("user.viewOrderHistory")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="overflow-hidden">
                        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{t("order.number")}: #{order.id}</div>
                            <div className="text-sm text-neutral-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span 
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === "PAID" ? "bg-green-100 text-green-800" :
                                order.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                                order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {t(`order.${order.status.toLowerCase()}`)}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="mb-4">
                            <div className="font-medium mb-2">{t("order.items")}</div>
                            {order.items && order.items.map((item) => (
                              <div key={item.id} className="flex justify-between py-2 border-b border-neutral-100">
                                <div className="flex items-center">
                                  {item.listing?.images && item.listing.images.length > 0 && (
                                    <div className="h-12 w-12 rounded overflow-hidden mr-3">
                                      <img 
                                        src={item.listing.images[0] as string} 
                                        alt={item.listing.title} 
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{item.listing?.title}</div>
                                    <div className="text-sm text-neutral-500">
                                      {t("product.quantity")}: {item.quantity}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <div>¥{item.unitPrice.toFixed(2)}</div>
                                  {item.listing?.downloadUrl && order.status === "PAID" && (
                                    <Button 
                                      variant="link" 
                                      size="sm" 
                                      className="text-primary flex items-center px-0 py-1"
                                      onClick={() => window.open(item.listing.downloadUrl, "_blank")}
                                    >
                                      <Download className="mr-1 h-3 w-3" />
                                      {t("order.download")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-center font-medium text-lg pt-2">
                            <span>{t("order.total")}</span>
                            <span>¥{order.totalAmount.toFixed(2)}</span>
                          </div>
                          
                          <div className="mt-6 flex flex-wrap gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              {t("order.viewDetails")}
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                            
                            {order.status === "CREATED" && (
                              <Button onClick={() => navigate(`/checkout?orderId=${order.id}`)}>
                                {t("order.payNow")}
                                <ArrowRight className="ml-1 h-4 w-4" />
                              </Button>
                            )}
                            
                            {order.status === "PAID" && order.items && order.items.some(item => item.listing?.downloadUrl) && (
                              <Button variant="secondary">
                                {t("order.downloadPurchase")}
                                <Download className="ml-1 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">{t("user.noOrders")}</h3>
                    <p className="text-neutral-500 mb-4">{t("user.startShopping")}</p>
                    <Button onClick={() => navigate("/marketplace")}>
                      {t("cart.continueShopping")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("user.favorites")}</CardTitle>
                <CardDescription>
                  {t("user.savedProductsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-lg border border-neutral-200 overflow-hidden">
                        <div className="h-48 bg-neutral-200"></div>
                        <div className="p-4">
                          <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
                          <div className="h-4 bg-neutral-200 rounded w-full mb-4"></div>
                          <div className="flex justify-between items-center">
                            <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
                            <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : favorites && favorites.length > 0 ? (
                  <ProductGrid 
                    products={favorites} 
                    columns={3}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Heart className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">{t("user.noFavorites")}</h3>
                    <p className="text-neutral-500 mb-4">{t("user.exploreProducts")}</p>
                    <Button onClick={() => navigate("/marketplace")}>
                      {t("cart.continueShopping")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("user.changePassword")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("user.currentPassword")}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("user.newPassword")}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending 
                          ? t("common.loading") 
                          : t("user.changePassword")}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t("user.language")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button
                      variant={user.language === "zh" ? "default" : "outline"}
                      onClick={() => {
                        updateProfileMutation.mutate({ language: "zh" });
                      }}
                      disabled={updateProfileMutation.isPending}
                    >
                      {user.language === "zh" && <Check className="mr-2 h-4 w-4" />}
                      简体中文
                    </Button>
                    <Button
                      variant={user.language === "en" ? "default" : "outline"}
                      onClick={() => {
                        updateProfileMutation.mutate({ language: "en" });
                      }}
                      disabled={updateProfileMutation.isPending}
                    >
                      {user.language === "en" && <Check className="mr-2 h-4 w-4" />}
                      English
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50 border-red-100">
                <CardHeader>
                  <CardTitle className="text-red-600">{t("user.dangerZone")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">
                    {t("user.accountDeleteWarning")}
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      // This would show a confirmation dialog in a real implementation
                      toast({
                        title: t("user.accountDeleteUnavailable"),
                        description: t("user.contactSupport"),
                      });
                    }}
                  >
                    {t("user.deleteAccount")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
