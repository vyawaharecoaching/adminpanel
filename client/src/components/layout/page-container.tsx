import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const PageContainer = ({ children, title, subtitle }: PageContainerProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageContainer;
