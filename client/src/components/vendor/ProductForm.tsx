import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertListingSchema, ListingType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: any; // 现有产品数据，用于编辑
  onSuccess?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSuccess }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(product?.tags ? [...product.tags] : []);
  const [tagInput, setTagInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    product?.images ? [...product.images] : []
  );

  // 创建表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      price: product?.price || 0,
      type: product?.type || ListingType.DIGITAL,
      category: product?.category || "financial",
      isFeatured: product?.isFeatured || false,
    },
  });

  // 提交表单
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const productData = {
        ...values,
        tags: tags,
        images: uploadedImages,
      };

      if (product) {
        // 更新现有产品
        await apiRequest("PATCH", `/api/listings/${product.id}`, productData);
        toast({
          title: t("product.updateSuccess"),
          description: t("product.productUpdated"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
        queryClient.invalidateQueries({ queryKey: [`/api/listings/${product.id}`] });
      } else {
        // 创建新产品
        await apiRequest("POST", "/api/listings", productData);
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
      console.error("提交表单时出错:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("product.formError"),
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

  // 模拟图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    // 在实际应用中，这里应该是将文件上传到服务器或云存储
    // 为了演示，我们将使用URL.createObjectURL创建临时URL
    const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
    setUploadedImages([...uploadedImages, ...newImages]);

    // 清除input value，允许上传相同的文件
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
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("product.categoryPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="financial">{t("categories.financial")}</SelectItem>
                        <SelectItem value="audit">{t("categories.audit")}</SelectItem>
                        <SelectItem value="tax">{t("categories.tax")}</SelectItem>
                        <SelectItem value="compliance">{t("categories.compliance")}</SelectItem>
                        <SelectItem value="analysis">{t("categories.analysis")}</SelectItem>
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

            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("product.featured")}
                    </FormLabel>
                    <FormDescription>
                      {t("product.featuredDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
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