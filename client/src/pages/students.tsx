import { useQuery, useMutation } from "@tanstack/react-query";
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";
import { PageContainer } from "@/components/layout/page-container";
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
import {
  CalendarIcon,
  EditIcon,
  Loader2,
  PlusCircle,
  Search,
  Upload,
  User as UserIcon,
} from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";


// Define the form schema
const studentRegistrationSchema = z.object({
  surname: z.string().optional(),
  name: z.string().optional(),
  full_name: z.string().optional(),
  fathers_name: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  birth_date: z.date().optional(),
  school_or_college: z.string().optional(),
  medium: z.string().optional(),
  fathers_occupation: z.string().optional(),
  blood_group: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  permanent_address: z.string().optional(),
  permanent_mobile: z.string().optional(),
  permanent_email: z.string().optional(),
  local_address: z.string().optional(),
  local_mobile: z.string().optional(),
  local_email: z.string().optional(),
  last_exam_name: z.string().optional(),
  last_exam_class: z.string().optional(),
  last_exam_faculty: z.string().optional(),
  last_exam_seat_no: z.string().optional(),
  last_exam_center: z.string().optional(),
  last_exam_month: z.string().optional(),
  last_exam_year: z.string().optional(),
  last_exam_marks_obtained: z.string().optional(),
  last_exam_out_of: z.string().optional(),
  last_exam_percentage: z.string().optional(),
  last_exam_class_obtained: z.string().optional(),
  mark_memo_submitted: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  login_email: z.string().optional(),
  photo_url: z.string().optional(),
});

