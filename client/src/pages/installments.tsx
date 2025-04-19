import { useQuery, useMutation } from "@tanstack/react-query";
import { Installment, InsertInstallment } from "@shared/schema";
import { PageContainer } from "@/components/layout/page-container";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  CalendarIcon,
  CheckCircle,
  CreditCard,
  Loader2,
  PlusCircle,
  Search,
  Bell,
  Share2,
  MessageSquare,
} from "lucide-react";
import {
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaEnvelope,
  FaSms,
} from "react-icons/fa";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// Define the student interface for type safety
interface Student {
  id: string;
  fullName: string;
}

// Schema for installments filtering
const filterSchema = z.object({
  studentId: z.string().optional(),
  status: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

// Schema for creating installments
const installmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  status: z.enum(["paid", "pending", "overdue"], {
    required_error: "Status is required",
  }),
  paymentDate: z.date().optional(),
});

type InstallmentValues = z.infer<typeof installmentSchema>;

// Schema for updating installment
const updateInstallmentSchema = z.object({
  status: z.enum(["paid", "pending", "overdue"], {
    required_error: "Status is required",
  }),
  paymentDate: z.date().optional(),
});

type UpdateInstallmentValues = z.infer<typeof updateInstallmentSchema>;

export default function InstallmentsPage() {
  const [currentTab, setCurrentTab] = useState<string>("view");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedInstallment, setSelectedInstallment] =
    useState<Installment | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");

  const { user } = useAuth();
  const { toast } = useToast();

  // Get students for dropdown
  const {
    isLoading,
    error,
    data: studentsData,
  } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/students");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        // Assuming the API returns an array of students with a 'full_name' property
        return result.data.map(
          (student: { id: string; full_name: string }) => ({
            id: student.id,
            fullName: student.full_name,
          })
        );
      } catch (error) {
        throw new Error(`Failed to fetch students: ${error.message}`);
      }
    },
  });

  // Get installments based on filters
  const {
    data: installmentsData,
    isLoading: installmentsLoading,
    refetch: refetchInstallments,
  } = useQuery<Installment[]>({
    queryKey: ["installments", selectedStudent, selectedStatus],
    queryFn: async () => {
      let query = supabase.from("installments").select("*");

      if (selectedStudent && selectedStudent !== "all") {
        query = query.eq("student_Id", selectedStudent);
      }

      if (selectedStatus && selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Installment[];
    },
  });

  // Create installment mutation
  const createInstallmentMutation = useMutation({
    mutationFn: async (data: InsertInstallment) => {
      const { data: result, error } = await supabase
        .from("installments")
        .insert([
          {
            student_Id: data.studentId,
            amount: data.amount,
            due_date: data.dueDate.toISOString(),
            status: data.status,
            payment_date: data.paymentDate
              ? data.paymentDate.toISOString()
              : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Installment created",
        description: "The installment has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      installmentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create installment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update installment mutation
  const updateInstallmentMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      paymentDate,
    }: {
      id: string;
      status: string;
      paymentDate?: string;
    }) => {
      const { data, error } = await supabase
        .from("installments")
        .update({
          status,
          payment_date: paymentDate || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Installment updated",
        description: "The installment has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      setIsUpdateDialogOpen(false);
      setIsPaymentDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update installment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup for creating installments
  const installmentForm = useForm<InstallmentValues>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      studentId: "",
      amount: 0,
      dueDate: new Date(),
      status: "pending",
    },
  });

  // Form setup for updating installments
  const updateInstallmentForm = useForm<UpdateInstallmentValues>({
    resolver: zodResolver(updateInstallmentSchema),
    defaultValues: {
      status: "pending",
    },
  });

  // Form setup for filtering
  const filterForm = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      studentId: "",
      status: "",
    },
  });

  const onSubmitInstallment = (data: InstallmentValues) => {
    createInstallmentMutation.mutate({
      studentId: data.studentId,
      amount: data.amount,
      dueDate: data.dueDate,
      status: data.status,
      paymentDate: data.paymentDate,
    });
  };

  const onSubmitUpdateInstallment = (data: UpdateInstallmentValues) => {
    if (!selectedInstallment) return;

    updateInstallmentMutation.mutate({
      id: selectedInstallment.id,
      status: data.status,
      paymentDate: data.paymentDate
        ? data.paymentDate.toISOString()
        : undefined,
    });
  };

  const onSubmitFilter = (data: FilterValues) => {
    setSelectedStudent(data.studentId === "all" ? "all" : data.studentId || "");
    setSelectedStatus(data.status === "all" ? "all" : data.status || "");
    refetchInstallments();
  };

  const openUpdateDialog = (installment: Installment) => {
    setSelectedInstallment(installment);
    updateInstallmentForm.reset({
      status: installment.status as "paid" | "pending" | "overdue",
      paymentDate: installment.paymentDate
        ? new Date(installment.paymentDate)
        : undefined,
    });
    setIsUpdateDialogOpen(true);
  };

  const handleSendNotification = (installment: Installment) => {
    setSelectedInstallment(installment);

    // Find student details if available
    const student = studentsData?.find(
      (s: Student) => s.id === installment.studentId
    );
    const studentName = student
      ? student.fullName
      : `Student ID: ${installment.studentId}`;

    // Create pre-typed message
    const message = `Dear ${studentName},\n\nThis is a friendly reminder that your installment of ${formatCurrency(
      installment.amount
    )} was due on ${formatDate(
      installment.dueDate
    )}.\n\nPlease arrange for payment at your earliest convenience.\n\nThank you,\nVyawahare Coaching Classes`;

    setNotificationMessage(message);
    setIsNotificationDialogOpen(true);
  };

  // Function to handle sharing on social media
  const handleShare = (platform: string) => {
    if (!selectedInstallment || !notificationMessage) return;

    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          notificationMessage
        )}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          window.location.href
        )}&quote=${encodeURIComponent(notificationMessage)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          notificationMessage
        )}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=Payment Reminder&body=${encodeURIComponent(
          notificationMessage
        )}`;
        break;
      case "sms":
        shareUrl = `sms:?body=${encodeURIComponent(notificationMessage)}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");

      toast({
        title: "Notification shared",
        description: `Payment reminder has been shared on ${platform}`,
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date for display
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    return format(parsedDate, "PPP");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 hover:bg-amber-100"
          >
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 hover:bg-red-100"
          >
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if user is admin (only admins can create/update installments)
  const isAdmin = user?.role === "admin";

  return (
    <PageContainer
      title="Financial Installments"
      subtitle="Manage and track student payment installments"
    >
      <Tabs
        defaultValue="view"
        value={currentTab}
        onValueChange={setCurrentTab}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="view">View Installments</TabsTrigger>
          {isAdmin && <TabsTrigger value="add">Add Installment</TabsTrigger>}
        </TabsList>

        {/* View Installments Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Installment Records</CardTitle>
              <CardDescription>
                View and filter installment records by student and status
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
                            {studentsData?.map((student: Student) => (
                              <SelectItem
                                key={student.id}
                                value={student.id.toString()}
                              >
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
                    control={filterForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="mt-8">
                    Filter Installments
                  </Button>
                </form>
              </Form>

              {installmentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installmentsData && installmentsData.length > 0 ? (
                        installmentsData.map((installment: Installment) => {
                          // Safely find student with null checks
                          const student = studentsData?.find((s: Student) => {
                            // Handle cases where either ID might be null/undefined
                            const studentId = s?.id?.toString()?.trim();
                            const installmentStudentId = installment?.studentId
                              ?.toString()
                              ?.trim();
                            return (
                              studentId &&
                              installmentStudentId &&
                              studentId === installmentStudentId
                            );
                          });

                          console.log("Installment:", {
                            id: installment.id,
                            studentId: installment.studentId,
                            studentFound: !!student,
                            studentName: student?.fullName,
                          });

                          return (
                            <TableRow key={installment.id}>
                              <TableCell>
                                {student?.fullName ||
                                  `Unknown Student (ID: ${
                                    installment.studentId || "N/A"
                                  })`}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(installment.amount)}
                              </TableCell>
                              <TableCell>
                                {formatDate(installment.dueDate)}
                              </TableCell>
                              <TableCell>
                                {formatDate(installment.paymentDate)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(installment.status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {isAdmin && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        openUpdateDialog(installment)
                                      }
                                    >
                                      Edit
                                    </Button>
                                  )}
                                  {(isAdmin || user?.role === "teacher") &&
                                    installment.status !== "paid" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleSendNotification(installment)
                                        }
                                      >
                                        <Bell className="h-4 w-4 mr-1" />
                                        Send Notification
                                      </Button>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-6 text-gray-500"
                          >
                            No installments found for the selected filters.
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

        {/* Add Installment Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Create Installment</CardTitle>
                <CardDescription>
                  Create a new payment installment for a student
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...installmentForm}>
                  <form
                    onSubmit={installmentForm.handleSubmit(onSubmitInstallment)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={installmentForm.control}
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
                                {studentsData?.map((student: Student) => (
                                  <SelectItem
                                    key={student.id}
                                    value={student.id.toString()}
                                  >
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
                        control={installmentForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={installmentForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
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
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
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
                        control={installmentForm.control}
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
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {installmentForm.watch("status") === "paid" && (
                        <FormField
                          control={installmentForm.control}
                          name="paymentDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Payment Date</FormLabel>
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
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
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
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full md:w-auto"
                      disabled={createInstallmentMutation.isPending}
                    >
                      {createInstallmentMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlusCircle className="mr-2 h-4 w-4" />
                      )}
                      Create Installment
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Update Installment Dialog */}
      {selectedInstallment && (
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Installment</DialogTitle>
              <DialogDescription>
                Update the status and payment details for this installment.
              </DialogDescription>
            </DialogHeader>

            <Form {...updateInstallmentForm}>
              <form
                onSubmit={updateInstallmentForm.handleSubmit(
                  onSubmitUpdateInstallment
                )}
                className="space-y-4"
              >
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Amount</h4>
                      <p className="text-sm">
                        {formatCurrency(selectedInstallment.amount)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Due Date</h4>
                      <p className="text-sm">
                        {formatDate(selectedInstallment.dueDate)}
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={updateInstallmentForm.control}
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
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {updateInstallmentForm.watch("status") === "paid" && (
                    <FormField
                      control={updateInstallmentForm.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Payment Date</FormLabel>
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
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
                  )}
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
                    disabled={updateInstallmentMutation.isPending}
                  >
                    {updateInstallmentMutation.isPending && (
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

      {/* Payment Confirmation Dialog */}
      {selectedInstallment && (
        <Dialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to mark this installment as paid?
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Amount</h4>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedInstallment.amount)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Due Date</h4>
                  <p className="text-sm">
                    {formatDate(selectedInstallment.dueDate)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Payment Date</h4>
                <p className="text-sm">{format(new Date(), "PPP")}</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  updateInstallmentMutation.mutate({
                    id: selectedInstallment.id,
                    status: "paid",
                    paymentDate: new Date().toISOString(),
                  });
                }}
                disabled={updateInstallmentMutation.isPending}
              >
                {updateInstallmentMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Notification Dialog */}
      {selectedInstallment && (
        <Dialog
          open={isNotificationDialogOpen}
          onOpenChange={setIsNotificationDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Send Payment Reminder</DialogTitle>
              <DialogDescription>
                Send a payment reminder for this installment via social media or
                other messaging channels.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div>
                  <h4 className="text-sm font-medium mb-1">Student ID</h4>
                  <p className="text-sm">{selectedInstallment.studentId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Amount</h4>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedInstallment.amount)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Due Date</h4>
                <p className="text-sm">
                  {formatDate(selectedInstallment.dueDate)}
                </p>
              </div>

              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">Message</h4>
                <Textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="h-32 resize-none"
                />
              </div>
            </div>

            <div className="mt-2">
              <h4 className="text-sm font-medium mb-3">Share via</h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={() => handleShare("whatsapp")}
                >
                  <FaWhatsapp size={20} />
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  onClick={() => handleShare("facebook")}
                >
                  <FaFacebook size={20} />
                  Facebook
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                  onClick={() => handleShare("twitter")}
                >
                  <FaTwitter size={20} />
                  Twitter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                  onClick={() => handleShare("email")}
                >
                  <FaEnvelope size={20} />
                  Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  onClick={() => handleShare("sms")}
                >
                  <FaSms size={20} />
                  SMS
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNotificationDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  toast({
                    title: "Notification prepared",
                    description:
                      "Choose a messaging platform to send the notification.",
                  });
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Directly
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}