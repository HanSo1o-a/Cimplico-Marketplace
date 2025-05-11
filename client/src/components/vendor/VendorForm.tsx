import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertVendorProfileSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// 基础验证 schema
const baseVendorFormSchema = insertVendorProfileSchema.extend({
  companyName: z.string().min(2, {
    message: "公司名称至少需要2个字符",
  }),
  description: z.string().min(10, {
    message: "描述至少需要10个字符",
  }),
  website: z.string().url({
    message: "请输入有效的网址",
  }).or(z.literal("")),
  businessNumber: z.string().min(1, {
    message: "商业编号不能为空",
  }),
});

// 完整验证 schema，根据是否为编辑模式决定是否包含 agreeTerms
const getVendorFormSchema = (isEditing: boolean) => {
  if (isEditing) {
    return baseVendorFormSchema;
  }
  return baseVendorFormSchema.extend({
    agreeTerms: z.literal(true, {
      errorMap: () => ({ message: "您必须同意服务条款才能成为供应商" }),
    }),
  });
};

// 类型推断需要针对包含所有可能字段的情况，或者使用联合类型
// 为了简单起见，我们这里让 FormValues 包含可选的 agreeTerms
type FormValues = z.infer<typeof baseVendorFormSchema> & { agreeTerms?: true };

interface VendorFormProps {
  vendorProfile?: any; // 现有供应商数据，用于编辑
  onSuccess?: () => void;
}

export default function VendorForm({ vendorProfile, onSuccess }: VendorFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!vendorProfile;

  const formSchema = getVendorFormSchema(isEditing);

  // 创建表单实例
  const form = useForm<FormValues>({
    // resolver: zodResolver(formSchema), // Temporarily commented out for debugging
    defaultValues: {
      companyName: vendorProfile?.companyName || "",
      description: vendorProfile?.description || "",
      website: vendorProfile?.website || "",
      businessNumber: vendorProfile?.businessNumber || "",
      ...(!isEditing && { agreeTerms: undefined }), // 新申请时，默认未勾选 (undefined aligns with 'agreeTerms?: true')
    },
  });

  const isLoading = form.formState.isSubmitting;

  // 提交表单
  const onSubmit = async (data: FormValues) => {
    console.log("[VendorForm] onSubmit triggered");
    console.log("[VendorForm] Form data submitted:", JSON.stringify(data, null, 2));
    console.log("[VendorForm] form.formState.errors before submit:", JSON.stringify(form.formState.errors, null, 2));

    // 检查 form.formState.isValid，虽然 zodResolver 通常会阻止无效提交，但多一层检查无妨
    if (!form.formState.isValid) {
      console.warn("[VendorForm] Form is not valid according to form.formState.isValid. Errors:", JSON.stringify(form.formState.errors, null, 2));
      // 通常 react-hook-form 会阻止 onSubmit 被调用如果表单无效，但以防万一
      // toast({ variant: "destructive", title: t("common.error"), description: t("common.fillRequiredFields") });
      // return; // 理论上不需要，因为 react-hook-form 的 resolver 会处理
    }

    const apiData = { ...data, agreeTerms: undefined }; // agreeTerms 不需要提交到API
    console.log("[VendorForm] Data being sent to API:", JSON.stringify(apiData, null, 2));

    try {
      if (vendorProfile) {
        const apiUrl = `/api/vendor-profiles/${vendorProfile.id}`;
        console.log(`[VendorForm] Attempting to PATCH to ${apiUrl}`);
        // 更新现有供应商资料
        const response = await apiRequest("PATCH", apiUrl, apiData);
        console.log("[VendorForm] PATCH response:", response);
        toast({
          title: t("vendor.updateSuccess"),
          description: t("vendor.profileUpdated"),
        });
      } else {
        const apiUrl = "/api/vendor-profiles";
        console.log(`[VendorForm] Attempting to POST to ${apiUrl}`);
        // 创建新供应商资料
        const response = await apiRequest("POST", apiUrl, apiData);
        console.log("[VendorForm] POST response:", response);
        toast({
          title: t("vendor.applicationSuccess"),
          description: t("vendor.applicationSubmitted"),
        });
      }

      if (onSuccess) {
        console.log("[VendorForm] Calling onSuccess callback.");
        onSuccess();
      }
    } catch (error: any) {
      console.error("[VendorForm] Error during form submission:", error);
      if (error.response) {
        console.error("[VendorForm] Error response data:", error.response.data);
        console.error("[VendorForm] Error response status:", error.response.status);
        console.error("[VendorForm] Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("[VendorForm] Error request data:", error.request);
      } else {
        console.error("[VendorForm] Error message:", error.message);
      }
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.response?.data?.message || t("vendor.formError"),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {vendorProfile ? t("vendor.editProfile") : t("vendor.becomeVendor")}
        </CardTitle>
        <CardDescription>
          {vendorProfile
            ? t("vendor.updateProfileDescription")
            : t("vendor.becomeVendorDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.companyName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("vendor.companyNamePlaceholder")} {...field} />
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
                  <FormLabel>{t("vendor.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("vendor.descriptionPlaceholder")}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("vendor.descriptionHelp")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.website")}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("vendor.businessNumber")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("vendor.businessNumberPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {t("vendor.agreeToTerms")}
                      </FormLabel>
                      <FormDescription>
                        {t("vendor.agreeToTermsDescription")}
                        <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                          {t("vendor.termsAndConditions")}
                        </a>
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            )}

            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={() => {
                console.log("[VendorForm] Save button clicked.");
                console.log("[VendorForm] form.formState.errors on button click:", JSON.stringify(form.formState.errors, null, 2));
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : vendorProfile ? (
                t("common.save")
              ) : (
                t("vendor.apply")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}