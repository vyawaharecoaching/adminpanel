import { useQuery, useMutation } from "@tanstack/react-query";
import { TestResult, InsertTestResult } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarIcon, FileEdit, Loader2, PlusCircle, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Schema for test results filtering
const filterSchema = z.object({
  classId: z.string().optional(),
  studentId: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

// Schema for recording test results
const resultSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  classId: z.string().min(1, "Class is required"),
  studentId: z.string().min(1, "Student is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  score: z.number().min(0, "Score must be greater than or equal to 0"),
  maxScore: z.number().min(1, "Maximum score must be greater than 0"),
  status: z.enum(["pending", "graded"], {
    required_error: "Status is required",
  }),
});

type ResultValues = z.infer<typeof resultSchema>;

// Schema for updating test results
const updateResultSchema = z.object({
  score: z.number().min(0, "Score must be greater than or equal to 0"),
  status: z.enum(["pending", "graded"], {
    required_error: "Status is required",
  }),
});

type UpdateResultValues = z.infer<typeof updateResultSchema>;

export default function TestResultsPage() {
  const [currentTab, setCurrentTab] = useState<string>("view");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get classes for dropdown
  const { data: classesData } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      return await res.json();
    },
  });

  // Get students for dropdown
  const { data: studentsData } = useQuery({
    queryKey: ["/api/users/student"],
    queryFn: async () => {
      const res = await fetch("/api/users/student");
      if (!res.ok) throw new Error("Failed to fetch students");
      return await res.json();
    },
  });

  // Get test results based on filters
  const {
    data: resultsData,
    isLoading: resultsLoading,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ["/api/test-results", selectedClass, selectedStudent],
    queryFn: async () => {
      let url = "/api/test-results";
      const params = new URLSearchParams();
      
      if (selectedClass) {
        params.append("classId", selectedClass);
      }
      
      if (selectedStudent) {
        params.append("studentId", selectedStudent);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch test results");
      return await res.json() as TestResult[];
    },
    enabled: !!selectedClass || !!selectedStudent,
  });

  // Create test result mutation
  const createResultMutation = useMutation({
    mutationFn: async (data: InsertTestResult) => {
      const res = await apiRequest("POST", "/api/test-results", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test result recorded",
        description: "The test result has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-results"] });
      resultForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record test result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update test result mutation
  const updateResultMutation = useMutation({
    mutationFn: async ({ id, score, status }: { id: number; score: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/test-results/${id}`, { score, status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Test result updated",
        description: "The test result has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-results"] });
      setIsUpdateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update test result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup for recording test results
  const resultForm = useForm<ResultValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      name: "",
      classId: "",
      studentId: "",
      date: new Date(),
      score: 0,
      maxScore: 100,
      status: "pending",
    },
  });

  // Form setup for updating test results
  const updateResultForm = useForm<UpdateResultValues>({
    resolver: zodResolver(updateResultSchema),
    defaultValues: {
      score: 0,
      status: "pending",
    },
  });

  // Form setup for filtering
  const filterForm = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      classId: "",
      studentId: "",
    },
  });

  const onSubmitResult = (data: ResultValues) => {
    createResultMutation.mutate({
      name: data.name,
      classId: parseInt(data.classId),
      studentId: parseInt(data.studentId),
      date: data.date,
      score: data.score,
      maxScore: data.maxScore,
      status: data.status,
    });
  };

  const onSubmitUpdateResult = (data: UpdateResultValues) => {
    if (!selectedResult) return;
    
    updateResultMutation.mutate({
      id: selectedResult.id,
      score: data.score,
      status: data.status,
    });
  };

  const onSubmitFilter = (data: FilterValues) => {
    setSelectedClass(data.classId || "");
    setSelectedStudent(data.studentId || "");
    refetchResults();
  };

  const openUpdateDialog = (result: TestResult) => {
    setSelectedResult(result);
    updateResultForm.reset({
      score: result.score,
      status: result.status as "pending" | "graded",
    });
    setIsUpdateDialogOpen(true);
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'PPP');
  };

  // Calculate percentage score
  const calculatePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  // Get color based on percentage
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-600";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-red-600";
  };

  // Check if user can create/edit test results (admin or teacher)
  const canManageResults = user?.role === "admin" || user?.role === "teacher";

  return (
    <PageContainer
      title="Test Results"
      subtitle="Manage and view student test performance"
    >
      <Tabs defaultValue="view" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="view">View Results</TabsTrigger>
          {canManageResults && (
            <TabsTrigger value="add">Add Results</TabsTrigger>
          )}
        </TabsList>

        {/* View Results Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                View and filter test results by class and student
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
                    name="studentId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
                            <SelectItem value="">All Students</SelectItem>
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

                  <Button 
                    type="submit" 
                    className="mt-8"
                  >
                    Filter Results
                  </Button>
                </form>
              </Form>

              {resultsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        {canManageResults && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultsData?.length > 0 ? (
                        resultsData.map((result) => {
                          const percentage = calculatePercentage(result.score, result.maxScore);
                          return (
                            <TableRow key={result.id}>
                              <TableCell>{result.name}</TableCell>
                              <TableCell>{result.classId}</TableCell>
                              <TableCell>{result.studentId}</TableCell>
                              <TableCell>{formatDate(result.date)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-2 font-medium">
                                    {result.score}/{result.maxScore} ({percentage}%)
                                  </span>
                                  <Progress 
                                    className="w-16 h-2" 
                                    value={percentage}
                                    indicatorColor={getScoreColor(percentage)}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={result.status === "graded" ? "success" : "outline"}>
                                  {result.status === "graded" ? "Graded" : "Pending"}
                                </Badge>
                              </TableCell>
                              {canManageResults && (
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openUpdateDialog(result)}
                                  >
                                    <FileEdit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={canManageResults ? 7 : 6} className="text-center py-6 text-gray-500">
                            No test results found for the selected filters.
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

        {/* Add Results Tab */}
        {canManageResults && (
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add Test Results</CardTitle>
                <CardDescription>
                  Record new test results for students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...resultForm}>
                  <form onSubmit={resultForm.handleSubmit(onSubmitResult)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={resultForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Test Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Midterm Exam" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={resultForm.control}
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
                        control={resultForm.control}
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
                        control={resultForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Test Date</FormLabel>
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
                        control={resultForm.control}
                        name="score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.5" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={resultForm.control}
                        name="maxScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                step="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={resultForm.control}
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
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="graded">Graded</SelectItem>
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
                      disabled={createResultMutation.isPending}
                    >
                      {createResultMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                      )}
                      Add Test Result
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Update Test Result Dialog */}
      {selectedResult && (
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Test Result</DialogTitle>
              <DialogDescription>
                Update the score and status for this test result.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...updateResultForm}>
              <form onSubmit={updateResultForm.handleSubmit(onSubmitUpdateResult)} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Test Name</h4>
                      <p className="text-sm">{selectedResult.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Date</h4>
                      <p className="text-sm">{formatDate(selectedResult.date)}</p>
                    </div>
                  </div>
                  
                  <FormField
                    control={updateResultForm.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.5" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                          />
                        </FormControl>
                        <FormDescription>
                          Out of {selectedResult.maxScore} points
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={updateResultForm.control}
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="graded">Graded</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsUpdateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateResultMutation.isPending}
                  >
                    {updateResultMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}
