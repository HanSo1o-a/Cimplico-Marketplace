import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertListingSchema, ListingType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// 扩展验证架构，添加验证规则
const formSchema = insertListingSchema.extend({
  title: z.string().min(5, {
    message: "产品标题至少需要5个字符",
  }),
  description: z.string().min(20, {
    message: "产品描述至少需要20个字符",
  }),
  price: z.coerce.number().min(0, {
    message: "价格不能为负数",
  }),
  vendorId: z.number().optional(), // 让vendorId为可选，避免编辑时报错
  downloadUrl: z.string().optional(), // 添加downloadUrl字段的验证规则
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: any; // 现有产品数据，用于编辑
  vendorId?: number; // 供应商ID
  onSuccess?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, vendorId, onSuccess }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(product?.tags ? [...product.tags] : []);
  const [tagInput, setTagInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    product?.images ? [...product.images] : []
  );

  // 获取真实分类数据
  const { data: categoriesData = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  // 创建表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      price: product?.price || 0,
      type: product?.type || ListingType.DIGITAL,
      category: product?.category || "",
      downloadUrl: product?.downloadUrl || "",
    },
  });

  // 提交表单
  const onSubmit = async (values: FormValues) => {
    console.log("[ProductForm] onSubmit called with values:", values);
    try {
      setIsSubmitting(true);
      const productData = {
        ...values,
        tags: tags,
        images: uploadedImages
      };
      console.log("[ProductForm] productData to submit:", productData);
      // 确保vendorId不会被重复添加
      if (!product && vendorId) {
        productData.vendorId = vendorId;
      }
      if (product) {
        // 更新现有产品
        const updateData = {
          ...productData,
          // 如果商品之前被拒绝，更新后将状态改为待审核
          ...(product.status === "REJECTED" && { status: "PENDING" })
        };
        console.log("[ProductForm] 更新产品数据:", updateData);
        const response = await apiRequest("PATCH", `/api/listings/${product.id}`, updateData);
        console.log("[ProductForm] 更新产品响应:", response);
        toast({
          title: t("product.updateSuccess"),
          description: t("product.productUpdated"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
        queryClient.invalidateQueries({ queryKey: [`/api/listings/${product.id}`] });
      } else {
        // 创建新产品
        if (!vendorId) {
          throw new Error("缺少供应商ID");
        }
        const response = await apiRequest("POST", `/api/vendors/${vendorId}/listings`, productData);
        console.log("[ProductForm] 创建产品响应:", response);
        toast({
          title: t("product.createSuccess"),
          description: t("product.productCreated"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("[ProductForm] 提交表单时出错:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("product.formError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理标签添加
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  // 处理标签删除
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 上传图片到服务器，返回真实图片URL
  async function uploadImageToServer(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('上传失败');
    const data = await res.json();
    return data.url;
  }

  // 模拟图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      // 上传到服务器，获得真实URL
      try {
        const url = await uploadImageToServer(file);
        uploaded.push(url);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: '图片上传失败',
          description: (err as Error).message,
        });
      }
    }
    setUploadedImages([...uploadedImages, ...uploaded]);
    e.target.value = "";
  };

  // 删除图片
  const handleRemoveImage = (imageToRemove: string) => {
    setUploadedImages(uploadedImages.filter((image) => image !== imageToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product ? t("product.editProduct") : t("product.addProduct")}
        </CardTitle>
        <CardDescription>
          {product
            ? t("product.editProductDescription")
            : t("product.addProductDescription")}
        </CardDescription>
        
        {/* 显示拒绝理由 */}
        {product && product.status === "REJECTED" && product.rejectionReason && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-md">
            <h3 className="text-red-700 font-medium mb-1">{t("product.rejectionReason")}:</h3>
            <p className="text-red-600">{product.rejectionReason}</p>
            <p className="text-sm text-red-500 mt-2">{t("product.editAndResubmit")}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.warn('[ProductForm] 校验未通过，errors:', errors);
              // 也可以在页面上显示所有校验错误
            })}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("product.title")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("product.titlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("product.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("product.descriptionPlaceholder")}
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("product.descriptionHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("product.type")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={ListingType.DIGITAL} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t("product.types.digital")}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={ListingType.SERVICE} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t("product.types.service")}
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("product.category")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("product.categoryPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCategoriesLoading ? (
                          <SelectItem value="__loading__" disabled>加载分类中...</SelectItem>
                        ) : categoriesData.length === 0 ? (
                          <SelectItem value="__none__" disabled>暂无分类</SelectItem>
                        ) : (
                          categoriesData
                            .filter((cat: any) => cat.name && cat.name !== "")
                            .map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("product.price")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">¥</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="pl-8"
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("product.priceTip")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="downloadUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("product.downloadUrl")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("product.downloadUrlPlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription>{t("product.downloadUrlHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>{t("product.tags")}</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2 mb-4">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <Input
                placeholder={t("product.tagsPlaceholder")}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              <FormDescription className="mt-1">
                {t("product.tagsHelp")}
              </FormDescription>
            </div>

            <div>
              <FormLabel>{t("product.images")}</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 mb-4">
                {uploadedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-muted rounded-md overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => handleRemoveImage(image)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md aspect-square cursor-pointer hover:bg-muted/50 transition-colors">
                  <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {t("product.uploadImage")}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <FormDescription>
                {t("product.imagesHelp")}
              </FormDescription>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90 disabled:bg-gray-200 disabled:text-gray-400"
              disabled={isSubmitting}
              variant="primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : product ? (
                t("common.save")
              ) : (
                t("product.create")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;