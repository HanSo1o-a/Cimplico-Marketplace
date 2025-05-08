import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  Menu, 
  Search, 
  Heart, 
  ShoppingCart, 
  User, 
  LogOut, 
  FileText, 
  ChevronDown, 
  Settings, 
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/store/useCartStore";
import { useQuery } from "@tanstack/react-query";

const Header = () => {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartItems = useCartStore((state) => state.items);
  const itemsCount = useCartStore((state) => state.getItemsCount());

  // 分类数据
  const { data: categoriesData = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  // Track scroll position for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  const renderUserActions = () => {
    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 focus:ring-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-primary-100 text-primary-700">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline font-medium">{user.firstName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              {t("user.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/profile?tab=orders")}>
              <FileText className="mr-2 h-4 w-4" />
              {t("user.orders")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/profile?tab=favorites")}>
              <Heart className="mr-2 h-4 w-4" />
              {t("user.favorites")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/profile?tab=settings")}>
              <Settings className="mr-2 h-4 w-4" />
              {t("user.settings")}
            </DropdownMenuItem>

            {user.role === "VENDOR" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/vendor-dashboard")}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t("vendor.dashboard")}
                </DropdownMenuItem>
              </>
            )}

            {user.role === "ADMIN" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin-dashboard")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("admin.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/products")}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t("admin.products")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/orders")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t("admin.orders")}
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
          onClick={() => navigate("/auth")}
        >
          {t("auth.login")}
        </Button>
        <Button 
          size="sm" 
          className="bg-primary-500 hover:bg-primary-600 text-white"
          onClick={() => navigate("/auth?tab=register")}
        >
          {t("auth.register")}
        </Button>
      </div>
    );
  };

  return (
    <header className={`sticky top-0 z-40 w-full ${isScrolled ? 'shadow-md' : ''}`}>
      {/* Top Bar */}
      <div className="bg-neutral-800 text-neutral-100 text-sm py-1 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <LanguageSwitcher />
          <div className="hidden md:flex gap-4 text-neutral-300">
            {user && user.role === "ADMIN" && (
              <>
                <a 
                  href="/admin" 
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded-sm transition-colors flex items-center"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {t("admin.adminPanel")}
                </a>
                <span>|</span>
              </>
            )}
            <a href="#" className="hover:text-white transition-colors">{t("nav.help")}</a>
            <span>|</span>
            <a href="#" className="hover:text-white transition-colors">{t("nav.about")}</a>
            <span>|</span>
            <a href="#" className="hover:text-white transition-colors">{t("nav.contact")}</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="font-heading font-bold text-2xl text-primary-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.906 9c.382 0 .749.057 1.094.162V4a1 1 0 0 0-1-1h-10a1 1 0 0 0-.707.293l-4 4A1 1 0 0 0 5 8v11a1 1 0 0 0 1 1h7.277c-.368-.487-.714-1.002-1.015-1.547L10 18H7v-2h2.053c-.243-1.679-.243-3.321 0-5H7v-2h2.662c1.142-1.822 2.595-3.406 4.597-4.581 1.051-.616 2.036-1.063 3.14-1.377a7.866 7.866 0 0 1 2.507-.326V4h-7.586l-3-3H20.906V9zm-10.2-3H6.414l3-3h.292v3z"/>
                  <circle cx="19.906" cy="13" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                Cimplico <span className="text-neutral-500">Marketplace</span>
              </Link>
            </div>

            {/* Search Bar - Hidden on Mobile */}
            <div className="hidden md:block flex-grow mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder={t("common.search") + "..."}
                  className="w-full py-2 pl-10 pr-16 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                <Button 
                  type="submit" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-white py-1 px-3 h-8"
                >
                  {t("common.search")}
                </Button>
              </form>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Toggle */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden text-neutral-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>

              {/* Desktop User Actions */}
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/profile?tab=favorites">
                  <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-primary-600 transition-colors">
                    <Heart className="h-5 w-5" />
                    <span className="sr-only">{t("user.favorites")}</span>
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-primary-600 transition-colors relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">{t("cart.title")}</span>
                    {itemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {itemsCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                {/* Login/Register or User Menu */}
                {renderUserActions()}
              </div>
            </div>
          </div>

          {/* Mobile Search - Visible only on Mobile */}
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder={t("common.search") + "..."}
                className="w-full py-2 pl-10 pr-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            </form>
          </div>

          {/* Main Navigation */}
          <nav className="hidden md:block border-t border-neutral-200">
            <ul className="flex space-x-8 py-3">
              <li>
                <Link href="/">
                  <span className="text-neutral-600 hover:text-primary-600 font-medium pb-3 hover:border-b-2 hover:border-primary-500 transition-colors">
                    {t("nav.home")}
                  </span>
                </Link>
              </li>
              <li className="relative group">
                <Link href="/marketplace">
                  <span className="text-neutral-600 hover:text-primary-600 font-medium pb-3 group-hover:border-b-2 group-hover:border-primary-500 transition-colors flex items-center">
                    {t("nav.categories")} <ChevronDown className="ml-1 h-4 w-4" />
                  </span>
                </Link>
                <div className="absolute left-0 top-full bg-white shadow-lg rounded-lg w-64 hidden group-hover:block z-50">
                  <ul className="py-2">
                    {isCategoriesLoading ? (
                      <li className="px-4 py-2 text-neutral-400">加载分类中...</li>
                    ) : categoriesData.length === 0 ? (
                      <li className="px-4 py-2 text-neutral-400">暂无分类</li>
                    ) : (
                      categoriesData.map((cat: any) => (
                        <li key={cat.id}>
                          <Link href={`/marketplace?category=${encodeURIComponent(cat.name)}`}>
                            <span className="block px-4 py-2 hover:bg-neutral-100">
                              {cat.name}
                            </span>
                          </Link>
                        </li>
                      ))
                    )}
                    <li>
                      <Link href="/marketplace">
                        <span className="block px-4 py-2 hover:bg-neutral-100">查看全部分类</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <Link href="/marketplace?featured=true">
                  <span className="text-neutral-600 hover:text-primary-600 font-medium pb-3 hover:border-b-2 hover:border-primary-500 transition-colors">
                    {t("home.featured.title")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?vendors=true">
                  <span className="text-neutral-600 hover:text-primary-600 font-medium pb-3 hover:border-b-2 hover:border-primary-500 transition-colors">
                    {t("nav.vendors")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?newArrivals=true">
                  <span className="text-neutral-600 hover:text-primary-600 font-medium pb-3 hover:border-b-2 hover:border-primary-500 transition-colors">
                    {t("nav.newArrivals")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?freeOnly=true">
                  <span className="text-neutral-600 hover:text-primary-600 font-medium pb-3 hover:border-b-2 hover:border-primary-500 transition-colors">
                    {t("nav.freeResources")}
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-neutral-200 shadow-md">
            <ul className="py-2">
              <li>
                <Link href="/">
                  <span className="block px-4 py-2 text-primary-600 font-medium">
                    {t("nav.home")}
                  </span>
                </Link>
              </li>
              <li>
                <div className="px-4 py-2 flex justify-between items-center cursor-pointer" onClick={() => {}}>
                  <span className="text-neutral-800 font-medium">{t("nav.categories")}</span>
                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                </div>
                <div className="bg-neutral-50">
                  <ul>
                    {isCategoriesLoading ? (
                      <li className="px-6 py-2 text-neutral-400">加载分类中...</li>
                    ) : categoriesData.length === 0 ? (
                      <li className="px-6 py-2 text-neutral-400">暂无分类</li>
                    ) : (
                      categoriesData.map((cat: any) => (
                        <li key={cat.id}>
                          <Link href={`/marketplace?category=${encodeURIComponent(cat.name)}`}>
                            <span className="block px-6 py-2 hover:bg-neutral-100">
                              {cat.name}
                            </span>
                          </Link>
                        </li>
                      ))
                    )}
                    <li>
                      <Link href="/marketplace">
                        <span className="block px-6 py-2 hover:bg-neutral-100">查看全部分类</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <Link href="/marketplace?featured=true">
                  <span className="block px-4 py-2 text-neutral-800 font-medium">
                    {t("home.featured.title")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?vendors=true">
                  <span className="block px-4 py-2 text-neutral-800 font-medium">
                    {t("nav.vendors")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?newArrivals=true">
                  <span className="block px-4 py-2 text-neutral-800 font-medium">
                    {t("nav.newArrivals")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?freeOnly=true">
                  <span className="block px-4 py-2 text-neutral-800 font-medium">
                    {t("nav.freeResources")}
                  </span>
                </Link>
              </li>
              
              {/* User actions for mobile */}
              <li className="border-t border-neutral-200 mt-2 pt-2">
                <Link href="/profile?tab=favorites">
                  <span className="block px-4 py-2 text-neutral-800 font-medium">
                    <Heart className="inline-block mr-2 h-5 w-5" />
                    {t("user.favorites")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/cart">
                  <span className="block px-4 py-2 text-neutral-800 font-medium">
                    <ShoppingCart className="inline-block mr-2 h-5 w-5" />
                    {t("cart.title")}
                    {itemsCount > 0 && (
                      <span className="ml-2 bg-primary-500 text-white text-xs font-bold rounded-full px-2 py-1">
                        {itemsCount}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
              
              {user ? (
                <>
                  <li className="border-t border-neutral-200 mt-2 pt-2">
                    <Link href="/profile">
                      <span className="block px-4 py-2 text-neutral-800 font-medium">
                        <User className="inline-block mr-2 h-5 w-5" />
                        {t("user.profile")}
                      </span>
                    </Link>
                  </li>
                  {user.role === "VENDOR" && (
                    <li>
                      <Link href="/vendor-dashboard">
                        <span className="block px-4 py-2 text-neutral-800 font-medium">
                          <FileText className="inline-block mr-2 h-5 w-5" />
                          {t("vendor.dashboard")}
                        </span>
                      </Link>
                    </li>
                  )}
                  {user.role === "ADMIN" && (
                    <li>
                      <Link href="/admin-dashboard">
                        <span className="block px-4 py-2 text-neutral-800 font-medium">
                          <Settings className="inline-block mr-2 h-5 w-5" />
                          {t("admin.dashboard")}
                        </span>
                      </Link>
                    </li>
                  )}
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-500 font-medium"
                    >
                      <LogOut className="inline-block mr-2 h-5 w-5" />
                      {t("auth.logout")}
                    </button>
                  </li>
                </>
              ) : (
                <li className="border-t border-neutral-200 mt-2 pt-2 flex px-4 py-2 space-x-2">
                  <Button 
                    variant="outline" 
                    className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white flex-1"
                    onClick={() => navigate("/auth")}
                  >
                    {t("auth.login")}
                  </Button>
                  <Button 
                    className="bg-primary-500 text-white flex-1"
                    onClick={() => navigate("/auth?tab=register")}
                  >
                    {t("auth.register")}
                  </Button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
