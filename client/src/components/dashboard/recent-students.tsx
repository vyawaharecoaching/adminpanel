import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const RecentStudents = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to fetch students data");
      return await res.json();
    }
  });

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0] || '')
      .join('')
      .toUpperCase();
  };

  const getRecentJoinDate = (joinDate: string) => {
    try {
      return format(parseISO(joinDate), 'MMM d, yyyy');
    } catch (e) {
      console.error("Invalid date format:", joinDate);
      return "Joined recently";
    }
  };

  // Get recent students (sorted by join date, newest first, then take first 5)
  const recentStudents = data?.data
    ? [...data.data]
        .filter(student => student?.created_at)
        .sort((a, b) => {
          try {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          } catch (e) {
            return 0;
          }
        })
        .slice(0, 5)
    : [];

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Recent Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg">
            <p className="text-red-500 font-medium">Error loading student data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background  flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Students</CardTitle>
          <Badge variant="outline" className="text-sm font-normal">
            {recentStudents.length} New
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          <ul className="space-y-4">
            {recentStudents.length > 0 ? (
              recentStudents.map((student) => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  getInitials={getInitials} 
                  getRecentJoinDate={getRecentJoinDate} 
                />
              ))
            ) : (
              <li className="flex flex-col items-center justify-center py-8">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No students registered yet</p>
                <p className="text-sm text-gray-400 mt-1">New students will appear here</p>
              </li>
            )}
          </ul>
        </div>
        
        <Link href="/students" className="mt-4">
          <Button variant="outline" className="w-full">
            View All Students
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <Card className="bg-background">
    <CardHeader>
      <Skeleton className="h-7 w-30" />
    </CardHeader>
    <CardContent>
      <ul className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Skeleton className="h-10 w-full mt-6" />
    </CardContent>
  </Card>
);

// Student Card Component
const StudentCard = ({ student, getInitials, getRecentJoinDate }) => (
  <li className="group">
    <div className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 group-hover:bg-gray-50">
      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-gray-700">
          {getInitials(student.full_name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {student.full_name || "Unknown"}
            </h3>
            <p className="text-xs text-gray-500">
              Joined {getRecentJoinDate(student.created_at)}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View
          </Button>
        </div>
        
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
          {student.last_exam_class && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              <span>Class: {student.last_exam_class}</span>
            </div>
          )}
          
          {student.subjects?.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              <span className="truncate">
                {student.subjects.slice(0, 3).join(', ')}
                {student.subjects.length > 3 && '...'}
              </span>
            </div>
          )}
          
          {student.school_or_college && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </span>
              <span className="truncate">{student.school_or_college}</span>
            </div>
          )}
          
          {student.gender && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <span className="capitalize">{student.gender}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </li>
);

export default RecentStudents;