import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRole, ListingStatus, Listing } from "@shared/schema";
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
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, CheckCircle, Clock, DollarSign, ShieldAlert, ShieldOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null);

  const { data: allProducts = [], isLoading: isAllLoading } = useQuery<any[]>({
    queryKey: ["admin", "listings", "all"],
    queryFn: () => apiRequest("GET", "/api/listings"),
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  const approveMutation = useMutation({
    mutationFn: (productId: number) => apiRequest("POST", `/api/listings/${productId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings", "all"] });
      toast({
        title: t("admin.productApproved"),
        description: t("admin.productApprovedDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("admin.approveError"),
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ productId, reason }: { productId: number; reason: string }) => 
      apiRequest("POST", `/api/listings/${productId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings", "all"] });
      toast({
        title: t("admin.productRejected"),
        description: t("admin.productRejectedDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("admin.rejectError"),
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ productId, status }: { productId: number; status: string }) =>
      apiRequest("PATCH", `/api/admin/listings/${productId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings", "all"] });
      toast({ title: t("admin.statusUpdated"), description: t("admin.statusUpdatedDesc") });
    },
    onError: (error) => {
      toast({ title: t("common.error"), description: error instanceof Error ? error.message : t("admin.statusUpdateError"), variant: "destructive" });
    },
  });

  const handleApprove = (productId: number) => {
    approveMutation.mutate(productId);
  };

  const handleReject = (productId: number, reason: string) => {
    rejectMutation.mutate({ productId, reason });
  };

  // 状态变更确认对话框相关 state
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    productId: number | null;
    status: string | null;
  }>({ open: false, productId: null, status: null });

  const handleUpdateStatus = (productId: number, status: string) => {
    setConfirmDialog({ open: true, productId, status });
  };

  const handleConfirmStatusChange = () => {
    if (confirmDialog.productId && confirmDialog.status) {
      updateStatusMutation.mutate({ productId: confirmDialog.productId, status: confirmDialog.status });
    }
    setConfirmDialog({ open: false, productId: null, status: null });
  };

  const handleCancelStatusChange = () => {
    setConfirmDialog({ open: false, productId: null, status: null });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case ListingStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" /> {t("product.pending")}</Badge>;
      case ListingStatus.ACTIVE:
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" /> {t("product.active")}</Badge>;
      case ListingStatus.REJECTED:
        return <Badge variant="outline" className="bg-red-100 text-red-800"><ShieldOff className="mr-1 h-3 w-3" /> {t("product.rejected")}</Badge>;
      case ListingStatus.DRAFT:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><Edit className="mr-1 h-3 w-3" /> {t("product.draft")}</Badge>;
      case ListingStatus.INACTIVE:
        return <Badge variant="outline" className="bg-orange-100 text-orange-800"><ShieldAlert className="mr-1 h-3 w-3" /> {t("product.inactive")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 筛选待审核商品（含已下架）和正常商品
  const pendingOrInactiveProducts = allProducts.filter(
    (p) => p.status === ListingStatus.PENDING || p.status === ListingStatus.INACTIVE
  );
  const activeProducts = allProducts.filter(
    (p) => p.status === ListingStatus.ACTIVE
  );

  if (isAllLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
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
            {pendingOrInactiveProducts.length > 0 ? (
              <div className="space-y-4">
                {pendingOrInactiveProducts.map((product) => (
                  <Card key={product.id} className={product.status === ListingStatus.INACTIVE ? "border-l-4 border-l-orange-400" : "border-l-4 border-l-yellow-400"}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-lg">{product.title}</h3>
                            {renderStatusBadge(product.status)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span><DollarSign className="inline h-3 w-3 mr-1" /> ${product.price?.toFixed(2)}</span>
                            <span>{product.category}</span>
                          </div>
                          <p className="text-sm mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            {t("admin.view")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          >
                            {t("common.edit")}
                          </Button>
                          {product.status === ListingStatus.PENDING && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(product.id, ListingStatus.ACTIVE)}
                              className="min-w-[64px]"
                            >
                              {t("admin.publish") || "上架"}
                            </Button>
                          )}
                          {product.status !== ListingStatus.ACTIVE && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(product.id, ListingStatus.ACTIVE)}
                              className="min-w-[64px]"
                            >
                              {t("admin.activate")}
                            </Button>
                          )}
                          {product.status === ListingStatus.PENDING && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setRejectDialogOpen(true);
                              }}
                              className="min-w-[64px]"
                            >
                              {t("admin.reject")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">{t("admin.noPendingProducts")}</p>
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
          {activeProducts.length > 0 ? (
            <div className="space-y-4">
              {activeProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{product.title}</h3>
                          {renderStatusBadge(product.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span><DollarSign className="inline h-3 w-3 mr-1" /> ${product.price?.toFixed(2)}</span>
                          <span>{product.category}</span>
                          <span>{product.createdAt ? format(new Date(product.createdAt), 'yyyy-MM-dd') : ''}</span>
                        </div>
                        <p className="text-sm mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          {t("admin.view")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateStatus(product.id, ListingStatus.INACTIVE)}
                          className="min-w-[64px]"
                        >
                          {t("admin.deactivate")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">{t("admin.noProducts")}</p>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && handleCancelStatusChange()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.statusChangeConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.status === ListingStatus.ACTIVE
                ? t("admin.activateConfirm")
                : t("admin.deactivateConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelStatusChange}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={rejectDialogOpen} onOpenChange={(open) => !open && setRejectDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.rejectConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.rejectReason")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("admin.rejectReasonPlaceholder")}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectDialogOpen(false)}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedProductId) {
                handleReject(selectedProductId, rejectReason);
              }
              setRejectDialogOpen(false);
              setRejectReason("");
            }}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminProductsPage;