import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import ProductCard from "@/components/product/ProductCard";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { Listing as BaseListing } from "@shared/schema";

// 扩展Listing类型，添加isSaved属性
interface Listing extends BaseListing {
  isSaved?: boolean;
  vendor?: {
    id: number;
    companyName: string;
    verificationStatus: string;
    user?: {
      id: number;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User, Order } from "@shared/schema";
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
  const [_, navigate] = useLocation();
  const [, params] = useSearch();
  const { user, logoutMutation } = useAuth();
  const queryClient = useQueryClient();
  const search = new URLSearchParams(params);
  const tabParam = search.get("tab");

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
  const { data: favorites, isLoading: favoritesLoading, refetch: refetchFavorites } = useQuery<Listing[]>({
    queryKey: ["/api/users/current/favorites"],
    queryFn: getQueryFn(),
    enabled: activeTab === "favorites" && !!user,
  });

  // Fetch user's orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/users/current/orders"],
    queryFn: getQueryFn(),
    enabled: activeTab === "orders" && !!user,
  });

  // 获取订单项目名称的简单函数
  const getOrderItemName = async (orderId: number) => {
    try {
      // 直接获取单个订单的详细信息
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('获取订单详情失败');

      const orderData = await response.json();

      // 如果有商品信息，返回第一个商品的标题
      if (orderData.items && orderData.items.length > 0 && orderData.items[0].listing) {
        return orderData.items[0].listing.title;
      }

      // 如果没有商品信息，返回默认文本
      return `订单 #${orderId}`;
    } catch (error) {
      console.error('获取订单项目名称失败:', error);
      return `订单 #${orderId}`;
    }
  };

  // 存储订单项目名称
  const [orderItemNames, setOrderItemNames] = useState<Record<number, string>>({});

  // 当订单数据加载完成后，获取订单项目名称
  useEffect(() => {
    if (orders && orders.length > 0 && activeTab === "orders") {
      // 为每个订单获取商品名称
      orders.forEach(async (order) => {
        const itemName = await getOrderItemName(order.id);
        setOrderItemNames(prev => ({
          ...prev,
          [order.id]: itemName
        }));
      });
    }
  }, [orders, activeTab]);

  // Profile update schema
  const profileSchema = z.object({
    firstName: z.string().min(1, { message: t("请输入您的名字") }),
    lastName: z.string().min(1, { message: t("请输入您的姓氏") }),
    email: z.string().email({ message: t("请输入有效的电子邮件地址") }),
    phone: z.string().optional(),
    language: z.string().default("en"),
  });

  // Password change schema
  const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: t("请输入当前密码") }),
    newPassword: z.string().min(6, { message: t("密码长度至少为6位") }),
    confirmPassword: z.string().min(1, { message: t("请输入确认密码") }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t("两次输入的密码不一致"),
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
      language: user?.language || "en",
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
        language: user.language || "en",
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
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: t("user.profileUpdateFailed"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordSchema>) => {
      console.log("提交密码修改:", {
        currentPassword: data.currentPassword ? "[REDACTED]" : "missing",
        newPassword: data.newPassword ? "[REDACTED]" : "missing",
        confirmPassword: data.confirmPassword ? "[REDACTED]" : "missing"
      });

      const res = await apiRequest("POST", "/api/user/change-password", data);
      const result = await res.json();
      console.log("密码修改响应:", result);
      return result;
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
        description: error instanceof Error ? error.message : t("common.unknownError"),
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
                  {t("user.personalInfo")}
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
                {t("Log Out")}
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
                <CardTitle>{t("Personal Infomation")}</CardTitle>
                <CardDescription>
                  {t("Edit your personal information")}
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
                            <FormLabel>{t("First Name")}</FormLabel>
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
                            <FormLabel>{t("Last Name")}</FormLabel>
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
                          <FormLabel>{t("E-mail")}</FormLabel>
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
                          <FormLabel>{t("Mbile")}</FormLabel>
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
                          <FormLabel>{t("common.language")}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("common.selectLanguage")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">{t("common.simplifiedChinese")}</SelectItem>
                              <SelectItem value="en">{t("English")}</SelectItem>
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
                        ? t("common.processing")
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
                <CardTitle>{t("order.title")}</CardTitle>
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">{t("order.id")}</th>
                          <th className="text-left py-3 px-4 font-medium">{t("order.items")}</th>
                          <th className="text-left py-3 px-4 font-medium">{t("order.statusLabel")}</th>
                          <th className="text-left py-3 px-4 font-medium">{t("order.date")}</th>
                          <th className="text-right py-3 px-4 font-medium">{t("order.total")}</th>
                          <th className="text-right py-3 px-4 font-medium">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any) => {
                          // 使用获取到的订单项目名称，如果还没获取到则使用默认值
                          const orderName = orderItemNames[order.id] || `${t("order.title")} #${order.id}`;
                          const itemCount = order.items?.length || 0;

                          return (
                            <tr key={order.id} className="border-b hover:bg-neutral-50">
                              <td className="py-4 px-4">
                                <div className="font-medium">#{order.id}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-medium truncate max-w-[200px]">
                                  {orderName}
                                </div>
                                {itemCount > 1 && (
                                  <div className="text-xs text-neutral-500">+{itemCount - 1} {t("common.more")}</div>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    order.status === "PAID" ? "bg-green-100 text-green-800" :
                                    order.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                                    order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                                    order.status === "CREATED" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {order.status === "PAID" && t("order.status.PAID")}
                                  {order.status === "COMPLETED" && t("order.status.COMPLETED")}
                                  {order.status === "CANCELLED" && t("order.status.CANCELLED")}
                                  {order.status === "CREATED" && t("order.status.CREATED")}
                                  {order.status === "SHIPPED" && t("order.status.SHIPPED")}
                                  {order.status === "REFUNDED" && t("order.status.REFUNDED")}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-neutral-500">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-4 px-4 text-right font-medium">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <Button
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                  variant="outline"
                                  size="sm"
                                >
                                  {t("order.viewDetails")}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">{t("user.noOrders")}</h3>
                    <p className="text-neutral-500 mb-4">{t("user.startShopping")}</p>
                    <Button onClick={() => navigate("/marketplace")}>
                      {t("user.continueShopping")}
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
                  {t("user.viewFavorites")}
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
                ) : favorites && favorites.filter(product => product.isSaved === true).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {favorites.filter(product => product.isSaved === true).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        savedInitially={true} // 所有收藏列表中的商品都是已收藏的
                        handleSaveInParent={true} // 由父组件处理API请求
                        onSaveToggle={async (id, newIsSavedState) => {
                          try {
                            if (!newIsSavedState) { // 用户想要取消收藏
                              await apiRequest("DELETE", `/api/users/current/favorites/${id}`);
                            } else {
                              // 用户想要添加收藏 (此场景下不太可能，因为商品已在收藏列表)
                              // 但为了以防万一或将来 ProductCard 用途更广，可以保留
                              await apiRequest("POST", "/api/users/current/favorites", { listingId: id });
                            }

                            // API调用成功后，重新获取最新的收藏列表。
                            await refetchFavorites();

                            toast({
                              title: newIsSavedState ? t("user.favoriteAdded") : t("user.favoriteRemoved"),
                            });

                          } catch (error) {
                            toast({
                              title: newIsSavedState ? t("user.favoriteAddFailed") : t("user.favoriteRemoveFailed"),
                              description: error instanceof Error ? error.message : t("common.unknownError"),
                              variant: "destructive",
                            });
                            // 如果API调用失败，也建议刷新一下列表，以确保UI与服务器状态一致
                            await refetchFavorites();
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">{t("user.noFavorites")}</h3>
                    <p className="text-neutral-500 mb-4">{t("user.startExploring")}</p>
                    <Button onClick={() => navigate("/marketplace")}>
                      {t("user.continueShopping")}
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
                            <FormLabel>{t("user.confirmPassword")}</FormLabel>
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
                          ? t("common.processing")
                          : t("user.changePassword")}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("common.language")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button
                      variant={user.language === "en" ? "default" : "outline"}
                      onClick={() => {
                        updateProfileMutation.mutate({ language: "en" });
                      }}
                      disabled={updateProfileMutation.isPending}
                    >
                      {user.language === "en" && <Check className="mr-2 h-4 w-4" />}
                      {t("common.simplifiedChinese")}
                    </Button>
                    <Button
                      variant={user.language === "en" ? "default" : "outline"}
                      onClick={() => {
                        updateProfileMutation.mutate({ language: "en" });
                      }}
                      disabled={updateProfileMutation.isPending}
                    >
                      {user.language === "en" && <Check className="mr-2 h-4 w-4" />}
                      {t("English")}
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
                    {t("user.deleteAccountWarning")}
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // This would show a confirmation dialog in a real implementation
                      toast({
                        title: t("user.deleteAccountUnavailable"),
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
