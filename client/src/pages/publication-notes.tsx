import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertPublicationNoteSchema } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bookmark, BookOpen, Check, Edit, LibraryBig, Plus, RefreshCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Schema extended with validation rules
const formSchema = insertPublicationNoteSchema.extend({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  totalStock: z.coerce.number().min(0, "Total stock cannot be negative"),
  availableStock: z.coerce.number().min(0, "Available stock cannot be negative"),
  lowStockThreshold: z.coerce.number().min(1, "Low stock threshold must be at least 1"),
});

type PublicationNote = {
  id: number;
  title: string;
  subject: string;
  grade: string;
  totalStock: number;
  availableStock: number;
  lowStockThreshold: number;
  lastRestocked: string;
  description: string | null;
};

type StudentNote = {
  id: number;
  studentId: number;
  noteId: number;
  dateIssued: string;
  isReturned: boolean;
  returnDate: string | null;
  condition: "excellent" | "good" | "fair" | "poor" | null;
  notes: string | null;
};

type Student = {
  id: number;
  username: string;
  fullName: string;
  role: "student";
  grade: string | null;
};

// Component for the main page
const PublicationNotesPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditStockDialogOpen, setIsEditStockDialogOpen] = useState(false);
  const [isDistributionDialogOpen, setIsDistributionDialogOpen] = useState(false);
  
  // Query to get all publication notes
  const { data: notes, isLoading } = useQuery<PublicationNote[]>({
    queryKey: ['/api/publication-notes'],
    // Only fetch if tab is 'all' or 'lowstock'
    enabled: activeTab === 'all' || activeTab === 'lowstock',
  });
  
  // Query to get low stock publication notes
  const { data: lowStockNotes, isLoading: isLowStockLoading } = useQuery<PublicationNote[]>({
    queryKey: ['/api/publication-notes', { lowStock: true }],
    queryFn: () => fetch('/api/publication-notes?lowStock=true').then(res => res.json()),
    // Only fetch if tab is 'lowstock'
    enabled: activeTab === 'lowstock',
  });
  
  // Query to get student notes for the selected publication
  const { data: studentNotes, isLoading: isStudentNotesLoading } = useQuery<StudentNote[]>({
    queryKey: ['/api/student-notes', { noteId: selectedNoteId }],
    queryFn: () => fetch(`/api/student-notes?noteId=${selectedNoteId}`).then(res => res.json()),
    // Only fetch if a note is selected and the distribution dialog is open
    enabled: !!selectedNoteId && isDistributionDialogOpen,
  });
  
  // Query to get students
  const { data: students, isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/users/student'],
    enabled: isDistributionDialogOpen,
  });
  
  // Filter notes based on the active tab
  const getFilteredNotes = () => {
    if (activeTab === 'lowstock' && lowStockNotes) {
      return lowStockNotes;
    }
    return notes || [];
  };
  
  // Mutation to add a new publication note
  const addNoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await fetch('/api/publication-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add publication note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Publication Note Added",
        description: "The publication note has been added successfully.",
        variant: "default",
      });
      setIsAddDialogOpen(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/publication-notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update stock levels
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, totalStock, availableStock }: { id: number, totalStock: number, availableStock: number }) => {
      const response = await fetch(`/api/publication-notes/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalStock, availableStock }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stock levels');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock Updated",
        description: "Stock levels have been updated successfully.",
        variant: "default",
      });
      setIsEditStockDialogOpen(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/publication-notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form for adding a new publication note
  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subject: "",
      grade: "",
      totalStock: 0,
      availableStock: 0,
      lowStockThreshold: 5,
      description: "",
    },
  });
  
  // Form for updating stock levels
  const stockForm = useForm<{ totalStock: number; availableStock: number }>({
    defaultValues: {
      totalStock: 0,
      availableStock: 0,
    },
  });
  
  // Form for distributing publication notes to students
  const distributionForm = useForm<{ studentId: number; condition: string; notes: string }>({
    defaultValues: {
      studentId: 0,
      condition: "good",
      notes: "",
    },
  });
  
  const handleAddNote = (data: z.infer<typeof formSchema>) => {
    addNoteMutation.mutate(data);
  };
  
  const handleUpdateStock = (data: { totalStock: number; availableStock: number }) => {
    if (selectedNoteId) {
      updateStockMutation.mutate({
        id: selectedNoteId,
        totalStock: data.totalStock,
        availableStock: data.availableStock,
      });
    }
  };
  
  const handleOpenEditStock = (note: PublicationNote) => {
    setSelectedNoteId(note.id);
    stockForm.reset({
      totalStock: note.totalStock,
      availableStock: note.availableStock,
    });
    setIsEditStockDialogOpen(true);
  };
  
  const handleOpenDistribution = (note: PublicationNote) => {
    setSelectedNoteId(note.id);
    setIsDistributionDialogOpen(true);
  };
  
  // Get the selected note details
  const getSelectedNote = () => {
    if (!selectedNoteId || !notes) return null;
    return notes.find(note => note.id === selectedNoteId) || null;
  };
  
  // Mutation to assign a note to a student
  const assignNoteMutation = useMutation({
    mutationFn: async (data: { studentId: number; noteId: number; condition: string; notes: string }) => {
      const response = await fetch('/api/student-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: data.studentId,
          noteId: data.noteId,
          condition: data.condition,
          notes: data.notes,
          dateIssued: new Date().toISOString(),
          isReturned: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign note to student');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note Assigned",
        description: "The publication note has been assigned to the student.",
        variant: "default",
      });
      distributionForm.reset({
        studentId: 0,
        condition: "good",
        notes: "",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/publication-notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to mark a note as returned
  const returnNoteMutation = useMutation({
    mutationFn: async ({ id, condition }: { id: number; condition: string }) => {
      const response = await fetch(`/api/student-notes/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isReturned: true,
          returnDate: new Date().toISOString(),
          condition,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark note as returned');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note Returned",
        description: "The publication note has been marked as returned.",
        variant: "default",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/publication-notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAssignNote = (data: { studentId: number; condition: string; notes: string }) => {
    if (selectedNoteId) {
      assignNoteMutation.mutate({
        studentId: data.studentId,
        noteId: selectedNoteId,
        condition: data.condition,
        notes: data.notes,
      });
    }
  };
  
  const handleMarkAsReturned = (studentNoteId: number, condition: string) => {
    returnNoteMutation.mutate({ id: studentNoteId, condition });
  };
  
  const getStudentName = (studentId: number) => {
    if (!students) return "Unknown";
    const student = students.find(s => s.id === studentId);
    return student ? student.fullName : "Unknown";
  };
  
  // Get condition badge color
  const getConditionColor = (condition: string | null) => {
    if (!condition) return "secondary";
    switch (condition) {
      case "excellent": return "green";
      case "good": return "blue";
      case "fair": return "yellow";
      case "poor": return "destructive";
      default: return "secondary";
    }
  };
  
  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  return (
    <div className="container max-w-7xl mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publication Notes</h1>
          <p className="text-muted-foreground">
            Manage your educational materials inventory and distribution
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Publication
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Publications</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <PublicationNotesTable 
              notes={getFilteredNotes()} 
              onEditStock={handleOpenEditStock}
              onOpenDistribution={handleOpenDistribution}
            />
          )}
        </TabsContent>
        
        <TabsContent value="lowstock">
          {isLowStockLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <PublicationNotesTable 
              notes={getFilteredNotes()} 
              onEditStock={handleOpenEditStock}
              onOpenDistribution={handleOpenDistribution}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Publication Note Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Publication Note</DialogTitle>
            <DialogDescription>
              Enter the details for the new publication note.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddNote)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Math Textbook Grade 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                          <SelectItem value="Biology">Biology</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="History">History</SelectItem>
                          <SelectItem value="Geography">Geography</SelectItem>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
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
                          <SelectItem value="5th">5th</SelectItem>
                          <SelectItem value="6th">6th</SelectItem>
                          <SelectItem value="7th">7th</SelectItem>
                          <SelectItem value="8th">8th</SelectItem>
                          <SelectItem value="9th">9th</SelectItem>
                          <SelectItem value="10th">10th</SelectItem>
                          <SelectItem value="11th">11th</SelectItem>
                          <SelectItem value="12th">12th</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={addForm.control}
                  name="totalStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="availableStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Alert</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the content..." 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addNoteMutation.isPending}>
                  {addNoteMutation.isPending ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>Add Publication</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Stock Dialog */}
      <Dialog open={isEditStockDialogOpen} onOpenChange={setIsEditStockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock Levels</DialogTitle>
            <DialogDescription>
              Update the stock levels for this publication note.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...stockForm}>
            <form onSubmit={stockForm.handleSubmit(handleUpdateStock)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={stockForm.control}
                  name="totalStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} 
                          onChange={e => {
                            const value = parseInt(e.target.value);
                            field.onChange(value);
                          }} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={stockForm.control}
                  name="availableStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} 
                          onChange={e => {
                            const value = parseInt(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsEditStockDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStockMutation.isPending}>
                  {updateStockMutation.isPending ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>Update Stock</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Distribution Management Dialog */}
      <Dialog open={isDistributionDialogOpen} onOpenChange={setIsDistributionDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Publication Distribution</DialogTitle>
            <DialogDescription>
              Manage distribution of {getSelectedNote()?.title} ({getSelectedNote()?.subject} - {getSelectedNote()?.grade})
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="assigned">
            <TabsList>
              <TabsTrigger value="assigned">Current Distribution</TabsTrigger>
              <TabsTrigger value="assign">Assign New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assigned">
              {isStudentNotesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCcw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : studentNotes && studentNotes.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Date Issued</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentNotes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell>{getStudentName(note.studentId)}</TableCell>
                          <TableCell>{formatDate(note.dateIssued)}</TableCell>
                          <TableCell>
                            {note.isReturned ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="mr-1 h-3 w-3" /> Returned {note.returnDate ? `(${formatDate(note.returnDate)})` : ''}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <BookOpen className="mr-1 h-3 w-3" /> Issued
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`bg-${getConditionColor(note.condition)}-50 text-${getConditionColor(note.condition)}-700 border-${getConditionColor(note.condition)}-200`}>
                              {note.condition || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{note.notes || "-"}</TableCell>
                          <TableCell>
                            {!note.isReturned && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsReturned(note.id, note.condition || "good")}
                              >
                                Mark as Returned
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <LibraryBig className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Distribution Records</h3>
                  <p className="text-muted-foreground">This publication has not been distributed to any students yet.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="assign">
              <Form {...distributionForm}>
                <form onSubmit={distributionForm.handleSubmit(handleAssignNote)} className="space-y-4">
                  <FormField
                    control={distributionForm.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isStudentsLoading ? (
                              <SelectItem value="loading" disabled>Loading students...</SelectItem>
                            ) : students && students.length > 0 ? (
                              students.map((student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.fullName} {student.grade ? `(${student.grade})` : ''}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No students available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={distributionForm.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={distributionForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any notes about this distribution" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator className="my-4" />
                  
                  <div className="flex items-center bg-amber-50 p-4 rounded-md">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <div className="text-sm text-amber-700">
                      <p>Current available stock: {getSelectedNote()?.availableStock || 0}</p>
                      <p className="font-medium">
                        {(getSelectedNote()?.availableStock || 0) <= 0 ? 
                          'Warning: No copies available for distribution!' : 
                          'This action will reduce the available stock by 1.'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={
                        assignNoteMutation.isPending || 
                        (getSelectedNote()?.availableStock || 0) <= 0 ||
                        distributionForm.getValues().studentId === 0
                      }
                    >
                      {assignNoteMutation.isPending ? (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>Assign</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Component for the publication notes table
const PublicationNotesTable = ({ 
  notes, 
  onEditStock, 
  onOpenDistribution 
}: { 
  notes: PublicationNote[]; 
  onEditStock: (note: PublicationNote) => void;
  onOpenDistribution: (note: PublicationNote) => void;
}) => {
  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Publication Notes</h3>
          <p className="text-muted-foreground">Create your first publication note to get started.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Last Restocked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="font-medium">{note.title}</TableCell>
                <TableCell>{note.subject}</TableCell>
                <TableCell>{note.grade}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>
                      {note.availableStock} / {note.totalStock} available
                    </span>
                    {note.availableStock <= note.lowStockThreshold && (
                      <Badge variant="destructive" className="w-fit mt-1">
                        Low Stock
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{new Date(note.lastRestocked).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEditStock(note)}>
                      <Edit className="h-4 w-4 mr-1" /> Stock
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenDistribution(note)}>
                      <BookOpen className="h-4 w-4 mr-1" /> Distribute
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PublicationNotesPage;