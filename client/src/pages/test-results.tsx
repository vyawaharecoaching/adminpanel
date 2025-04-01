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
import { CalendarIcon, FileEdit, Loader2, PlusCircle } from "lucide-react";
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
  date: z.date({
    required_error: "Date is required",
  }),
  maxScore: z.number().min(1, "Maximum score must be greater than 0"),
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

// Grade levels
const grades = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

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
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
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

  // Form setup for test details
  const resultForm = useForm<ResultValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      name: "",
      classId: "",
      date: new Date(),
      maxScore: 100,
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

  const onSubmitUpdateResult = (data: UpdateResultValues) => {
    if (!selectedResult) return;
    
    updateResultMutation.mutate({
      id: selectedResult.id,
      score: data.score,
      status: data.status,
    });
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
                            <SelectItem value="all">All Classes</SelectItem>
                            {grades.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
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
                            <SelectItem value="all">All Students</SelectItem>
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
                      {resultsData && resultsData.length > 0 ? (
                        resultsData.map((result) => {
                          const percentage = calculatePercentage(result.score, result.maxScore);
                          return (
                            <TableRow key={result.id}>
                              <TableCell>{result.name}</TableCell>
                              <TableCell>{result.classId}</TableCell>
                              <TableCell>
                                {studentsData?.find((s: any) => s.id === result.studentId)?.fullName || 
                                 `Student ${result.studentId}`}
                              </TableCell>
                              <TableCell>{formatDate(result.date)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-2 font-medium">
                                    {result.score}/{result.maxScore} ({percentage}%)
                                  </span>
                                  <Progress 
                                    className="w-16 h-2" 
                                    value={percentage}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                {result.status === "graded" ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Graded</Badge>
                                ) : (
                                  <Badge variant="outline">Pending</Badge>
                                )}
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
                  Record test results for students by class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormLabel>Test Name</FormLabel>
                      <Input 
                        placeholder="e.g., Midterm Exam" 
                        value={resultForm.watch('name')}
                        onChange={(e) => resultForm.setValue('name', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <FormLabel>Class</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          setSelectedClass(value);
                          resultForm.setValue('classId', value);
                        }}
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full mt-1 pl-3 text-left font-normal",
                              !resultForm.watch('date') && "text-muted-foreground"
                            )}
                          >
                            {resultForm.watch('date') ? (
                              format(resultForm.watch('date'), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={resultForm.watch('date')}
                            onSelect={(date) => resultForm.setValue('date', date as Date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <FormLabel>Maximum Score</FormLabel>
                      <Input 
                        type="number" 
                        value={resultForm.watch('maxScore')}
                        onChange={(e) => resultForm.setValue('maxScore', Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  {selectedClass && resultForm.watch('name') && resultForm.watch('date') && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Student Scores for {resultForm.watch('name')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {format(resultForm.watch('date'), "PPP")}
                        </p>
                      </div>
                      
                      {studentsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : studentsData && studentsData.length > 0 ? (
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-20">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentsData.map((student: any) => {
                                // Find if there's an existing result for this student for this test
                                const existingResult = resultsData?.find(
                                  (r) => r.studentId === student.id && 
                                        r.classId === parseInt(selectedClass) &&
                                        r.name === resultForm.watch('name') &&
                                        format(new Date(r.date), "yyyy-MM-dd") === format(resultForm.watch('date'), "yyyy-MM-dd")
                                );
                                
                                return (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 mr-2 flex items-center justify-center text-primary">
                                          {student.fullName?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                          <p>{student.fullName}</p>
                                          <p className="text-xs text-gray-500">ID: {student.id}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <Input 
                                          type="number" 
                                          className="w-16" 
                                          placeholder="0"
                                          value={existingResult?.score || ''}
                                          onChange={(e) => {
                                            const score = Number(e.target.value);
                                            // If already has result, update it
                                            if (existingResult) {
                                              updateResultMutation.mutate({
                                                id: existingResult.id,
                                                score: score,
                                                status: existingResult.status
                                              });
                                            } else {
                                              // Otherwise create new result
                                              createResultMutation.mutate({
                                                name: resultForm.watch('name'),
                                                classId: parseInt(selectedClass),
                                                studentId: student.id,
                                                date: resultForm.watch('date') as unknown as string,
                                                score: score,
                                                maxScore: resultForm.watch('maxScore'),
                                                status: 'pending'
                                              });
                                            }
                                          }} 
                                        />
                                        <span className="text-gray-500">/ {resultForm.watch('maxScore')}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Select 
                                        defaultValue={existingResult?.status || "pending"}
                                        onValueChange={(value) => {
                                          if (existingResult) {
                                            updateResultMutation.mutate({
                                              id: existingResult.id,
                                              score: existingResult.score,
                                              status: value
                                            });
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-28">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="graded">Graded</SelectItem>
                                          <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      {existingResult ? (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="text-primary"
                                          onClick={() => openUpdateDialog(existingResult)}
                                        >
                                          <FileEdit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                      ) : (
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="text-primary"
                                          onClick={() => {
                                            createResultMutation.mutate({
                                              name: resultForm.watch('name'),
                                              classId: parseInt(selectedClass),
                                              studentId: student.id,
                                              date: resultForm.watch('date') as unknown as string,
                                              score: 0,
                                              maxScore: resultForm.watch('maxScore'),
                                              status: 'pending'
                                            });
                                          }}
                                        >
                                          <PlusCircle className="h-4 w-4 mr-1" />
                                          Add
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border">
                          <p className="text-gray-500 font-medium">No students found in this class.</p>
                          <p className="text-gray-400 text-sm mt-2">Please add students to this class first.</p>
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
                            {...field}
                            onChange={e => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
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
                            <SelectItem value="graded">Graded</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateResultMutation.isPending}
                  >
                    {updateResultMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Update Result
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