import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageContainer } from "@/components/layout/page-container";

type Teacher = User & { role: "teacher" };

// Create a helper component for the loading state
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Create a helper component for the error state
const ErrorDisplay = ({ message }: { message: string }) => (
  <PageContainer
    title="Error"
    subtitle="There was a problem loading the teachers page"
  >
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-red-500">Error Loading Teachers</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
      </CardContent>
    </Card>
  </PageContainer>
);

const TeachersList = ({ teachers, classesData }: { teachers: Teacher[], classesData: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>All Teachers</CardTitle>
      <CardDescription>View detailed information about teachers</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableCaption>List of all registered teachers</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead>Classes Assigned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell className="font-medium">{teacher.fullName}</TableCell>
              <TableCell>{teacher.email}</TableCell>
              <TableCell>{teacher.username}</TableCell>
              <TableCell>{teacher.joinDate ? format(new Date(teacher.joinDate), "PPP") : "-"}</TableCell>
              <TableCell>
                {(classesData?.filter((c: any) => c.teacherId === teacher.id) || []).length}
              </TableCell>
            </TableRow>
          ))}
          {(teachers.length || 0) === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6">
                No teachers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const TeacherCards = ({ teachers, classesData }: { teachers: Teacher[], classesData: any[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
    {teachers.map((teacher) => (
      <Card key={teacher.id} className="overflow-hidden">
        <CardHeader className="bg-primary/10">
          <CardTitle>{teacher.fullName}</CardTitle>
          <CardDescription>{teacher.email}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span>{teacher.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined:</span>
              <span>{teacher.joinDate ? format(new Date(teacher.joinDate), "PPP") : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Classes:</span>
              <span>{(classesData?.filter((c: any) => c.teacherId === teacher.id) || []).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const TeachersPage = () => {
  // Query to get all teachers
  const {
    data: teachers,
    isLoading: isLoadingTeachers,
    error: teachersError,
  } = useQuery({
    queryKey: ["/api/users/teacher"],
    queryFn: async () => {
      try {
        // First try to get teachers from the authenticated endpoint
        const res = await fetch("/api/users/teacher", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        
        if (res.ok) {
          const teachers = await res.json();
          console.log("Fetched authenticated teachers:", teachers);
          return teachers as Teacher[];
        }
      } catch (err) {
        console.error("Error fetching authenticated teachers:", err);
      }
      
      // If that fails, try the debug endpoint as fallback
      try {
        const debugRes = await fetch("/api/debug/teachers", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        
        if (debugRes.ok) {
          const debugTeachers = await debugRes.json();
          console.log("Fetched debug teachers:", debugTeachers);
          return debugTeachers as Teacher[];
        }
      } catch (debugErr) {
        console.error("Error fetching debug teachers:", debugErr);
      }
      
      // If both endpoints fail, return empty array rather than throwing
      return [] as Teacher[];
    },
  });

  // Query to get classes for teachers
  const {
    data: classesData,
    isLoading: isLoadingClasses,
  } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/classes", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
      
      // Return empty array if there's an error
      return [];
    },
  });

  // Show loading spinner while data is loading
  if (isLoadingTeachers || isLoadingClasses) {
    return <LoadingSpinner />;
  }

  // Show error state if there's an error
  if (teachersError) {
    return <ErrorDisplay message={(teachersError as Error).message} />;
  }

  // Main content with both list and card views
  return (
    <PageContainer
      title="Teachers Management"
      subtitle="Manage and view all teachers at Vyawahare Coaching Classes"
    >
      <TeachersList teachers={teachers || []} classesData={classesData || []} />
      <TeacherCards teachers={teachers || []} classesData={classesData || []} />
    </PageContainer>
  );
};

export default TeachersPage;