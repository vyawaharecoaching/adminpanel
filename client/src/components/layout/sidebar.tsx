import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { 
  Home, Users, GraduationCap, CalendarCheck, FileText, 
  Banknote, Settings, ChevronDown, ChevronUp, UserPlus,
  BarChart
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
  return (
    <Link href={href} className={cn(
      "flex items-center px-4 py-3 my-1 rounded cursor-pointer transition-colors",
      active 
        ? "bg-primary/10 text-primary border-l-2 border-primary" 
        : "hover:bg-gray-100"
    )}>
      <div className="mr-3">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

const NavSection = ({ title, children }: NavSectionProps) => {
  return (
    <>
      <p className="px-4 py-2 mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
      {children}
    </>
  );
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [academicExpanded, setAcademicExpanded] = useState(true);
  const [financeExpanded, setFinanceExpanded] = useState(true);

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const isTeacher = user.role === "teacher";
  const isStudent = user.role === "student";

  const toggleAcademic = () => setAcademicExpanded(!academicExpanded);
  const toggleFinance = () => setFinanceExpanded(!financeExpanded);

  return (
    <div
      className={cn(
        "bg-background shadow-md h-full overflow-y-auto transition-all z-30",
        isOpen ? "fixed inset-0 w-64 md:relative" : "hidden md:block md:w-64"
      )}
    >
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-semibold text-primary">Vyawahare Coaching Classes</h1>
      </div>

      <div className="px-2 py-4">
        <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Main
        </p>

        <NavItem 
          href="/" 
          icon={<Home className="h-5 w-5" />} 
          label="Dashboard" 
          active={location === "/"} 
        />

        <NavItem 
          href="/students" 
          icon={<Users className="h-5 w-5" />} 
          label="Students" 
          active={location === "/students"} 
        />

        {(isAdmin || isTeacher) && (
          <NavItem 
            href="/teachers" 
            icon={<GraduationCap className="h-5 w-5" />} 
            label="Teachers" 
            active={location === "/teachers"} 
          />
        )}

        <div className="flex items-center px-4 py-2 mt-4 justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Academic
          </p>
          <button onClick={toggleAcademic} className="text-muted-foreground">
            {academicExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {academicExpanded && (
          <>
            <NavItem 
              href="/attendance" 
              icon={<CalendarCheck className="h-5 w-5" />} 
              label="Attendance" 
              active={location === "/attendance"} 
            />
            
            <NavItem 
              href="/test-results" 
              icon={<FileText className="h-5 w-5" />} 
              label="Test Results" 
              active={location === "/test-results"} 
            />
          </>
        )}

        <div className="flex items-center px-4 py-2 mt-4 justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Finance
          </p>
          <button onClick={toggleFinance} className="text-muted-foreground">
            {financeExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {financeExpanded && (
          <>
            {(isAdmin || isTeacher) && (
              <NavItem 
                href="/installments" 
                icon={<Banknote className="h-5 w-5" />} 
                label="Installments" 
                active={location === "/installments"} 
              />
            )}
            
            {/* Reports link - Admin only */}
            {isAdmin && (
              <NavItem 
                href="/reports" 
                icon={<BarChart className="h-5 w-5" />} 
                label="Reports" 
                active={location === "/reports"} 
              />
            )}
          </>
        )}

        <NavSection title="Settings">
          <NavItem 
            href="/account-settings" 
            icon={<Settings className="h-5 w-5" />} 
            label="Account Settings" 
            active={location === "/account-settings"} 
          />
        </NavSection>
      </div>
    </div>
  );
};

export default Sidebar;
