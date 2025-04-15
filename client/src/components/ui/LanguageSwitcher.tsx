import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguageStore } from "@/store/useLanguageStore";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "zh", name: "简体中文" },
    { code: "en", name: "English" }
  ];

  // Get the current language name
  const getCurrentLanguageName = () => {
    return languages.find(lang => lang.code === language)?.name || languages[0].name;
  };

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-neutral-100 hover:text-white flex items-center gap-1 px-1 h-7"
        >
          <Globe className="h-4 w-4" />
          <span className="text-sm">{getCurrentLanguageName()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={menuRef}
        className="w-36 bg-neutral-800 border-neutral-700"
        align="start"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`text-neutral-100 hover:text-white hover:bg-neutral-700 cursor-pointer ${
              lang.code === language ? "bg-primary-600 text-white" : ""
            }`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
