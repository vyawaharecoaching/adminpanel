import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance, InsertAttendance } from "@shared/schema";
import { PageContainer } from "@/components/layout/page-container";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, Check, Loader2, PlusCircle, Search, X } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

// Schema for bulk attendance
const bulkAttendanceSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  studentStatuses: z.array(
    z.object({
      studentId: z.number(),
      studentName: z.string(),
      status: z.enum(["present", "absent", "late"]),
    })
  ),
});

type BulkAttendanceValues = z.infer<typeof bulkAttendanceSchema>;

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

  // Get students for bulk attendance
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

  // Bulk attendance mutation
  const bulkAttendanceMutation = useMutation({
    mutationFn: async (data: BulkAttendanceValues) => {
      // Convert to multiple attendance records
      const promises = data.studentStatuses.map(student => {
        return apiRequest("POST", "/api/attendance", {
          classId: parseInt(data.classId),
          studentId: student.studentId,
          date: data.date,
          status: student.status,
        });
      });
      
      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Bulk attendance recorded",
        description: "Attendance for all students has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      bulkAttendanceForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record bulk attendance",
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

  // Form setup for bulk attendance
  const bulkAttendanceForm = useForm<BulkAttendanceValues>({
    resolver: zodResolver(bulkAttendanceSchema),
    defaultValues: {
      classId: "",
      date: new Date(),
      studentStatuses: [],
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

  // Update the student statuses array when classId changes in bulk form
  const watchBulkClassId = bulkAttendanceForm.watch("classId");

  // Update studentStatuses when class or students data changes
  React.useEffect(() => {
    if (watchBulkClassId && studentsData) {
      // Reset studentStatuses with default values when class changes
      bulkAttendanceForm.setValue("studentStatuses", studentsData.map(student => ({
        studentId: student.id,
        studentName: student.fullName,
        status: "present",
      })));
    }
  }, [watchBulkClassId, studentsData, bulkAttendanceForm]);

  const onSubmitAttendance = (data: AttendanceValues) => {
    recordAttendanceMutation.mutate({
      classId: parseInt(data.classId),
      studentId: parseInt(data.studentId),
      date: data.date,
      status: data.status,
    });
  };

  const onSubmitBulkAttendance = (data: BulkAttendanceValues) => {
    bulkAttendanceMutation.mutate(data);
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Check if user can edit attendance (admin or teacher)
  const canEditAttendance = user?.role === "admin" || user?.role === "teacher";

  return (
    <PageContainer
      title="Attendance Management"
      subtitle="Track and manage student attendance records"
    >
      <Tabs defaultValue="view" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="view">View Attendance</TabsTrigger>
          {canEditAttendance && (
            <>
              <TabsTrigger value="record">Record Attendance</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Attendance</TabsTrigger>
            </>
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
                  className="flex flex-col sm:flex-row gap-4 mb-6"
                >
                  <FormField
                    control={filterForm.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Class</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All Classes</SelectItem>
                            {classesData?.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={filterForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Date</FormLabel>
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

                  <Button 
                    type="submit" 
                    className="mt-8"
                  >
                    Filter Records
                  </Button>
                </form>
              </Form>

              {attendanceLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        {canEditAttendance && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData?.length > 0 ? (
                        attendanceData.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.studentId}</TableCell>
                            <TableCell>{record.classId}</TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(record.status)}`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </TableCell>
                            {canEditAttendance && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleStatusChange(record.id, "present")}
                                    disabled={record.status === "present"}
                                  >
                                    <Check className="h-4 w-4 mr-1 text-green-600" />
                                    Present
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleStatusChange(record.id, "absent")}
                                    disabled={record.status === "absent"}
                                  >
                                    <X className="h-4 w-4 mr-1 text-red-600" />
                                    Absent
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleStatusChange(record.id, "late")}
                                    disabled={record.status === "late"}
                                  >
                                    <CalendarIcon className="h-4 w-4 mr-1 text-amber-500" />
                                    Late
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={canEditAttendance ? 5 : 4} className="text-center py-6 text-gray-500">
                            No attendance records found for the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Record Attendance Tab */}
        {canEditAttendance && (
          <TabsContent value="record">
            <Card>
              <CardHeader>
                <CardTitle>Record Attendance</CardTitle>
                <CardDescription>
                  Record attendance for individual students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...attendanceForm}>
                  <form onSubmit={attendanceForm.handleSubmit(onSubmitAttendance)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={attendanceForm.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classesData?.map((cls: any) => (
                                  <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={attendanceForm.control}
                        name="studentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a student" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {studentsData?.map((student: any) => (
                                  <SelectItem key={student.id} value={student.id.toString()}>
                                    {student.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={attendanceForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
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
                      
                      <FormField
                        control={attendanceForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="present">Present</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="late">Late</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={recordAttendanceMutation.isPending}
                    >
                      {recordAttendanceMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                      )}
                      Record Attendance
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Bulk Attendance Tab */}
        {canEditAttendance && (
          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Attendance</CardTitle>
                <CardDescription>
                  Record attendance for an entire class at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...bulkAttendanceForm}>
                  <form onSubmit={bulkAttendanceForm.handleSubmit(onSubmitBulkAttendance)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={bulkAttendanceForm.control}
                        name="classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classesData?.map((cls: any) => (
                                  <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bulkAttendanceForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
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
                    
                    {watchBulkClassId && (
                      <div className="rounded-md border mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bulkAttendanceForm.getValues().studentStatuses?.map((student, index) => (
                              <TableRow key={student.studentId}>
                                <TableCell>{student.studentName}</TableCell>
                                <TableCell>
                                  <Select 
                                    value={student.status}
                                    onValueChange={(value) => {
                                      const currentStudentStatuses = [...bulkAttendanceForm.getValues().studentStatuses];
                                      currentStudentStatuses[index].status = value as "present" | "absent" | "late";
                                      bulkAttendanceForm.setValue("studentStatuses", currentStudentStatuses);
                                    }}
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="present">Present</SelectItem>
                                      <SelectItem value="absent">Absent</SelectItem>
                                      <SelectItem value="late">Late</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={bulkAttendanceMutation.isPending || !watchBulkClassId}
                    >
                      {bulkAttendanceMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                      )}
                      Submit Bulk Attendance
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}
