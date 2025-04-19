import { useAuth } from "@/hooks/use-auth";
import { PageContainer } from "@/components/layout/page-container";
import { StatCard } from "@/components/dashboard/stat-card";
import { AttendanceTable } from "@/components/dashboard/attendance-table";
import { TestResultsTable } from "@/components/dashboard/test-results-table";
import { PaymentStatus } from "@/components/dashboard/payment-status";
import { RecentStudents } from "@/components/dashboard/recent-students";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { 
  Users, CalendarCheck, CheckCircle, Banknote
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isAdmin = user.role === "admin";
  const isTeacher = user.role === "teacher";
  
  const roleSpecificTitle = () => {
    switch (user.role) {
      case "admin":
        return "Admin Dashboard";
      case "teacher":
        return "Teacher Dashboard";
      default:
        return "Dashboard";
    }
  };

  return (
    <PageContainer
      title={roleSpecificTitle()}
      subtitle="Overview of school performance and statistics"
    >
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(isAdmin || isTeacher) && (
          <StatCard
            title="Total Students"
            value="462"
            icon={Users}
            change={{ value: "12%", trend: "up", text: "vs last month" }}
            color="primary"
          />
        )}
        
        <StatCard
          title="Attendance Rate"
          value="92%"
          icon={CalendarCheck}
          change={{ value: "3%", trend: "up", text: "vs last month" }}
          color="secondary"
        />
        
        <StatCard
          title="Avg Test Score"
          value="78%"
          icon={CheckCircle}
          change={{ value: "2%", trend: "down", text: "vs last month" }}
          color="accent"
        />
        
        {(isAdmin || isTeacher) && (
          <StatCard
            title="Payment Rate"
            value="87%"
            icon={Banknote}
            change={{ value: "5%", trend: "up", text: "vs last month" }}
            color="primary"
          />
        )}
      </div>

      {/* Two Column Layout for Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <AttendanceTable />
          <TestResultsTable />
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Display payment status for admins and teachers */}
          {(isAdmin || isTeacher) && <PaymentStatus />}
          {/* Only admins can see recent students */}
          {isAdmin && <RecentStudents />}
          {/* Everyone can see upcoming events */}
          <UpcomingEvents />
        </div>
      </div>
    </PageContainer>
  );
}
