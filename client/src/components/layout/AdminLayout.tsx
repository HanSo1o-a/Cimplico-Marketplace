import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "../admin/AdminSidebar";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
  }, [location]);

  // Back to top button functionality
  useEffect(() => {
    const backToTopButton = document.getElementById('back-to-top-admin');
    
    const handleScroll = () => {
      if (backToTopButton) {
        if (window.scrollY > 300) {
          backToTopButton.classList.remove('opacity-0', 'invisible');
          backToTopButton.classList.add('opacity-100', 'visible');
        } else {
          backToTopButton.classList.add('opacity-0', 'invisible');
          backToTopButton.classList.remove('opacity-100', 'visible');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-6">
          <main className="bg-white rounded-lg shadow-sm p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Back to top button */}
      <Button
        id="back-to-top-admin"
        variant="primary"
        size="icon"
        className="fixed bottom-6 right-6 text-white rounded-full shadow-lg opacity-0 invisible transition-all z-50"
        onClick={scrollToTop}
      >
        <ChevronUp className="h-5 w-5" />
        <span className="sr-only">Back to top</span>
      </Button>
    </div>
  );
};

export default AdminLayout;