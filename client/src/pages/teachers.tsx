import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, CalendarIcon, Users, IndianRupee } from "lucide-react";
import { TeacherPayment, User, insertTeacherPaymentSchema } from "@shared/schema";

type Teacher = User & { role: "teacher" };

const TeachersPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Query to get all teachers
  const {
    data: teachers,
    isLoading: isLoadingTeachers,
    error: teachersError,
  } = useQuery({
    queryKey: ["/api/users/teacher"],
    queryFn: async () => {
      const res = await fetch("/api/users/teacher");
      if (!res.ok) {
        throw new Error("Failed to fetch teachers");
      }
      return await res.json() as Teacher[];
    },
  });

  // Query to get teacher payments
  const {
    data: teacherPayments,
    isLoading: isLoadingPayments,
    error: paymentsError,
  } = useQuery({
    queryKey: ["/api/teacher-payments"],
    queryFn: async () => {
      const res = await fetch("/api/teacher-payments");
      if (!res.ok) {
        throw new Error("Failed to fetch teacher payments");
      }
      return await res.json() as TeacherPayment[];
    },
  });
  
  // Filter payments for selected teacher
  const selectedTeacherPayments = selectedTeacher && teacherPayments
    ? teacherPayments.filter(payment => payment.teacherId === selectedTeacher.id)
    : [];
    
  // Create payment form schema with Zod
  const paymentFormSchema = insertTeacherPaymentSchema.extend({
    paymentDate: z.date().optional()
  });

  type PaymentFormValues = z.infer<typeof paymentFormSchema>;

  // Initialize form with react-hook-form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      teacherId: selectedTeacher ? selectedTeacher.id : undefined,
      amount: 0,
      month: new Date().toISOString().substring(0, 7), // YYYY-MM format
      description: "Monthly salary",
      status: "pending",
      paymentDate: undefined
    },
  });

  // Update form when selected teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      form.setValue("teacherId", selectedTeacher.id);
    }
  }, [selectedTeacher, form]);

  // Add teacher payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      // Convert Date object to ISO string for API
      const paymentData = {
        ...data,
        paymentDate: data.paymentDate ? data.paymentDate.toISOString() : undefined
      };
      
      const res = await apiRequest("POST", "/api/teacher-payments", paymentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher payment added successfully",
      });
      setIsPaymentDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add teacher payment",
        variant: "destructive",
      });
    },
  });

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      paymentDate 
    }: { 
      id: number; 
      status: string; 
      paymentDate?: Date;
    }) => {
      const updateData = {
        status,
        paymentDate: paymentDate ? paymentDate.toISOString() : undefined
      };
      
      const res = await apiRequest("PATCH", `/api/teacher-payments/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  // Handler for form submission
  const onSubmit = (data: PaymentFormValues) => {
    addPaymentMutation.mutate(data);
  };

  // Handler to mark payment as paid
  const handleMarkAsPaid = (payment: TeacherPayment) => {
    updatePaymentMutation.mutate({
      id: payment.id,
      status: "paid",
      paymentDate: new Date()
    });
  };

  if (isLoadingTeachers || isLoadingPayments) {
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

  const getTeacherName = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher ? teacher.fullName : "Unknown Teacher";
  };

  return (
    <div className="container py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Teachers Management</h1>
          <TabsList>
            <TabsTrigger value="list">Teachers List</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setActiveTab("payments");
                    }}
                  >
                    View Payments
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    Add Payment
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <h2 className="text-2xl font-semibold">
                {selectedTeacher ? `Payments for ${selectedTeacher.fullName}` : "All Teacher Payments"}
              </h2>
            </div>
            <div className="flex gap-4">
              {selectedTeacher && (
                <Button 
                  onClick={() => {
                    setIsPaymentDialogOpen(true);
                  }}
                >
                  Add Payment
                </Button>
              )}
              <Select
                value={selectedTeacher ? String(selectedTeacher.id) : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedTeacher(null);
                  } else {
                    const teacher = teachers?.find(t => t.id === parseInt(value));
                    if (teacher) {
                      setSelectedTeacher(teacher as Teacher);
                    }
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={String(teacher.id)}>
                      {teacher.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>
                  {selectedTeacher
                    ? `Showing payments for ${selectedTeacher.fullName}`
                    : "List of all teacher payments"}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedTeacher ? selectedTeacherPayments : teacherPayments)?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{getTeacherName(payment.teacherId)}</TableCell>
                      <TableCell>{payment.month}</TableCell>
                      <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.description || "Monthly salary"}</TableCell>
                      <TableCell>
                        {payment.paymentDate
                          ? format(parseISO(payment.paymentDate), "PPP")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "paid" ? "default" : "outline"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === "pending" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleMarkAsPaid(payment)}
                            disabled={updatePaymentMutation.isPending}
                          >
                            {updatePaymentMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Mark as Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {((selectedTeacher ? selectedTeacherPayments : teacherPayments) || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Add Teacher Payment
              {selectedTeacher && ` for ${selectedTeacher.fullName}`}
            </DialogTitle>
            <DialogDescription>
              Enter the payment details for this teacher.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {!selectedTeacher && (
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers?.map((teacher) => (
                            <SelectItem 
                              key={teacher.id} 
                              value={teacher.id.toString()}
                            >
                              {teacher.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <div className="flex items-center px-3 border border-r-0 rounded-l-md border-input bg-muted">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input 
                          type="number" 
                          placeholder="25000" 
                          className="rounded-l-none"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month (YYYY-MM)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="2025-04" 
                        {...field} 
                        pattern="\\d{4}-\\d{2}"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter in YYYY-MM format (e.g., 2025-04 for April 2025)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Monthly salary" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
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
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Optional if status is pending
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={addPaymentMutation.isPending}
                >
                  {addPaymentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Payment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeachersPage;