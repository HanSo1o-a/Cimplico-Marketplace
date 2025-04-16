import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRole, Category } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // 获取所有分类
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ 
      on401: "throw",
      fallbackData: [] 
    }),
  });

  // 创建分类
  const createMutation = useMutation({
    mutationFn: async (category: { name: string; slug: string }) => {
      const res = await apiRequest("POST", "/api/categories", category);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCategory({ name: "", slug: "" });
      setIsAddDialogOpen(false);
      toast({
        title: t("admin.categoryCreated"),
        description: t("admin.categoryCreatedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("admin.categoryCreateError"),
        variant: "destructive",
      });
    },
  });

  // 更新分类
  const updateMutation = useMutation({
    mutationFn: async (category: Partial<Category> & { id: number }) => {
      const { id, ...categoryData } = category;
      const res = await apiRequest("PATCH", `/api/categories/${id}`, categoryData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      setIsEditDialogOpen(false);
      toast({
        title: t("admin.categoryUpdated"),
        description: t("admin.categoryUpdatedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("admin.categoryUpdateError"),
        variant: "destructive",
      });
    },
  });

  // 删除分类
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteConfirmId(null);
      toast({
        title: t("admin.categoryDeleted"),
        description: t("admin.categoryDeletedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("admin.categoryDeleteError"),
        variant: "destructive",
      });
    },
  });

  // 处理创建分类
  const handleCreateCategory = () => {
    if (!newCategory.name || !newCategory.slug) {
      toast({
        title: t("common.error"),
        description: t("admin.categoryInvalidInput"),
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newCategory);
  };

  // 处理更新分类
  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name || !editingCategory.slug) {
      toast({
        title: t("common.error"),
        description: t("admin.categoryInvalidInput"),
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(editingCategory);
  };

  // 处理删除分类
  const handleDeleteCategory = (id: number) => {
    deleteMutation.mutate(id);
  };

  // 处理编辑分类按钮点击
  const handleEditClick = (category: Category) => {
    setEditingCategory({...category});
    setIsEditDialogOpen(true);
  };

  // 生成slug
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // 自动生成slug
  const handleNameChange = (name: string, isNew = true) => {
    if (isNew) {
      setNewCategory({
        name,
        slug: generateSlug(name)
      });
    } else if (editingCategory) {
      setEditingCategory({
        ...editingCategory,
        name,
        slug: generateSlug(name)
      });
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("admin.categoryManagement")}</h1>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> {t("admin.addCategory")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.categories")}</CardTitle>
          <CardDescription>{t("admin.categoriesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 font-semibold p-2 bg-gray-50 rounded-md">
                <div>{t("admin.categoryName")}</div>
                <div>{t("admin.categorySlug")}</div>
                <div className="text-right">{t("common.actions")}</div>
              </div>
              <Separator />
              {categories.map((category) => (
                <div key={category.id} className="grid grid-cols-3 items-center py-2">
                  <div>{category.name}</div>
                  <div className="text-gray-500 text-sm">{category.slug}</div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(category)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmId(category.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              {t("admin.noCategories")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 添加分类对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.addCategory")}</DialogTitle>
            <DialogDescription>{t("admin.addCategoryDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("admin.categoryName")}</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t("admin.categoryNamePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">{t("admin.categorySlug")}</Label>
              <Input
                id="slug"
                value={newCategory.slug}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, slug: e.target.value })
                }
                placeholder={t("admin.categorySlugPlaceholder")}
              />
              <p className="text-sm text-gray-500">
                {t("admin.categorySlugDesc")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateCategory}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.editCategory")}</DialogTitle>
            <DialogDescription>{t("admin.editCategoryDesc")}</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("admin.categoryName")}</Label>
                <Input
                  id="edit-name"
                  value={editingCategory.name}
                  onChange={(e) => handleNameChange(e.target.value, false)}
                  placeholder={t("admin.categoryNamePlaceholder")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">{t("admin.categorySlug")}</Label>
                <Input
                  id="edit-slug"
                  value={editingCategory.slug}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      slug: e.target.value,
                    })
                  }
                  placeholder={t("admin.categorySlugPlaceholder")}
                />
                <p className="text-sm text-gray-500">
                  {t("admin.categorySlugDesc")}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateCategory}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("admin.confirmDeleteCategoryDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteCategory(deleteConfirmId)}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCategoriesPage;