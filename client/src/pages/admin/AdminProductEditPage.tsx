import React from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import ProductForm from "@/components/vendor/ProductForm";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const AdminProductEditPage: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // 获取商品详情
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/listings/${id}`],
    queryFn: getQueryFn(),
    enabled: !!id,
  });

  // 保存成功后的回调函数
  const handleSuccess = () => {
    toast({
      title: t("product.updateSuccess"),
      description: t("product.productUpdated"),
    });
    // 保存成功后返回商品列表页
    navigate("/admin/products");
  };

  return (
    <Card className="max-w-2xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>编辑商品 #{id}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>加载中...</span>
          </div>
        ) : product ? (
          <ProductForm product={product} onSuccess={handleSuccess} />
        ) : (
          <p className="text-red-500">未找到商品数据</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminProductEditPage;
