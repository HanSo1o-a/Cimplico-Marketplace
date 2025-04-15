import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { LayoutGrid } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  url: string;
}

const Categories = () => {
  const { t } = useTranslation();

  const categories: Category[] = [
    {
      id: "financial",
      name: t("categories.financial"),
      icon: "fa-file-invoice",
      count: 125,
      url: "/marketplace?category=financial"
    },
    {
      id: "audit",
      name: t("categories.audit"),
      icon: "fa-tasks",
      count: 98,
      url: "/marketplace?category=audit"
    },
    {
      id: "tax",
      name: t("categories.tax"),
      icon: "fa-calculator",
      count: 76,
      url: "/marketplace?category=tax"
    },
    {
      id: "compliance",
      name: t("categories.compliance"),
      icon: "fa-check-square",
      count: 54,
      url: "/marketplace?category=compliance"
    },
    {
      id: "analysis",
      name: t("categories.analysis"),
      icon: "fa-chart-line",
      count: 89,
      url: "/marketplace?category=analysis"
    },
    {
      id: "all",
      name: t("categories.all"),
      icon: "fa-th-list",
      count: 450,
      url: "/marketplace"
    }
  ];

  // Font Awesome script
  useEffect(() => {
    // Check if Font Awesome script is already loaded
    if (!document.querySelector('script[data-fa-src]')) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js';
      script.setAttribute('data-fa-src', 'true');
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-2xl font-bold mb-8 flex items-center">
          <LayoutGrid className="text-primary-500 mr-2 h-6 w-6" />
          {t("home.categories.title")}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={category.url}>
              <a className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center hover:shadow-md transition-all hover:border-primary-300 group">
                <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                  <i className={`fas ${category.icon} text-primary-600 text-2xl`}></i>
                </div>
                <h3 className="font-medium text-neutral-800">{category.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {category.count} {t("home.categories.products")}
                </p>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

import { useEffect } from "react";

export default Categories;
