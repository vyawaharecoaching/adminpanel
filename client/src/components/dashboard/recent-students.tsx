import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format, subDays } from "date-fns";

export const RecentStudents = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/users/student"],
    queryFn: async () => {
      const res = await fetch("/api/users/student");
      if (!res.ok) throw new Error("Failed to fetch students data");
      return await res.json() as User[];
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getRecentJoinDate = (joinDate: Date | string) => {
    const date = typeof joinDate === 'string' ? new Date(joinDate) : joinDate;
    return `Joined ${format(date, 'MMM d')}`;
  };

  // In a real app, we would sort by join date and limit to most recent
  // This is a simplified version
  const recentStudents = data?.slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="p-4">
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="py-3 flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-36 mt-1" />
                </div>
                <Skeleton className="h-6 w-12 ml-auto" />
              </li>
            ))}
          </ul>
          <Skeleton className="h-8 w-full mt-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Recent Students</h2>
        <p className="text-red-500">Error loading student data</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Recent Students</h2>
      </div>
      <div className="p-4">
        <ul className="divide-y divide-gray-200">
          {recentStudents?.length ? (
            recentStudents.map((student) => (
              <li key={student.id} className="py-3 flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {getInitials(student.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">{student.fullName}</p>
                  <p className="text-xs text-gray-600">
                    {student.grade ? `Grade ${student.grade} • ` : ''}
                    {getRecentJoinDate(student.joinDate)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto text-primary text-sm">
                  View
                </Button>
              </li>
            ))
          ) : (
            <li className="py-6 text-center text-gray-500">
              No students registered yet
            </li>
          )}
        </ul>
        <Link href="/students">
          <Button variant="ghost" className="w-full mt-2 text-primary text-sm font-medium">
            View All Students
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RecentStudents;
