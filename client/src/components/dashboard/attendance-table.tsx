"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
import { supabase } from "@/lib/supabase";

interface RawAttendance {
  class_id: string;
  date: string;
  status: "present" | "absent";
}

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
    queryKey: ["attendance"],
    queryFn: async (): Promise<RawAttendance[]> => {
      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("attendance")
        .select("class_id, date, status")
        .eq("date", today);

      if (error) throw new Error(error.message);
      return data || [];
    },
    onSuccess: (data: RawAttendance[]) => {
      const classSummary = data.reduce((acc, record) => {
        if (!acc[record.class_id]) {
          acc[record.class_id] = {
            present: 0,
            absent: 0,
            date: record.date,
            className: `Class ${record.class_id}`,
          };
        }

        if (record.status === "present") acc[record.class_id].present += 1;
        else acc[record.class_id].absent += 1;

        return acc;
      }, {} as Record<string, { present: number; absent: number; date: string; className: string }>);

      const records = Object.entries(classSummary).map(([classId, summary], index) => {
        const total = summary.present + summary.absent;
        const rate = total > 0 ? Math.round((summary.present / total) * 100) : 0;

        return {
          id: index + 1,
          date: summary.date,
          className: summary.className,
          present: summary.present,
          absent: summary.absent,
          rate,
        };
      });

      setAttendanceRecords(records);
    },
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
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead />
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
              <TableHead />
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
                        value={record.rate}
                        className={`w-16 h-2 ${getProgressColor(record.rate)}`}
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
