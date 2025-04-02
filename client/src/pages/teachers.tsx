import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
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

const TeachersPage = () => {
  // Query to get all teachers
  const {
    data: teachers,
    isLoading: isLoadingTeachers,
    error: teachersError,
    refetch: refetchTeachers,
  } = useQuery({
    queryKey: ["/api/users/teacher", Date.now()], // Add timestamp to force fresh data
    queryFn: async () => {
      // Try to get teachers from authenticated endpoint
      try {
        const res = await fetch("/api/users/teacher", {
          cache: "no-store", // Tell browser not to cache
          headers: { "Cache-Control": "no-cache" } // Force fresh data
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
      const debugRes = await fetch("/api/debug/teachers", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      
      if (!debugRes.ok) {
        throw new Error("Failed to fetch teachers from both endpoints");
      }
      
      const debugTeachers = await debugRes.json();
      console.log("Fetched debug teachers:", debugTeachers);
      return debugTeachers as Teacher[];
    },
  });

  // Query to get classes for teachers
  const {
    data: classesData,
    isLoading: isLoadingClasses,
  } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const res = await fetch("/api/classes");
      if (!res.ok) {
        throw new Error("Failed to fetch classes");
      }
      return await res.json();
    },
  });

  if (isLoadingTeachers || isLoadingClasses) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (teachersError) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-red-500">Error Loading Teachers</h1>
        <p>{(teachersError as Error).message}</p>
      </div>
    );
  }

  return (
    <PageContainer
      title="Teachers Management"
      subtitle="Manage and view all teachers at Vyawahare Coaching Classes"
    >
      {/* List View */}
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
              {teachers?.map((teacher) => (
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
              {(teachers?.length || 0) === 0 && (
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

      {/* Teacher Cards Grid (Alternative View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {teachers?.map((teacher) => (
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
    </PageContainer>
  );
};

export default TeachersPage;