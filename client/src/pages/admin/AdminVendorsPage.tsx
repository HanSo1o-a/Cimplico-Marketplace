import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { UserRole, VendorVerificationStatus, VendorProfile } from "@shared/schema";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Edit, Ban, Check } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AdminVendorsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // 编辑供应商对话框状态
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [currentVendor, setCurrentVendor] = React.useState<VendorProfile | null>(null);
  const [editFormData, setEditFormData] = React.useState({
    companyName: "",
    businessNumber: "",
    website: "",
    description: ""
  });

  // 禁用/启用供应商对话框状态
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [disableVendor, setDisableVendor] = React.useState(false);

  // 使用 react-query 获取待审核的供应商列表
  const { data: pendingVendors = [], refetch: refetchPending } = useQuery<VendorProfile[]>({
    queryKey: ["/api/vendors/pending"],
    queryFn: getQueryFn({ 
      on401: "returnNull"
    }),
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  // 使用 react-query 获取所有供应商列表
  const { data: allVendors = [], refetch: refetchAll } = useQuery<VendorProfile[]>({
    queryKey: ["/api/vendors/all"],
    queryFn: getQueryFn({ 
      on401: "returnNull"
    }),
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  // 审核操作
  const handleApprove = async (vendorId: number) => {
    try {
      await apiRequest("POST", `/api/vendors/${vendorId}/approve`, {});
      toast({
        title: t("admin.vendorApproved"),
        description: t("admin.vendorApprovedDesc"),
      });
      refetchPending();
      refetchAll();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.approveError"),
        variant: "destructive",
      });
    }
  };

  const handleReject = async (vendorId: number, reason: string) => {
    try {
      await apiRequest("POST", `/api/vendors/${vendorId}/reject`, { reason });
      toast({
        title: t("admin.vendorRejected"),
        description: t("admin.vendorRejectedDesc"),
      });
      refetchPending();
      refetchAll();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.rejectError"),
        variant: "destructive",
      });
    }
  };

  // 禁用/启用供应商
  const handleToggleVendorStatus = async (vendorId: number, isDisabled: boolean) => {
    try {
      const status = isDisabled ? VendorVerificationStatus.REJECTED : VendorVerificationStatus.APPROVED;
      const reason = isDisabled ? "管理员禁用账户" : null;
      
      await apiRequest("PATCH", `/api/admin/vendors/${vendorId}`, { 
        verificationStatus: status,
        rejectionReason: reason
      });
      
      toast({
        title: isDisabled ? t("admin.vendorDisabled") : t("admin.vendorEnabled"),
        description: isDisabled ? t("admin.vendorDisabledDesc") : t("admin.vendorEnabledDesc"),
      });
      
      refetchAll();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.statusUpdateError"),
        variant: "destructive",
      });
    }
  };

  // 编辑供应商信息
  const handleEditVendor = async (vendorId: number, vendorData: any) => {
    try {
      await apiRequest("PUT", `/api/vendors/${vendorId}`, vendorData);
      
      toast({
        title: t("admin.vendorUpdated"),
        description: t("admin.vendorUpdatedDesc"),
      });
      
      refetchAll();
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.updateError"),
        variant: "destructive",
      });
    }
  };

  // 打开编辑对话框
  const openEditDialog = (vendor: VendorProfile) => {
    setCurrentVendor(vendor);
    setEditFormData({
      companyName: vendor.companyName,
      businessNumber: vendor.businessNumber,
      website: vendor.website || "",
      description: vendor.description || ""
    });
    setEditDialogOpen(true);
  };

  // 打开状态更改对话框
  const openStatusDialog = (vendor: VendorProfile, disable: boolean) => {
    setCurrentVendor(vendor);
    setDisableVendor(disable);
    setStatusDialogOpen(true);
  };

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交编辑表单
  const submitEditForm = () => {
    if (currentVendor && editFormData.companyName && editFormData.businessNumber) {
      handleEditVendor(currentVendor.id, editFormData);
    } else {
      toast({
        title: t("common.error"),
        description: t("vendor.requiredFields"),
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case VendorVerificationStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" /> {t("vendor.pending")}</Badge>;
      case VendorVerificationStatus.APPROVED:
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" /> {t("vendor.approved")}</Badge>;
      case VendorVerificationStatus.REJECTED:
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" /> {t("vendor.rejected")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">{t("admin.vendorManagement")}</h1>
      
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.pendingVendors")}</CardTitle>
            <CardDescription>
              {t("admin.pendingVendorsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingVendors && pendingVendors.length > 0 ? (
              <div className="space-y-4">
                {pendingVendors.map((vendor) => (
                  <Card key={vendor.id} className="border-l-4 border-l-yellow-400">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-lg">{vendor.companyName}</h3>
                            {renderStatusBadge(vendor.verificationStatus)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {t("vendor.businessNumber")}: {vendor.businessNumber}
                          </p>
                          <p className="text-sm mt-2 line-clamp-2">
                            {vendor.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            {vendor.website && (
                              <a
                                href={vendor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {t("vendor.website")}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(vendor.id)}
                          >
                            {t("admin.approveVendor")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const reason = prompt(t("admin.provideReason"));
                              if (reason) {
                                handleReject(vendor.id, reason);
                              }
                            }}
                          >
                            {t("admin.rejectVendor")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p>{t("admin.noPendingVendors")}</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.allVendors")}</CardTitle>
          <CardDescription>
            {t("admin.allVendorsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allVendors && allVendors.length > 0 ? (
            <div className="space-y-4">
              {allVendors.map((vendor) => (
                <Card key={vendor.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{vendor.companyName}</h3>
                          {renderStatusBadge(vendor.verificationStatus)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {t("vendor.businessNumber")}: {vendor.businessNumber}
                        </p>
                        <p className="text-sm mt-2 line-clamp-2">
                          {vendor.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {vendor.website && (
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {t("vendor.website")}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(vendor)}>
                          <Edit className="mr-1 h-3 w-3" /> {t("admin.editVendor")}
                        </Button>
                        {vendor.verificationStatus === VendorVerificationStatus.APPROVED ? (
                          <Button size="sm" variant="destructive" onClick={() => openStatusDialog(vendor, true)}>
                            <Ban className="mr-1 h-3 w-3" /> {t("admin.disableVendor")}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openStatusDialog(vendor, false)}
                          >
                            <Check className="mr-1 h-3 w-3" /> {t("admin.enableVendor")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>{t("admin.noVendors")}</p>
          )}
        </CardContent>
      </Card>

      {/* 编辑供应商对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("admin.editVendor")}</DialogTitle>
            <DialogDescription>
              {t("vendor.editVendorDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="companyName" className="text-right">
                {t("vendor.companyName")}
              </Label>
              <Input
                id="companyName"
                name="companyName"
                value={editFormData.companyName}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessNumber" className="text-right">
                {t("vendor.businessNumber")}
              </Label>
              <Input
                id="businessNumber"
                name="businessNumber"
                value={editFormData.businessNumber}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="website" className="text-right">
                {t("vendor.website")}
              </Label>
              <Input
                id="website"
                name="website"
                value={editFormData.website}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {t("vendor.description")}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={editFormData.description}
                onChange={handleInputChange}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitEditForm}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 禁用/启用供应商对话框 */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {disableVendor ? t("admin.disableVendor") : t("admin.enableVendor")}
            </DialogTitle>
            <DialogDescription>
              {disableVendor ? t("admin.confirmDisableVendor") : t("admin.confirmEnableVendor")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              variant={disableVendor ? "destructive" : "default"}
              className={!disableVendor ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={() => {
                if (currentVendor) {
                  handleToggleVendorStatus(currentVendor.id, disableVendor);
                  setStatusDialogOpen(false);
                }
              }}
            >
              {disableVendor ? t("admin.disableVendor") : t("admin.enableVendor")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminVendorsPage;