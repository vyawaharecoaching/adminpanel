import { useQuery, useMutation } from "@tanstack/react-query";
import { User, InsertUser, InsertStudent } from "@shared/schema";
import { PageContainer } from "@/components/layout/page-container";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, PlusCircle, Search, User as UserIcon, BookOpen, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema for student registration form
const studentSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.literal("student"),
  grade: z.string().min(1, "Grade is required"),
  parentName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.date().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "student",
      grade: "",
      parentName: "",
      phone: "",
      address: "",
    },
  });
  
  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/users/student"],
    queryFn: async () => {
      const res = await fetch("/api/users/student");
      if (!res.ok) throw new Error("Failed to fetch students data");
      return await res.json() as User[];
    }
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      // First create the user
      const userResponse = await apiRequest("POST", "/api/register", {
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        email: data.email,
        role: "student",
        grade: data.grade,
        joinDate: new Date().toISOString(),
      } as InsertUser);
      
      if (!userResponse.ok) {
        throw new Error("Failed to create user account");
      }
      
      const user = await userResponse.json();
      
      // Then create the student profile
      const studentResponse = await apiRequest("POST", "/api/students", {
        userId: user.id,
        parentName: data.parentName || null,
        phone: data.phone || null,
        address: data.address || null,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : null,
      } as InsertStudent);
      
      if (!studentResponse.ok) {
        throw new Error("Failed to create student profile");
      }
      
      return await studentResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Registration Successful",
        description: "The student has been registered successfully.",
      });
      setIsRegisterDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users/student"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StudentFormValues) => {
    createStudentMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatJoinDate = (joinDate: Date | string | null) => {
    if (!joinDate) return 'N/A';
    return typeof joinDate === 'string' 
      ? format(new Date(joinDate), 'PPP') 
      : format(joinDate, 'PPP');
  };

  const filteredStudents = data?.filter(student => 
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grades = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  return (
    <PageContainer
      title="Students"
      subtitle="Manage student records and information"
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              View and manage all registered students
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Student</DialogTitle>
                  <DialogDescription>
                    Enter the student's details to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Login Information */}
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormDescription>
                              Will be used to login to the system
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Minimum 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Personal Information */}
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth</FormLabel>
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
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  disabled={(date) => date > new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Additional Information */}
                      <FormField
                        control={form.control}
                        name="parentName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent/Guardian Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter parent name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsRegisterDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createStudentMutation.isPending}
                      >
                        {createStudentMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Register Student
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading student data
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.length ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {getInitials(student.fullName)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{student.fullName}</TableCell>
                        <TableCell>{student.username}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.grade || "N/A"}</TableCell>
                        <TableCell>{formatJoinDate(student.joinDate)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/student/${student.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary">
                              <UserIcon className="mr-1 h-4 w-4" />
                              Profile
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                        {searchTerm 
                          ? "No students match your search criteria" 
                          : "No students have been registered yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
