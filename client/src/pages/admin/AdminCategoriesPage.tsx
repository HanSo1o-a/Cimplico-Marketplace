import React from "react";
import { useTranslation } from "react-i18next";
import CategoryManager from "@/components/admin/CategoryManager";
import AdminLayout from "@/components/layout/AdminLayout";

const AdminCategoriesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">{t("admin.categoriesManagement")}</h1>
        <CategoryManager />
      </div>
    </AdminLayout>
  );
};

export default AdminCategoriesPage;