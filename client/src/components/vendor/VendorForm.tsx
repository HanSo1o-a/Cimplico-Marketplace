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

// 扩展验证架构，添加验证规则
const formSchema = insertVendorProfileSchema.extend({
  companyName: z.string().min(2, {
    message: "公司名称至少需要2个字符",
  }),
  description: z.string().min(10, {
    message: "描述至少需要10个字符",
  }),
  website: z.string().url({
    message: "请输入有效的网址",
  }).or(z.literal("")),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "您必须同意服务条款才能成为供应商" }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface VendorFormProps {
  vendorProfile?: any; // 现有供应商数据，用于编辑
  onSuccess?: () => void;
}

export default function VendorForm({ vendorProfile, onSuccess }: VendorFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  // 创建表单实例
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: vendorProfile?.companyName || "",
      description: vendorProfile?.description || "",
      website: vendorProfile?.website || "",
      businessType: vendorProfile?.businessType || "会计师事务所",
      contactEmail: vendorProfile?.contactEmail || user?.email || "",
      contactPhone: vendorProfile?.contactPhone || "",
      agreeTerms: vendorProfile ? true : false,
    },
  });

  const isLoading = form.formState.isSubmitting;

  // 提交表单
  const onSubmit = async (data: FormValues) => {
    try {
      if (vendorProfile) {
        // 更新现有供应商资料
        await apiRequest("PATCH", `/api/vendor-profiles/${vendorProfile.id}`, {
          ...data,
          agreeTerms: undefined, // 不需要提交到API
        });
        toast({
          title: t("vendor.updateSuccess"),
          description: t("vendor.profileUpdated"),
        });
      } else {
        // 创建新供应商资料
        await apiRequest("POST", "/api/vendor-profiles", {
          ...data,
          agreeTerms: undefined, // 不需要提交到API
        });
        toast({
          title: t("vendor.applicationSuccess"),
          description: t("vendor.applicationSubmitted"),
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("提交表单时出错:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("vendor.formError"),
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

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.businessType")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("vendor.businessTypePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.contactEmail")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vendor.contactPhone")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!vendorProfile && (
              <FormField
                control={form.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {t("vendor.agreeTerms")}
                      </FormLabel>
                      <FormDescription>
                        {t("vendor.termsDescription")}
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
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