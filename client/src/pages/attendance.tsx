import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance, InsertAttendance } from "@shared/schema";
import { PageContainer } from "@/components/layout/page-container";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader2, PlusCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Schema for attendance filtering
const filterSchema = z.object({
  classId: z.string().optional(),
  date: z.date().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

// Schema for recording attendance
const attendanceSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  studentId: z.string().min(1, "Student is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  status: z.enum(["present", "absent", "late"], {
    required_error: "Status is required",
  }),
});

type AttendanceValues = z.infer<typeof attendanceSchema>;

export default function AttendancePage() {
  const [currentTab, setCurrentTab] = useState<string>("view");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get classes for dropdown
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return await res.json();
    },
  });

  // Get students for dropdown
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/users/student"],
    queryFn: async () => {
      const res = await fetch("/api/users/student");
      if (!res.ok) throw new Error("Failed to fetch students");
      return await res.json();
    },
  });

  // Get attendance records based on filters
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["/api/attendance", selectedClass, selectedDate],
    queryFn: async () => {
      let url = "/api/attendance";
      const params = new URLSearchParams();
      
      if (selectedClass) {
        params.append("classId", selectedClass);
      }
      
      if (selectedDate) {
        params.append("date", format(selectedDate, "yyyy-MM-dd"));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch attendance data");
      return await res.json() as Attendance[];
    },
    enabled: !!selectedDate || !!selectedClass,
  });

  // Record single attendance mutation
  const recordAttendanceMutation = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      const res = await apiRequest("POST", "/api/attendance", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance recorded",
        description: "The attendance has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      attendanceForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record attendance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/attendance/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Attendance updated",
        description: "The attendance status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update attendance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup for attendance
  const attendanceForm = useForm<AttendanceValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      classId: "",
      studentId: "",
      date: new Date(),
      status: "present",
    },
  });

  // Filter form setup
  const filterForm = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      classId: "",
      date: new Date(),
    },
  });

  const onSubmitAttendance = (data: AttendanceValues) => {
    recordAttendanceMutation.mutate({
      classId: parseInt(data.classId),
      studentId: parseInt(data.studentId),
      date: data.date as unknown as string, // TypeScript workaround
      status: data.status,
    });
  };

  const onSubmitFilter = (data: FilterValues) => {
    setSelectedClass(data.classId || "");
    setSelectedDate(data.date);
    refetchAttendance();
  };

  const handleStatusChange = (id: number, status: string) => {
    updateAttendanceMutation.mutate({ id, status });
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'PPP');
  };

  // Check if user can edit attendance (admin or teacher)
  const canEditAttendance = user?.role === "admin" || user?.role === "teacher";

  // Class grades for filtering
  const grades = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <PageContainer
      title="Attendance Management"
      subtitle="Track and manage daily attendance for classes 5th to 12th"
    >
      <Tabs defaultValue="view" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="view">View Attendance</TabsTrigger>
          {canEditAttendance && (
            <TabsTrigger value="record">Record Attendance</TabsTrigger>
          )}
        </TabsList>

        {/* View Attendance Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                View and filter attendance records by class and date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...filterForm}>
                <form 
                  onSubmit={filterForm.handleSubmit(onSubmitFilter)} 
                  className="flex flex-col gap-6 mb-6"
                >
                  <div className="w-full">
                    <p className="mb-2 font-medium text-lg">Select Class:</p>
                    <div className="bg-purple-100 p-4 rounded-md">
                      <div className="grid grid-cols-4 gap-3">
                        {grades.map((grade) => (
                          <div key={grade} className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              id={`grade-${grade}`} 
                              name="grade" 
                              className="h-4 w-4 text-purple-600"
                              onChange={() => filterForm.setValue('classId', grade)}
                              checked={filterForm.watch('classId') === grade}
                            />
                            <label htmlFor={`grade-${grade}`} className="text-sm font-medium">{grade}</label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <FormField
                          control={filterForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-purple-900 font-medium">Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit"
                        className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>

              {attendanceLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {attendanceData && attendanceData.length > 0 ? (
                    attendanceData.map((record) => (
                      <div key={record.id} className="bg-purple-700 rounded-lg overflow-hidden shadow-md">
                        <div className="p-4 text-white flex items-start">
                          <div className="w-16 h-16 bg-purple-900 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                            <img 
                              src={`https://i.pravatar.cc/150?u=${record.studentId}`} 
                              alt="Student" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1">
                              <p className="font-medium text-lg">Name: {studentsData?.find((s: any) => s.id === record.studentId)?.fullName || `Student ${record.studentId}`}</p>
                              <p className="text-sm">Roll No: {record.studentId}</p>
                              <p className="text-sm">Class: {record.classId}</p>
                            </div>
                            
                            <div className="flex space-x-8 mt-3">
                              <div className="flex items-center">
                                <input 
                                  type="radio" 
                                  id={`present-${record.id}`} 
                                  name={`attendance-${record.id}`} 
                                  checked={record.status === "present"}
                                  onChange={() => handleStatusChange(record.id, "present")}
                                  className="h-4 w-4 mr-2"
                                />
                                <label htmlFor={`present-${record.id}`} className="text-sm">Present</label>
                              </div>
                              <div className="flex items-center">
                                <input 
                                  type="radio" 
                                  id={`absent-${record.id}`} 
                                  name={`attendance-${record.id}`} 
                                  checked={record.status === "absent"}
                                  onChange={() => handleStatusChange(record.id, "absent")}
                                  className="h-4 w-4 mr-2"
                                />
                                <label htmlFor={`absent-${record.id}`} className="text-sm">Absent</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-800 py-2 px-4 flex justify-end">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                            onClick={() => toast({
                              title: "Attendance saved",
                              description: "Student attendance has been updated."
                            })}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-purple-800 font-medium">No attendance records found for the selected filters.</p>
                      <p className="text-purple-600 text-sm mt-2">Try selecting a different class or date.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Record Attendance Tab */}
        {canEditAttendance && (
          <TabsContent value="record">
            <Card>
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-900">Record Attendance</CardTitle>
                <CardDescription>
                  Record attendance for students by class
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium">Class</label>
                      <Select 
                        onValueChange={(value) => setSelectedClass(value)}
                        value={selectedClass}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full mt-1 pl-3 text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            {selectedDate ? (
                              format(selectedDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {selectedClass && selectedDate && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Class {selectedClass} Attendance for {format(selectedDate, "PPP")}</h3>
                      
                      {studentsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                      ) : studentsData && studentsData.length > 0 ? (
                        <div className="space-y-4 mt-4">
                          {studentsData.map((student: any) => (
                            <div key={student.id} className="bg-purple-700 rounded-lg overflow-hidden shadow-md">
                              <div className="p-4 text-white flex items-start">
                                <div className="w-16 h-16 bg-purple-900 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                                  <img 
                                    src={`https://i.pravatar.cc/150?u=${student.id}`} 
                                    alt="Student" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="mb-1">
                                    <p className="font-medium text-lg">{student.fullName}</p>
                                    <p className="text-sm">Roll No: {student.id}</p>
                                    <p className="text-sm">Class: {selectedClass}</p>
                                  </div>
                                  
                                  <div className="flex space-x-8 mt-3">
                                    <div className="flex items-center">
                                      <input 
                                        type="radio" 
                                        id={`present-${student.id}`} 
                                        name={`attendance-${student.id}`} 
                                        className="h-4 w-4 mr-2"
                                        checked={
                                          attendanceData?.find(a => 
                                            a.studentId === student.id && 
                                            a.classId === parseInt(selectedClass) && 
                                            format(new Date(a.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                          )?.status === "present"
                                        }
                                        onChange={() => {
                                          const existingRecord = attendanceData?.find(a => 
                                            a.studentId === student.id && 
                                            a.classId === parseInt(selectedClass) && 
                                            format(new Date(a.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                          );
                                          
                                          if (existingRecord) {
                                            handleStatusChange(existingRecord.id, "present");
                                          } else {
                                            recordAttendanceMutation.mutate({
                                              studentId: student.id,
                                              classId: parseInt(selectedClass),
                                              date: selectedDate as unknown as string,
                                              status: "present"
                                            });
                                          }
                                        }}
                                      />
                                      <label htmlFor={`present-${student.id}`} className="text-sm">Present</label>
                                    </div>
                                    <div className="flex items-center">
                                      <input 
                                        type="radio" 
                                        id={`absent-${student.id}`} 
                                        name={`attendance-${student.id}`}
                                        className="h-4 w-4 mr-2" 
                                        checked={
                                          attendanceData?.find(a => 
                                            a.studentId === student.id && 
                                            a.classId === parseInt(selectedClass) && 
                                            format(new Date(a.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                          )?.status === "absent"
                                        }
                                        onChange={() => {
                                          const existingRecord = attendanceData?.find(a => 
                                            a.studentId === student.id && 
                                            a.classId === parseInt(selectedClass) && 
                                            format(new Date(a.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                          );
                                          
                                          if (existingRecord) {
                                            handleStatusChange(existingRecord.id, "absent");
                                          } else {
                                            recordAttendanceMutation.mutate({
                                              studentId: student.id,
                                              classId: parseInt(selectedClass),
                                              date: selectedDate as unknown as string,
                                              status: "absent"
                                            });
                                          }
                                        }}
                                      />
                                      <label htmlFor={`absent-${student.id}`} className="text-sm">Absent</label>
                                    </div>
                                    <div className="flex items-center">
                                      <input 
                                        type="radio" 
                                        id={`late-${student.id}`} 
                                        name={`attendance-${student.id}`}
                                        className="h-4 w-4 mr-2" 
                                        checked={
                                          attendanceData?.find(a => 
                                            a.studentId === student.id && 
                                            a.classId === parseInt(selectedClass) && 
                                            format(new Date(a.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                          )?.status === "late"
                                        }
                                        onChange={() => {
                                          const existingRecord = attendanceData?.find(a => 
                                            a.studentId === student.id && 
                                            a.classId === parseInt(selectedClass) && 
                                            format(new Date(a.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                                          );
                                          
                                          if (existingRecord) {
                                            handleStatusChange(existingRecord.id, "late");
                                          } else {
                                            recordAttendanceMutation.mutate({
                                              studentId: student.id,
                                              classId: parseInt(selectedClass),
                                              date: selectedDate as unknown as string,
                                              status: "late"
                                            });
                                          }
                                        }}
                                      />
                                      <label htmlFor={`late-${student.id}`} className="text-sm">Late</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-purple-800 font-medium">No students found in this class.</p>
                          <p className="text-purple-600 text-sm mt-2">Please add students to this class first.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}