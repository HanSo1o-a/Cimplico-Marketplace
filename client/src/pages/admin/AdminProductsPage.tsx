import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { UserRole, ListingStatus } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const AdminProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // 检查是否是管理员
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/");
    }
  }, [user, navigate]);

  // 使用 react-query 获取待审核的商品列表
  const { data: pendingListings, refetch } = useQuery({
    queryKey: ["/api/listings/pending"],
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  // 使用 react-query 获取所有商品列表
  const { data: allListings } = useQuery({
    queryKey: ["/api/listings/all"],
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  // 审核操作
  const handleApprove = async (listingId: number) => {
    try {
      await apiRequest("POST", `/api/listings/${listingId}/approve`, {});
      toast({
        title: t("admin.productApproved"),
        description: t("admin.productApprovedDesc"),
      });
      refetch();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.approveError"),
        variant: "destructive",
      });
    }
  };

  const handleReject = async (listingId: number, reason: string) => {
    try {
      await apiRequest("POST", `/api/listings/${listingId}/reject`, { reason });
      toast({
        title: t("admin.productRejected"),
        description: t("admin.productRejectedDesc"),
      });
      refetch();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.rejectError"),
        variant: "destructive",
      });
    }
  };

  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case ListingStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" /> {t("product.pending")}</Badge>;
      case ListingStatus.ACTIVE:
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" /> {t("product.active")}</Badge>;
      case ListingStatus.REJECTED:
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" /> {t("product.rejected")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar active="products" />
      
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">{t("admin.productManagement")}</h1>
        
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.pendingProducts")}</CardTitle>
              <CardDescription>
                {t("admin.pendingProductsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingListings && pendingListings.length > 0 ? (
                <div className="space-y-4">
                  {pendingListings.map((listing: any) => (
                    <Card key={listing.id} className="border-l-4 border-l-yellow-400">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-lg">{listing.title}</h3>
                              {renderStatusBadge(listing.status)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {t("product.vendor")}: {listing.vendor?.companyName}
                            </p>
                            <p className="text-sm mt-2 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/product/${listing.id}`)}
                              >
                                {t("common.view")}
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(listing.id)}
                            >
                              {t("admin.approve")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const reason = prompt(t("admin.rejectReason"));
                                if (reason) {
                                  handleReject(listing.id, reason);
                                }
                              }}
                            >
                              {t("admin.reject")}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>{t("admin.noPendingProducts")}</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.allProducts")}</CardTitle>
            <CardDescription>
              {t("admin.allProductsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allListings && allListings.length > 0 ? (
              <div className="space-y-4">
                {allListings.map((listing: any) => (
                  <Card key={listing.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-lg">{listing.title}</h3>
                            {renderStatusBadge(listing.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {t("product.vendor")}: {listing.vendor?.companyName}
                          </p>
                          <p className="text-sm mt-2 line-clamp-2">
                            {listing.description}
                          </p>
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/product/${listing.id}`)}
                            >
                              {t("common.view")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p>{t("admin.noProducts")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProductsPage;