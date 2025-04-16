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
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const AdminVendorsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // 使用 react-query 获取待审核的供应商列表
  const { data: pendingVendors = [], refetch: refetchPending } = useQuery<VendorProfile[]>({
    queryKey: ["/api/vendors/pending"],
    queryFn: getQueryFn({ 
      on401: "throw",
      fallbackData: [] 
    }),
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  // 使用 react-query 获取所有供应商列表
  const { data: allVendors = [], refetch: refetchAll } = useQuery<VendorProfile[]>({
    queryKey: ["/api/vendors/all"],
    queryFn: getQueryFn({ 
      on401: "throw",
      fallbackData: [] 
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
    </>
  );
};

export default AdminVendorsPage;