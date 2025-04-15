import React from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// 支持的语言列表
const languages = [
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "en", name: "English", flag: "🇬🇧" }
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // 切换语言函数
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // 保存语言设置到 localStorage
    localStorage.setItem("i18nextLng", lng);
  };

  // 获取当前语言名称和旗帜
  const getCurrentLanguageInfo = () => {
    const lang = languages.find((l) => l.code === currentLanguage);
    return lang || languages[0]; // 默认返回第一个语言
  };

  const currentLang = getCurrentLanguageInfo();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-300 hover:text-white flex items-center"
        >
          <Globe className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline-block">
            {currentLang.flag} {currentLang.name}
          </span>
          <span className="sm:hidden">
            {currentLang.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>
              {lang.flag} {lang.name}
            </span>
            {currentLanguage === lang.code && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;