type StudentRegistrationValues = z.infer<typeof studentRegistrationSchema>;

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Form setup
  const form = useForm<StudentRegistrationValues>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      medium: "Full English",
      gender: "Male",
      birth_date: new Date(),
      subjects: [],
      mark_memo_submitted: false,
    },
  });

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setPhotoPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Updated student data fetching
  const { isLoading, error, data } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/students");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        // Check if the response has a data property
        const studentsData = result.data || result;

        return studentsData.map((student: any) => ({
          ...student,
          full_name:
            student.full_name ||
            `${student.name || ""} ${student.surname || ""}`.trim(),
          username: student.username || "N/A",
          login_email: student.login_email || student.permanent_email || "N/A",
          last_exam_class: student.last_exam_class || "N/A",
          created_at: student.created_at ? new Date(student.created_at) : null,
        }));
      } catch (err) {
        throw new Error(
          `Failed to fetch students: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: StudentRegistrationValues) => {
      // Ensure birth_date is in the correct format
      const formattedData = {
        ...data,
        birth_date: data.birth_date ? data.birth_date.toISOString() : null,
      };

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error("Failed to create student profile");
      }

      // Handle photo upload if necessary
      if (photoFile) {
        const formData = new FormData();
        formData.append("photo", photoFile);

        const photoResponse = await fetch(
          `/api/student-photo/${data.username}`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!photoResponse.ok) {
          console.warn("Failed to upload student photo");
        }
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "The student has been registered successfully.",
      });
      setIsRegisterDialogOpen(false);
      form.reset();
      setPhotoFile(null);
      setPhotoPreview("");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: StudentRegistrationValues) => {
    registerMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const formatJoinDate = (joinDate: Date | string | null) => {
    if (!joinDate) return "N/A";
    return typeof joinDate === "string"
      ? format(new Date(joinDate), "PPP")
      : format(joinDate, "PPP");
  };

  const grades = ["5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

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

            <Dialog
              open={isRegisterDialogOpen}
              onOpenChange={setIsRegisterDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center">
                    Vyawahare Coaching Classes
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Student Registration Form - Fill in all details accurately
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 py-4"
                  >
                    {/* Photo Upload Section */}
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-32 h-40 border-2 rounded flex items-center justify-center overflow-hidden",
                            photoPreview ? "p-0" : "p-2"
                          )}
                        >
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt="Student photo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-xs text-muted-foreground mt-2">
                                Passport Size Photo
                              </p>
                            </div>
                          )}
                        </div>
                        <Input
                          type="file"
                          id="photo"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() =>
                            document.getElementById("photo")?.click()
                          }
                        >
                          Upload Photo
                        </Button>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="surname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Surname</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter surname" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fathers_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter father's name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter full name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="school_or_college"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School/College Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter school/college name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="medium"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medium</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select medium" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Semi English">
                                    Semi English
                                  </SelectItem>
                                  <SelectItem value="Marathi">
                                    Marathi
                                  </SelectItem>
                                  <SelectItem value="Full English">
                                    Full English
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="subjects"
                          render={() => (
                            <FormItem>
                              <FormLabel>Subjects</FormLabel>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {[
                                  "Mathematics",
                                  "Physics",
                                  "Chemistry",
                                  "Biology",
                                  "History",
                                  "Geography",
                                ].map((subject) => (
                                  <FormField
                                    key={subject}
                                    control={form.control}
                                    name="subjects"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={subject}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(
                                                subject
                                              )}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([
                                                      ...field.value,
                                                      subject,
                                                    ])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) =>
                                                          value !== subject
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {subject}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Gender</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex space-x-4"
                                >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="Male" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Male
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="Female" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Female
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="birth_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Birth Date</FormLabel>
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
                          control={form.control}
                          name="blood_group"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Blood Group</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., A+, B-, O+"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fathers_occupation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Occupation</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter father's occupation"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Contact Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">Permanent Address</h4>

                          <FormField
                            control={form.control}
                            name="permanent_address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter permanent address"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="permanent_mobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mobile</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter mobile number"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="permanent_email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter email address"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium">Local Address</h4>

                          <FormField
                            control={form.control}
                            name="local_address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter local address"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="local_mobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mobile</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter mobile number"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="local_email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter email address"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Previous Examination Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Details of the last qualifying Examination
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="last_exam_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name of the Exam</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., SSC, HSC"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_exam_class"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
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
                          name="last_exam_faculty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Faculty</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Science, Arts"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_exam_seat_no"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seat No.</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter seat number"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_exam_center"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exam Center</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter exam center"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="last_exam_month"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Month</FormLabel>
                                <FormControl>
                                  <Input placeholder="Month" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="last_exam_year"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                  <Input placeholder="Year" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="last_exam_marks_obtained"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marks Obtained</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter marks"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_exam_out_of"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Out Of</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter total marks"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_exam_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentage</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Enter percentage"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_exam_class_obtained"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class Obtained</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter class" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="mark_memo_submitted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Mark Memo Submitted</FormLabel>
                              <FormDescription>
                                Check if the mark memo has been submitted
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Login Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Account Information (Optional)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        These details will be used to create a login account for
                        the student.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Leave blank to auto-generate"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Will be auto-generated if left blank
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
                                <Input
                                  type="password"
                                  placeholder="Leave blank to use default"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Default: changeme123
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="login_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (for login)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Leave blank to use permanent email"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Will use permanent email if blank
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Declarations */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">
                        Declarations
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="studentDeclaration"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Student Declaration</FormLabel>
                                <FormDescription>
                                  I have read the rules and regulations
                                  regarding discipline and good conduct. I
                                  assure that if I failed to observe these rules
                                  the college authorities can take any
                                  disciplinary action against me.
                                </FormDescription>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="parentDeclaration"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Parent Declaration</FormLabel>
                                <FormDescription>
                                  I have read the rules and regulations of the
                                  college. I promise to abide by them. I have
                                  also read the instructions about changing fees
                                  structure. I agree to pay the fees revised
                                  from time to time.
                                </FormDescription>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
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
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending && (
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
                    <TableHead>Class</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.length ? (
                    data
                      .filter(
                        (student) =>
                          student.full_name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          student.username
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          student.login_email
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                      )
                      .map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {getInitials(student.full_name)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.full_name}
                          </TableCell>
                          <TableCell>{student.username}</TableCell>
                          <TableCell>{student.login_email}</TableCell>
                          <TableCell>{student.last_exam_class}</TableCell>
                          <TableCell>
                            {formatJoinDate(student.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/student/${student.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                              >
                                <UserIcon className="mr-1 h-4 w-4" />
                                Profile
                              </Button>
                            </Link>

                            <Link href={`/edit/${student.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                              >
                                <EditIcon className="mr-1 h-4 w-4" />
                                Edit
                              </Button>
                            </Link>

                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-4 text-gray-500"
                      >
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
