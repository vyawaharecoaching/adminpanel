import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { PageContainer } from "@/components/layout/page-container";
import { Loader2, User as UserIcon, Edit, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

interface Student {
  id: string;
  surname?: string;
  name?: string;
  full_name?: string;
  fathers_name?: string;
  gender?: "Male" | "Female";
  birth_date?: string | Date;
  blood_group?: string;
  photo_url?: string;

  school_or_college?: string;
  medium?: string;
  subjects?: string[];

  last_exam_name?: string;
  last_exam_class?: string;
  last_exam_faculty?: string;
  last_exam_seat_no?: string;
  last_exam_center?: string;
  last_exam_month?: string;
  last_exam_year?: string;
  last_exam_marks_obtained?: string;
  last_exam_out_of?: string;
  last_exam_percentage?: string;
  last_exam_class_obtained?: string;
  mark_memo_submitted?: boolean;

  permanent_address?: string;
  permanent_mobile?: string;
  permanent_email?: string;
  local_address?: string;
  local_mobile?: string;
  local_email?: string;

  username?: string;
  password?: string;
  login_email?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

interface ApiResponse<T> {
  data: T;
}

export default function StudentProfilePage() {
  const { studentId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const queryClient = useQueryClient();

  const {
    data: singleStudentResponse,
    isLoading: isSingleLoading,
    error: singleError
  } = useQuery<ApiResponse<Student>>({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Endpoint not found, will try fallback");
        }
        throw new Error(`Failed to fetch student: ${res.statusText}`);
      }
      return res.json();
    },
    retry: false,
    onSuccess: (data) => {
      setEditedStudent(data.data);
    }
  });

  const {
    data: allStudentsResponse,
    isLoading: isAllLoading,
    error: allError,
    isFetching: isAllFetching
  } = useQuery<ApiResponse<Student[]>>({
    queryKey: ["all-students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) {
        throw new Error(`Failed to fetch all students: ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!singleError
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (updatedData: Partial<Student>) => {
      if (!editedStudent) return;

      // Only send the fields that have actually changed
      const changes = Object.keys(updatedData).reduce((acc, key) => {
        const typedKey = key as keyof Student;
        if (updatedData[typedKey] !== editedStudent[typedKey]) {
          acc[typedKey] = updatedData[typedKey];
        }
        return acc;
      }, {} as Partial<Student>);

      if (Object.keys(changes).length === 0) {
        console.log("No changes to save");
        return Promise.resolve(null); // No changes to save
      }

      console.log("Updating student with changes:", changes);

      const { data, error } = await supabase
        .from('students')
        .update(changes)
        .eq('id', studentId)
        .select();

      if (error) {
        console.error("Error updating student:", error.message);
        throw new Error(error.message);
      }

      console.log("Update successful:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      setIsEditing(false);
    }
  });

  const singleStudent = singleStudentResponse?.data;
  const allStudents = allStudentsResponse?.data || [];

  const student =
    singleStudent ||
    (Array.isArray(allStudents)
      ? allStudents.find((s) => s.id === studentId)
      : undefined);

  const isLoading = isSingleLoading || (!!singleError && isAllLoading);
  const error = singleError && !isAllFetching ? allError : null;

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    return format(parsedDate, "PPP");
  };

  const formatBoolean = (value: boolean | undefined) => {
    return value ? "Yes" : "No";
  };

  const handleInputChange = (field: keyof Student, value: any) => {
    if (!editedStudent) return;
    setEditedStudent(prev => ({
      ...(prev as Student),
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!editedStudent) return;
    updateStudentMutation.mutate(editedStudent);
  };

  const handleCancel = () => {
    setEditedStudent(singleStudent || null);
    setIsEditing(false);
  };

  useEffect(() => {
    if (singleStudent) {
      setEditedStudent(singleStudent);
    }
  }, [singleStudent]);

  if (isLoading) {
    return (
      <PageContainer title="Student Profile" subtitle="Loading...">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Student Profile" subtitle="Error loading student data">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600">There was an error loading the student profile.</p>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!student || !editedStudent) {
    return (
      <PageContainer title="Student Profile" subtitle="Student not found">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Student Not Found</h2>
            <p className="text-gray-600">No student found with ID: {studentId}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`${student.full_name || "Student"}'s Profile`}
      subtitle={`Class: ${student.last_exam_class || "Not assigned"} | ID: ${student.id}`}
    >
      <div className="flex justify-end mb-4">
        {isEditing ? (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updateStudentMutation.isPending}>
              {updateStudentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.full_name}
                  className="w-24 h-24 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-4xl font-bold mb-3">
                  {student.full_name?.charAt(0) || "?"}
                </div>
              )}
              {isEditing ? (
                <>
                  <Input
                    value={editedStudent.full_name || ""}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    value={editedStudent.local_email || editedStudent.permanent_email || ""}
                    onChange={(e) => handleInputChange('local_email', e.target.value)}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900">{student.full_name || "No name"}</h3>
                  <p className="text-gray-600">{student.local_email || student.permanent_email || "No email"}</p>
                </>
              )}
            </div>

            <div className="space-y-2 border-t pt-4">
              <EditableInfoRow
                label="Surname"
                value={editedStudent.surname}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('surname', value)}
              />
              <EditableInfoRow
                label="Name"
                value={editedStudent.name}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('name', value)}
              />
              <EditableInfoRow
                label="Father's Name"
                value={editedStudent.fathers_name}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('fathers_name', value)}
              />
              {isEditing ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Gender</span>
                  <Select
                    value={editedStudent.gender}
                    onValueChange={(value) => handleInputChange('gender', value as "Male" | "Female")}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <InfoRow label="Gender" value={student.gender} />
              )}
              <EditableInfoRow
                label="Birth Date"
                value={editedStudent.birth_date as string}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('birth_date', value)}
                type="date"
              />
              <EditableInfoRow
                label="Blood Group"
                value={editedStudent.blood_group}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('blood_group', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Education & Exam Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              Education & Exam Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <EditableInfoRow
              label="School/College"
              value={editedStudent.school_or_college}
              isEditing={isEditing}
              onChange={(value) => handleInputChange('school_or_college', value)}
            />
            <EditableInfoRow
              label="Medium"
              value={editedStudent.medium}
              isEditing={isEditing}
              onChange={(value) => handleInputChange('medium', value)}
            />
            <EditableInfoRow
              label="Subjects"
              value={editedStudent.subjects?.join(", ")}
              isEditing={isEditing}
              onChange={(value) => handleInputChange('subjects', value.split(",").map(s => s.trim()))}
            />

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Last Exam Details</h4>
              <EditableInfoRow
                label="Exam Name"
                value={editedStudent.last_exam_name}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_name', value)}
              />
              <EditableInfoRow
                label="Class"
                value={editedStudent.last_exam_class}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_class', value)}
              />
              <EditableInfoRow
                label="Faculty"
                value={editedStudent.last_exam_faculty}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_faculty', value)}
              />
              <EditableInfoRow
                label="Seat No"
                value={editedStudent.last_exam_seat_no}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_seat_no', value)}
              />
              <EditableInfoRow
                label="Center"
                value={editedStudent.last_exam_center}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_center', value)}
              />
              <EditableInfoRow
                label="Month/Year"
                value={`${editedStudent.last_exam_month}/${editedStudent.last_exam_year}`}
                isEditing={isEditing}
                onChange={(value) => {
                  const [month, year] = value.split('/');
                  handleInputChange('last_exam_month', month);
                  handleInputChange('last_exam_year', year);
                }}
              />
              <EditableInfoRow
                label="Marks Obtained"
                value={editedStudent.last_exam_marks_obtained}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_marks_obtained', value)}
              />
              <EditableInfoRow
                label="Out Of"
                value={editedStudent.last_exam_out_of}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_out_of', value)}
              />
              <EditableInfoRow
                label="Percentage"
                value={editedStudent.last_exam_percentage}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_percentage', value)}
              />
              <EditableInfoRow
                label="Class Obtained"
                value={editedStudent.last_exam_class_obtained}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('last_exam_class_obtained', value)}
              />
              {isEditing ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Memo Submitted</span>
                  <Checkbox
                    checked={editedStudent.mark_memo_submitted || false}
                    onCheckedChange={(checked) => handleInputChange('mark_memo_submitted', checked as boolean)}
                  />
                </div>
              ) : (
                <InfoRow label="Memo Submitted" value={formatBoolean(student.mark_memo_submitted)} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact & Account Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5 text-primary" />
              Contact & Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <h4 className="font-medium mb-2">Permanent Address</h4>
              {isEditing ? (
                <Textarea
                  value={editedStudent.permanent_address || ""}
                  onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                  className="mb-2"
                />
              ) : (
                <InfoRow label="Address" value={student.permanent_address} />
              )}
              <EditableInfoRow
                label="Mobile"
                value={editedStudent.permanent_mobile}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('permanent_mobile', value)}
              />
              <EditableInfoRow
                label="Email"
                value={editedStudent.permanent_email}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('permanent_email', value)}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Local Address</h4>
              {isEditing ? (
                <Textarea
                  value={editedStudent.local_address || ""}
                  onChange={(e) => handleInputChange('local_address', e.target.value)}
                  className="mb-2"
                />
              ) : (
                <InfoRow label="Address" value={student.local_address} />
              )}
              <EditableInfoRow
                label="Mobile"
                value={editedStudent.local_mobile}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('local_mobile', value)}
              />
              <EditableInfoRow
                label="Email"
                value={editedStudent.local_email}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('local_email', value)}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Account Information</h4>
              <EditableInfoRow
                label="Username"
                value={editedStudent.username}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('username', value)}
              />
              <EditableInfoRow
                label="Login Email"
                value={editedStudent.login_email}
                isEditing={isEditing}
                onChange={(value) => handleInputChange('login_email', value)}
              />
              <InfoRow label="Created At" value={formatDate(student.created_at)} />
              <InfoRow label="Updated At" value={formatDate(student.updated_at)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      <span className="text-right text-gray-600">{value || "N/A"}</span>
    </div>
  );
}

interface EditableInfoRowProps {
  label: string;
  value?: string | number | null;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: "text" | "date";
}

function EditableInfoRow({ label, value, isEditing, onChange, type = "text" }: EditableInfoRowProps) {
  if (isEditing) {
    return (
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="font-medium">{label}</span>
        {type === "date" ? (
          <Input
            type="date"
            value={value as string || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-[180px]"
          />
        ) : (
          <Input
            value={value as string || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-[180px]"
          />
        )}
      </div>
    );
  }

  return <InfoRow label={label} value={value} />;
}