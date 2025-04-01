import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Attendance } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: number;
  date: string;
  className: string;
  present: number;
  absent: number;
  rate: number;
}

export const AttendanceTable = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const { isLoading, error } = useQuery({
    queryKey: ["/api/attendance"],
    queryFn: async () => {
      const date = new Date();
      const dateString = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/attendance?date=${dateString}`);
      if (!res.ok) throw new Error("Failed to fetch attendance data");
      return await res.json() as Attendance[];
    },
    onSuccess: (data) => {
      // Process the attendance data to create record summaries
      // In a real app, this would likely be done on the server
      // This is a simplified example
      
      // Group by class and count present/absent
      const classSummary = data.reduce((acc, record) => {
        if (!acc[record.classId]) {
          acc[record.classId] = {
            present: 0,
            absent: 0,
            date: record.date,
            className: `Class ${record.classId}` // In a real app, we would fetch class names
          };
        }
        
        if (record.status === 'present') {
          acc[record.classId].present += 1;
        } else {
          acc[record.classId].absent += 1;
        }
        
        return acc;
      }, {} as Record<string, { present: number, absent: number, date: string | Date, className: string }>);
      
      // Convert to array format for display
      const records = Object.entries(classSummary).map(([classId, data], index) => {
        const total = data.present + data.absent;
        const rate = total > 0 ? Math.round((data.present / total) * 100) : 0;
        
        return {
          id: index + 1,
          date: typeof data.date === 'string' ? data.date : format(data.date, 'PPP'),
          className: data.className,
          present: data.present,
          absent: data.absent,
          rate
        };
      });
      
      setAttendanceRecords(records);
    }
  });

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return "bg-green-600";
    if (rate >= 80) return "bg-amber-500";
    return "bg-red-600";
  };

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Attendance</h2>
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Recent Attendance</h2>
        <p className="text-red-500">Error loading attendance data</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Attendance</h2>
          <Button variant="ghost" className="text-primary text-sm font-medium" size="sm">
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs text-gray-500 uppercase">Date</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Class</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Present</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Absent</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Rate</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceRecords.length > 0 ? (
              attendanceRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-gray-50">
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.className}</TableCell>
                  <TableCell>{record.present}</TableCell>
                  <TableCell>{record.absent}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span 
                        className={`mr-2 font-medium ${
                          record.rate >= 90 
                            ? "text-green-600" 
                            : record.rate >= 80 
                              ? "text-amber-500" 
                              : "text-red-600"
                        }`}
                      >
                        {record.rate}%
                      </span>
                      <Progress 
                        className="w-16 h-2" 
                        value={record.rate}
                        indicatorColor={getProgressColor(record.rate)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" className="text-primary" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No attendance records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendanceTable;
