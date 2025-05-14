import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface FilterSidebarProps {
  currentCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  onFilterChange: (filters: Record<string, any>) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  currentCategory = "all",
  minPrice,
  maxPrice,
  onFilterChange,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    minPrice || 0,
    maxPrice || 1000,
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [categoryList, setCategoryList] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    axios.get("/api/categories").then((res) => {
      setCategoryList([
        { slug: "all", name: t("categories.all") },
        ...res.data.map((c: any) => ({ slug: c.slug, name: c.name })),
      ]);
    });
  }, [t]);

  // 应用过滤器
  const applyFilters = () => {
    onFilterChange({
      category: selectedCategory,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
      freeOnly: freeOnly ? true : undefined,
    });
  };

  // 重置过滤器
  const resetFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 1000]);
    setSelectedTags([]);
    setFreeOnly(false);

    onFilterChange({
      category: "all",
      minPrice: undefined,
      maxPrice: undefined,
      tags: undefined,
      freeOnly: undefined,
    });
  };

  // 处理标签选择
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 价格范围格式化
  const formatPriceLabel = (value: number) => {
    return value === 0 ? t("product.free") : `$${value}`;
  };

  // 内容分类列表
  const categories = categoryList;

  // 常用标签列表
  const popularTags = [
    "Tax",
    "Audit",
    "Finance",
    "Statement",
    "Individual income tax",
    "Corporate income tax",
    "Analyse",
    "Risk assessment",
  ];

  // 区域列表
  const regions = [
    { id: "china", name: t("regions.china") },
    { id: "hongKong", name: t("regions.hongKong") },
    { id: "taiwan", name: t("regions.taiwan") },
    { id: "global", name: t("regions.global") },
  ];

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">{t("product.filters")}</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          {t("product.reset")}
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["category", "price", "tags"]}>
        {/* 内容分类 */}
        <AccordionItem value="category">
          <AccordionTrigger>{t("product.contentType")}</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                onFilterChange({ category: val });
              }}
              className="space-y-2"
            >
              {categories.map((category) => (
                <div key={category.slug} className="flex items-center space-x-2">
                  <RadioGroupItem value={category.slug} id={`category-${category.slug}`} />
                  <Label htmlFor={`category-${category.slug}`}>{category.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* 价格范围 */}
        <AccordionItem value="price">
          <AccordionTrigger>{t("product.price")}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="free-only"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="free-only">{t("product.freeOnly")}</Label>
              </div>

              <div className="pt-4">
                <Slider
                  value={[priceRange[0], priceRange[1]]}
                  min={0}
                  max={1000}
                  step={10}
                  onValueChange={(value) => setPriceRange([value[0], value[1]])}
                  className="my-6"
                />

                <div className="flex justify-between">
                  <div>
                    <Label htmlFor="min-price">{t("product.min")}</Label>
                    <Input
                      id="min-price"
                      type="number"
                      min={0}
                      max={priceRange[1]}
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value), priceRange[1]])
                      }
                      className="mt-1 w-24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-price">{t("product.max")}</Label>
                    <Input
                      id="max-price"
                      type="number"
                      min={priceRange[0]}
                      max={1000}
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value)])
                      }
                      className="mt-1 w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 标签 */}
        <AccordionItem value="tags">
          <AccordionTrigger>{t("product.tags")}</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 区域 */}
        <AccordionItem value="region">
          <AccordionTrigger>{t("product.region")}</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value="china"
              className="space-y-2"
            >
              {regions.map((region) => (
                <div key={region.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={region.id} id={`region-${region.id}`} />
                  <Label htmlFor={`region-${region.id}`}>{region.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button className="w-full mt-6" onClick={applyFilters}>
        {t("product.applyFilters")}
      </Button>
    </div>
  );
};

export default FilterSidebar;