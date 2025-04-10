import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { PageContainer } from "@/components/layout/page-container";
import { Loader2, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { User } from "@shared/schema";

export default function StudentProfilePage() {
  const { studentId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch student data
  const { data: student, isLoading: studentLoading, error } = useQuery({
    queryKey: [`/api/students/${studentId}`],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch student: ${errorText}`);
      }
      const data = await res.json() as User;
      console.log("Fetched student data:", data); // Log the fetched data
      return data;
    },
    enabled: !!studentId,
  });

  // Log errors if any
  useEffect(() => {
    if (error) {
      console.error("Error fetching student data:", error);
    }
  }, [error]);

  // Format date
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'PPP');
  };

  if (studentLoading) {
    return (
      <PageContainer title="Student Profile" subtitle="Loading...">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Student Profile" subtitle="Error loading student data">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600">There was an error loading the student profile.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!student) {
    return (
      <PageContainer title="Student Profile" subtitle="Student not found">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Student Not Found</h2>
            <p className="text-gray-600">The requested student profile could not be found.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${student.fullName}'s Profile`}
      subtitle={`Class: ${student.grade || 'Not assigned'} | ID: ${student.id}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Student Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-4xl font-bold mb-3">
                {student.fullName.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{student.fullName}</h3>
              <p className="text-gray-600">{student.email}</p>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Username</span>
                <span className="font-medium">{student.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role</span>
                <span className="font-medium capitalize">{student.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Join Date</span>
                <span className="font-medium">{formatDate(student.joinDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}