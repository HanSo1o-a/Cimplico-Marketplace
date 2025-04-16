import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { User, UserRole, UserStatus } from "@shared/schema";
import { MoreHorizontal, UserCheck, UserX, User as UserIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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
  });

  return (
    <AdminLayout>
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