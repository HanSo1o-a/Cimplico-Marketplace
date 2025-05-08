import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { User, UserRole, UserStatus } from "@shared/schema";
import { MoreHorizontal, UserCheck, UserX, User as UserIcon, Edit, KeyRound } from "lucide-react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";

// 用户编辑表单验证模式
const userEditSchema = z.object({
  firstName: z.string().min(1, { message: "名字不能为空" }),
  lastName: z.string().min(1, { message: "姓氏不能为空" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  phone: z.string().optional(),
  role: z.enum([UserRole.ADMIN, UserRole.USER, UserRole.VENDOR]),
  language: z.string().min(1, { message: "请选择语言" }),
});

// 密码修改表单验证模式
const passwordChangeSchema = z.object({
  password: z.string().min(6, { message: "密码至少需要6个字符" }),
  confirmPassword: z.string().min(6, { message: "确认密码至少需要6个字符" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不匹配",
  path: ["confirmPassword"],
});

const UserStatusBadge = ({ status }: { status: UserStatus }) => {
  const statusColors: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    [UserStatus.INACTIVE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
    [UserStatus.SUSPENDED]: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
  };

  return (
    <Badge className={statusColors[status]} variant="outline">
      {status}
    </Badge>
  );
};

const UserRoleBadge = ({ role }: { role: UserRole }) => {
  const roleColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
    [UserRole.VENDOR]: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    [UserRole.USER]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  };

  return (
    <Badge className={roleColors[role]} variant="outline">
      {role}
    </Badge>
  );
};

const UsersTable = ({ users }: { users: User[] }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialog, setEditDialog] = useState<boolean>(false);
  const [passwordDialog, setPasswordDialog] = useState<boolean>(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "activate" | "suspend" | null;
  }>({
    open: false,
    action: null,
  });

  const handleStatusChange = async () => {
    if (!selectedUser || !actionDialog.action) return;

    try {
      const newStatus = actionDialog.action === "activate" ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

      await apiRequest("PATCH", `/api/admin/users/${selectedUser.id}`, {
        status: newStatus
      });

      toast({
        title: t("admin.statusUpdateSuccess"),
        description: t("admin.userStatusUpdated"),
      });

      // 刷新用户列表数据
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });

      // 关闭对话框并重置状态
      setActionDialog({ open: false, action: null });
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: t("admin.statusUpdateFailed"),
        description: t("admin.somethingWentWrong"),
        variant: "destructive",
      });
    }
  };

  // 编辑用户表单
  const editForm = useForm<z.infer<typeof userEditSchema>>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: UserRole.USER,
      language: "zh",
    },
  });

  // 修改密码表单
  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // 当选中用户变化时，更新表单默认值
  useEffect(() => {
    if (selectedUser) {
      editForm.reset({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        phone: selectedUser.phone || "",
        role: selectedUser.role as UserRole,
        language: selectedUser.language || "zh",
      });
    }
  }, [selectedUser, editForm]);

  // 处理用户编辑提交
  const handleEditSubmit = async (data: z.infer<typeof userEditSchema>) => {
    if (!selectedUser) return;

    try {
      await apiRequest("PATCH", `/api/admin/users/${selectedUser.id}`, data);

      toast({
        title: t("admin.userUpdateSuccess"),
        description: t("admin.userInfoUpdated"),
      });

      // 刷新用户列表数据
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });

      // 关闭对话框并重置状态
      setEditDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: t("admin.userUpdateFailed"),
        description: t("admin.somethingWentWrong"),
        variant: "destructive",
      });
    }
  };

  // 处理密码修改提交
  const handlePasswordSubmit = async (data: z.infer<typeof passwordChangeSchema>) => {
    if (!selectedUser) return;

    try {
      console.log("Submitting password change:", { userId: selectedUser.id, passwordLength: data.password.length });

      const result = await apiRequest("PATCH", `/api/admin/users/${selectedUser.id}/password`, {
        password: data.password
      });

      console.log("Password change successful:", result);

      toast({
        title: t("admin.passwordUpdateSuccess"),
        description: t("admin.passwordUpdated"),
      });

      // 关闭对话框并重置状态
      setPasswordDialog(false);
      setSelectedUser(null);
      passwordForm.reset();
    } catch (error) {
      console.error("Password change failed:", error);

      toast({
        title: t("admin.passwordUpdateFailed"),
        description: t("admin.somethingWentWrong"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>{t("admin.name")}</TableHead>
            <TableHead>{t("admin.email")}</TableHead>
            <TableHead>{t("admin.role")}</TableHead>
            <TableHead>{t("admin.status")}</TableHead>
            <TableHead>{t("admin.phone")}</TableHead>
            <TableHead>{t("admin.language")}</TableHead>
            <TableHead>{t("admin.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.id}</TableCell>
              <TableCell>
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <UserRoleBadge role={user.role as UserRole} />
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.status as UserStatus} />
              </TableCell>
              <TableCell>{user.phone || "-"}</TableCell>
              <TableCell>{user.language}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t("admin.openMenu")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t("admin.actions")}</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user);
                        setEditDialog(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      <span>{t("admin.editUser")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user);
                        setPasswordDialog(true);
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>{t("admin.changePassword")}</span>
                    </DropdownMenuItem>
                    {(user.status as UserStatus) !== UserStatus.ACTIVE && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setActionDialog({
                            open: true,
                            action: "activate",
                          });
                        }}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        <span>{t("admin.activateUser")}</span>
                      </DropdownMenuItem>
                    )}
                    {(user.status as UserStatus) !== UserStatus.SUSPENDED && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setActionDialog({
                            open: true,
                            action: "suspend",
                          });
                        }}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        <span>{t("admin.suspendUser")}</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 编辑用户对话框 */}
      <Dialog
        open={editDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog(false);
            setSelectedUser(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("admin.editUserInfo")}</DialogTitle>
            <DialogDescription>
              {t("admin.editUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.firstName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.lastName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.email")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.role")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("admin.selectRole")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.USER}>{t("admin.roleUser")}</SelectItem>
                        <SelectItem value={UserRole.VENDOR}>{t("admin.roleVendor")}</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>{t("admin.roleAdmin")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.language")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("admin.selectLanguage")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="zh">{t("admin.languageChinese")}</SelectItem>
                        <SelectItem value="en">{t("admin.languageEnglish")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditDialog(false);
                    setSelectedUser(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit">{t("common.save")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog
        open={passwordDialog}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordDialog(false);
            setSelectedUser(null);
            passwordForm.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("admin.changePassword")}</DialogTitle>
            <DialogDescription>
              {selectedUser && `${t("admin.changePasswordFor")} ${selectedUser.firstName} ${selectedUser.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.newPassword")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
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
                    <FormLabel>{t("admin.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPasswordDialog(false);
                    setSelectedUser(null);
                    passwordForm.reset();
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit">{t("common.save")}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 状态更改确认对话框 */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, action: null });
            setSelectedUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "activate"
                ? t("admin.activateUserConfirm")
                : t("admin.suspendUserConfirm")}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === "activate"
                ? t("admin.activateUserDescription")
                : t("admin.suspendUserDescription")}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <p>
                <strong>{t("admin.user")}:</strong>{" "}
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p>
                <strong>{t("admin.email")}:</strong> {selectedUser.email}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setActionDialog({ open: false, action: null });
                setSelectedUser(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant={actionDialog.action === "activate" ? "default" : "destructive"}
              onClick={handleStatusChange}
            >
              {actionDialog.action === "activate"
                ? t("admin.activateUser")
                : t("admin.suspendUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const LoadingState = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div>
        <div className="rounded-md border">
          <div className="flex h-12 items-center px-6">
            <Skeleton className="h-4 w-[10%]" />
            <Skeleton className="ml-4 h-4 w-[30%]" />
            <Skeleton className="ml-4 h-4 w-[30%]" />
            <Skeleton className="ml-4 h-4 w-[10%]" />
            <Skeleton className="ml-4 h-4 w-[10%]" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex h-16 items-center border-t px-6">
              <Skeleton className="h-4 w-[10%]" />
              <Skeleton className="ml-4 h-4 w-[30%]" />
              <Skeleton className="ml-4 h-4 w-[30%]" />
              <Skeleton className="ml-4 h-4 w-[10%]" />
              <Skeleton className="ml-4 h-4 w-[10%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminUsersPage = () => {
  const { t } = useTranslation();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({
      on401: "throw",
      fallbackData: []
    }),
  });

  return (
    <AdminLayout active="users">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("admin.userManagement")}</CardTitle>
          <CardDescription>
            {t("admin.userManagementDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              <p>{t("admin.errorLoadingUsers")}</p>
            </div>
          ) : users && users.length > 0 ? (
            <UsersTable users={users} />
          ) : (
            <div className="text-center py-4 text-gray-500">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p>{t("admin.noUsersFound")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminUsersPage;