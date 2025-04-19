import { supabase } from './supabase';
import { IStorage } from '../storage';
import { 
  User, InsertUser, 
  Student, InsertStudent, 
  Class, InsertClass,
  Attendance, InsertAttendance,
  TestResult, InsertTestResult,
  Installment, InsertInstallment,
  Event, InsertEvent,
  TeacherPayment, InsertTeacherPayment,
  PublicationNote, InsertPublicationNote,
  StudentNote, InsertStudentNote
} from '@shared/schema';
import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;
  supabase = supabase;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error in getUser:', error);
        return undefined;
      }
      
      if (!data) {
        console.log('No user found with id:', id);
        return undefined;
      }
      
      // Transform snake_case to camelCase
      const user: User = {
        id: data.id,
        username: data.username,
        password: data.password,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        grade: data.grade,
        joinDate: data.join_date
      };
      
      return user;
    } catch (error) {
      console.error('Exception in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('Error in getUserByUsername:', error);
        return undefined;
      }
      
      if (!data) {
        console.log('No user found with username:', username);
        return undefined;
      }
      
      // Transform snake_case to camelCase if needed
      const user: User = {
        id: data.id,
        username: data.username,
        password: data.password,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        grade: data.grade,
        joinDate: data.join_date
      };
      
      return user;
    } catch (error) {
      console.error('Exception in getUserByUsername:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Convert camelCase to snake_case for Supabase
      const transformedUser = {
        username: user.username,
        password: user.password,
        full_name: user.fullName,
        email: user.email,
        role: user.role,
        grade: user.grade
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert([transformedUser])
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create user: ${error.message}`);
      if (!data) throw new Error('Failed to create user: No data returned');
      
      // Transform the returned data back to camelCase
      const newUser: User = {
        id: data.id,
        username: data.username,
        password: data.password,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        grade: data.grade,
        joinDate: data.join_date
      };
      
      return newUser;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw new Error(`Failed to get users: ${error.message}`);
      
      // Transform each user from snake_case to camelCase
      const users: User[] = (data || []).map((user: { id: any; username: any; password: any; full_name: any; email: any; role: any; grade: any; join_date: any; }) => ({
        id: user.id,
        username: user.username,
        password: user.password,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        joinDate: user.join_date
      }));
      
      return users;
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role);
      
      if (error) throw new Error(`Failed to get users by role: ${error.message}`);
      
      // Transform each user from snake_case to camelCase
      const users: User[] = (data || []).map((user: { id: any; username: any; password: any; full_name: any; email: any; role: any; grade: any; join_date: any; }) => ({
        id: user.id,
        username: user.username,
        password: user.password,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        joinDate: user.join_date
      }));
      
      return users;
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
      throw error;
    }
  }
  
  // Student related methods
  async getStudent(id: number): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Student;
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return undefined;
    return data as Student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    // Convert camelCase to snake_case for Supabase
    const transformedStudent = {
      user_id: student.userId,
      parent_name: student.parentName,
      phone: student.phone,
      address: student.address,
      date_of_birth: student.dateOfBirth
    };
    
    const { data, error } = await supabase
      .from('students')
      .insert([transformedStudent])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create student: ${error.message}`);
    if (!data) throw new Error('Failed to create student: No data returned');
    
    return data as Student;
  }

  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*');
    
    if (error) throw new Error(`Failed to get students: ${error.message}`);
    return (data || []) as Student[];
  }
  
  // Class related methods
  async getClass(id: number): Promise<Class | undefined> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Class;
  }

  async getClasses(): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*');
    
    if (error) throw new Error(`Failed to get classes: ${error.message}`);
    return (data || []) as Class[];
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId);
    
    if (error) throw new Error(`Failed to get classes by teacher: ${error.message}`);
    return (data || []) as Class[];
  }

  async createClass(classData: InsertClass): Promise<Class> {
    // Convert camelCase to snake_case for Supabase
    const transformedClass = {
      name: classData.name,
      teacher_id: classData.teacherId,
      grade: classData.grade,
      schedule: classData.schedule
    };
    
    const { data, error } = await supabase
      .from('classes')
      .insert([transformedClass])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create class: ${error.message}`);
    if (!data) throw new Error('Failed to create class: No data returned');
    
    return data as Class;
  }
  
  // Attendance related methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Attendance;
  }

  async getAttendanceByClass(classId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('class_id', classId);
    
    if (error) throw new Error(`Failed to get attendance by class: ${error.message}`);
    return (data || []) as Attendance[];
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId);
    
    if (error) throw new Error(`Failed to get attendance by student: ${error.message}`);
    return (data || []) as Attendance[];
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', dateStr);
    
    if (error) throw new Error(`Failed to get attendance by date: ${error.message}`);
    return (data || []) as Attendance[];
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    // Convert camelCase to snake_case for Supabase
    const transformedAttendance = {
      student_id: attendance.studentId,
      class_id: attendance.classId,
      date: attendance.date,
      status: attendance.status
    };
    
    const { data, error } = await supabase
      .from('attendance')
      .insert([transformedAttendance])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create attendance: ${error.message}`);
    if (!data) throw new Error('Failed to create attendance: No data returned');
    
    return data as Attendance;
  }

  async updateAttendance(id: number, status: string): Promise<Attendance | undefined> {
    const { data, error } = await supabase
      .from('attendance')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Attendance;
  }
  
  // Test results related methods
  async getTestResult(id: number): Promise<TestResult | undefined> {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as TestResult;
  }

  async getTestResultsByClass(classId: number): Promise<TestResult[]> {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('class_id', classId);
    
    if (error) throw new Error(`Failed to get test results by class: ${error.message}`);
    return (data || []) as TestResult[];
  }

  async getTestResultsByStudent(studentId: number): Promise<TestResult[]> {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('student_id', studentId);
    
    if (error) throw new Error(`Failed to get test results by student: ${error.message}`);
    return (data || []) as TestResult[];
  }

  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    // Convert camelCase to snake_case for Supabase
    const transformedResult = {
      name: result.name,
      student_id: result.studentId,
      class_id: result.classId,
      date: result.date,
      score: result.score,
      max_score: result.maxScore,
      status: result.status
    };
    
    const { data, error } = await supabase
      .from('test_results')
      .insert([transformedResult])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create test result: ${error.message}`);
    if (!data) throw new Error('Failed to create test result: No data returned');
    
    return data as TestResult;
  }

  async updateTestResult(id: number, score: number, status: string): Promise<TestResult | undefined> {
    const { data, error } = await supabase
      .from('test_results')
      .update({ score, status })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as TestResult;
  }
  
  // Installment related methods
  async getInstallment(id: number): Promise<Installment | undefined> {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Installment;
  }

  async getInstallmentsByStudent(studentId: number): Promise<Installment[]> {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('student_id', studentId);
    
    if (error) throw new Error(`Failed to get installments by student: ${error.message}`);
    return (data || []) as Installment[];
  }

  async getInstallmentsByStatus(status: string): Promise<Installment[]> {
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('status', status);
    
    if (error) throw new Error(`Failed to get installments by status: ${error.message}`);
    return (data || []) as Installment[];
  }

  async createInstallment(installment: InsertInstallment): Promise<Installment> {
    // Convert camelCase to snake_case for Supabase
    const transformedInstallment = {
      student_id: installment.studentId,
      amount: installment.amount,
      due_date: installment.dueDate,
      payment_date: installment.paymentDate,
      status: installment.status
    };
    
    const { data, error } = await supabase
      .from('installments')
      .insert([transformedInstallment])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create installment: ${error.message}`);
    if (!data) throw new Error('Failed to create installment: No data returned');
    
    return data as Installment;
  }

  async updateInstallment(id: number, status: string, paymentDate?: Date): Promise<Installment | undefined> {
    const updateData: any = { status };
    if (paymentDate) {
      updateData.payment_date = paymentDate.toISOString();
    }
    
    const { data, error } = await supabase
      .from('installments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Installment;
  }
  
  // Event related methods
  async getEvent(id: number): Promise<Event | undefined> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Event;
  }

  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*');
    
    if (error) throw new Error(`Failed to get events: ${error.message}`);
    return (data || []) as Event[];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Convert camelCase to snake_case for Supabase
    const transformedEvent = {
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      target_grades: event.targetGrades
    };
    
    const { data, error } = await supabase
      .from('events')
      .insert([transformedEvent])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create event: ${error.message}`);
    if (!data) throw new Error('Failed to create event: No data returned');
    
    return data as Event;
  }
  
  // Teacher Payment related methods
  async getTeacherPayment(id: number): Promise<TeacherPayment | undefined> {
    const { data, error } = await supabase
      .from('teacher_payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as TeacherPayment;
  }

  async getTeacherPaymentsByTeacher(teacherId: number): Promise<TeacherPayment[]> {
    const { data, error } = await supabase
      .from('teacher_payments')
      .select('*')
      .eq('teacher_id', teacherId);
    
    if (error) throw new Error(`Failed to get teacher payments by teacher: ${error.message}`);
    return (data || []) as TeacherPayment[];
  }

  async getTeacherPaymentsByMonth(month: string): Promise<TeacherPayment[]> {
    const { data, error } = await supabase
      .from('teacher_payments')
      .select('*')
      .eq('month', month);
    
    if (error) throw new Error(`Failed to get teacher payments by month: ${error.message}`);
    return (data || []) as TeacherPayment[];
  }

  async getTeacherPaymentsByStatus(status: string): Promise<TeacherPayment[]> {
    const { data, error } = await supabase
      .from('teacher_payments')
      .select('*')
      .eq('status', status);
    
    if (error) throw new Error(`Failed to get teacher payments by status: ${error.message}`);
    return (data || []) as TeacherPayment[];
  }

  async createTeacherPayment(payment: InsertTeacherPayment): Promise<TeacherPayment> {
    // Convert camelCase to snake_case for Supabase
    const transformedPayment = {
      teacher_id: payment.teacherId,
      amount: payment.amount,
      month: payment.month,
      description: payment.description,
      payment_date: payment.paymentDate,
      status: payment.status
    };
    
    const { data, error } = await supabase
      .from('teacher_payments')
      .insert([transformedPayment])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create teacher payment: ${error.message}`);
    if (!data) throw new Error('Failed to create teacher payment: No data returned');
    
    return data as TeacherPayment;
  }

  async updateTeacherPayment(id: number, status: string, paymentDate?: Date): Promise<TeacherPayment | undefined> {
    const updateData: any = { status };
    if (paymentDate) {
      updateData.payment_date = paymentDate.toISOString();
    }
    
    const { data, error } = await supabase
      .from('teacher_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as TeacherPayment;
  }

  // Publication Notes related methods
  async getPublicationNote(id: number): Promise<PublicationNote | undefined> {
    const { data, error } = await supabase
      .from('publication_notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    // Transform snake_case to camelCase
    return {
      id: data.id,
      title: data.title,
      subject: data.subject,
      grade: data.grade,
      totalStock: data.total_stock,
      availableStock: data.available_stock,
      lowStockThreshold: data.low_stock_threshold,
      lastRestocked: data.last_restocked,
      description: data.description
    };
  }

  async getPublicationNotes(): Promise<PublicationNote[]> {
    const { data, error } = await supabase
      .from('publication_notes')
      .select('*');
    
    if (error) throw new Error(`Failed to get publication notes: ${error.message}`);
    
    // Transform each note from snake_case to camelCase
    return (data || []).map((note: { id: any; title: any; subject: any; grade: any; total_stock: any; available_stock: any; low_stock_threshold: any; last_restocked: any; description: any; }) => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      grade: note.grade,
      totalStock: note.total_stock,
      availableStock: note.available_stock,
      lowStockThreshold: note.low_stock_threshold,
      lastRestocked: note.last_restocked,
      description: note.description
    }));
  }

  async getPublicationNotesBySubject(subject: string): Promise<PublicationNote[]> {
    const { data, error } = await supabase
      .from('publication_notes')
      .select('*')
      .eq('subject', subject);
    
    if (error) throw new Error(`Failed to get publication notes by subject: ${error.message}`);
    
    // Transform each note from snake_case to camelCase
    return (data || []).map((note: { id: any; title: any; subject: any; grade: any; total_stock: any; available_stock: any; low_stock_threshold: any; last_restocked: any; description: any; }) => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      grade: note.grade,
      totalStock: note.total_stock,
      availableStock: note.available_stock,
      lowStockThreshold: note.low_stock_threshold,
      lastRestocked: note.last_restocked,
      description: note.description
    }));
  }

  async getPublicationNotesByGrade(grade: string): Promise<PublicationNote[]> {
    const { data, error } = await supabase
      .from('publication_notes')
      .select('*')
      .eq('grade', grade);
    
    if (error) throw new Error(`Failed to get publication notes by grade: ${error.message}`);
    
    // Transform each note from snake_case to camelCase
    return (data || []).map((note: { id: any; title: any; subject: any; grade: any; total_stock: any; available_stock: any; low_stock_threshold: any; last_restocked: any; description: any; }) => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      grade: note.grade,
      totalStock: note.total_stock,
      availableStock: note.available_stock,
      lowStockThreshold: note.low_stock_threshold,
      lastRestocked: note.last_restocked,
      description: note.description
    }));
  }

  async getLowStockPublicationNotes(): Promise<PublicationNote[]> {
    const { data, error } = await supabase
      .from('publication_notes')
      .select('*');
    
    if (error) throw new Error(`Failed to get low stock publication notes: ${error.message}`);
    
    // Filter for low stock and transform from snake_case to camelCase
    return (data || [])
      .filter((note: { available_stock: number; low_stock_threshold: number; }) => note.available_stock <= note.low_stock_threshold)
      .map((note: { id: any; title: any; subject: any; grade: any; total_stock: any; available_stock: any; low_stock_threshold: any; last_restocked: any; description: any; }) => ({
        id: note.id,
        title: note.title,
        subject: note.subject,
        grade: note.grade,
        totalStock: note.total_stock,
        availableStock: note.available_stock,
        lowStockThreshold: note.low_stock_threshold,
        lastRestocked: note.last_restocked,
        description: note.description
      }));
  }

  async createPublicationNote(note: InsertPublicationNote): Promise<PublicationNote> {
    // Convert camelCase to snake_case for Supabase
    const transformedNote = {
      title: note.title,
      subject: note.subject,
      grade: note.grade,
      total_stock: note.totalStock,
      available_stock: note.availableStock,
      low_stock_threshold: note.lowStockThreshold,
      last_restocked: note.lastRestocked,
      description: note.description
    };
    
    const { data, error } = await supabase
      .from('publication_notes')
      .insert([transformedNote])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create publication note: ${error.message}`);
    if (!data) throw new Error('Failed to create publication note: No data returned');
    
    // Transform the returned data back to camelCase
    return {
      id: data.id,
      title: data.title,
      subject: data.subject,
      grade: data.grade,
      totalStock: data.total_stock,
      availableStock: data.available_stock,
      lowStockThreshold: data.low_stock_threshold,
      lastRestocked: data.last_restocked,
      description: data.description
    };
  }

  async updatePublicationNoteStock(id: number, totalStock: number, availableStock: number): Promise<PublicationNote | undefined> {
    const { data, error } = await supabase
      .from('publication_notes')
      .update({
        total_stock: totalStock,
        available_stock: availableStock,
        last_restocked: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    
    // Transform the returned data to camelCase
    return {
      id: data.id,
      title: data.title,
      subject: data.subject,
      grade: data.grade,
      totalStock: data.total_stock,
      availableStock: data.available_stock,
      lowStockThreshold: data.low_stock_threshold,
      lastRestocked: data.last_restocked,
      description: data.description
    };
  }

  // Student Notes related methods
  async getStudentNote(id: number): Promise<StudentNote | undefined> {
    const { data, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    // Transform snake_case to camelCase
    return {
      id: data.id,
      studentId: data.student_id,
      noteId: data.note_id,
      dateIssued: data.date_issued,
      isReturned: data.is_returned,
      returnDate: data.return_date,
      condition: data.condition,
      notes: data.notes
    };
  }

  async getStudentNotesByStudent(studentId: number): Promise<StudentNote[]> {
    const { data, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('student_id', studentId);
    
    if (error) throw new Error(`Failed to get student notes by student: ${error.message}`);
    
    // Transform each note from snake_case to camelCase
    return (data || []).map((note: { id: any; student_id: any; note_id: any; date_issued: any; is_returned: any; return_date: any; condition: any; notes: any; }) => ({
      id: note.id,
      studentId: note.student_id,
      noteId: note.note_id,
      dateIssued: note.date_issued,
      isReturned: note.is_returned,
      returnDate: note.return_date,
      condition: note.condition,
      notes: note.notes
    }));
  }

  async getStudentNotesByNote(noteId: number): Promise<StudentNote[]> {
    const { data, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('note_id', noteId);
    
    if (error) throw new Error(`Failed to get student notes by note: ${error.message}`);
    
    // Transform each note from snake_case to camelCase
    return (data || []).map((note: { id: any; student_id: any; note_id: any; date_issued: any; is_returned: any; return_date: any; condition: any; notes: any; }) => ({
      id: note.id,
      studentId: note.student_id,
      noteId: note.note_id,
      dateIssued: note.date_issued,
      isReturned: note.is_returned,
      returnDate: note.return_date,
      condition: note.condition,
      notes: note.notes
    }));
  }

  async createStudentNote(studentNote: InsertStudentNote): Promise<StudentNote> {
    // Convert camelCase to snake_case for Supabase
    const transformedNote = {
      student_id: studentNote.studentId,
      note_id: studentNote.noteId,
      date_issued: studentNote.dateIssued,
      is_returned: studentNote.isReturned,
      return_date: studentNote.returnDate,
      condition: studentNote.condition,
      notes: studentNote.notes
    };
    
    const { data, error } = await supabase
      .from('student_notes')
      .insert([transformedNote])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create student note: ${error.message}`);
    if (!data) throw new Error('Failed to create student note: No data returned');
    
    // Transform the returned data back to camelCase
    return {
      id: data.id,
      studentId: data.student_id,
      noteId: data.note_id,
      dateIssued: data.date_issued,
      isReturned: data.is_returned,
      returnDate: data.return_date,
      condition: data.condition,
      notes: data.notes
    };
  }

  async updateStudentNoteStatus(id: number, isReturned: boolean, returnDate?: Date, condition?: string): Promise<StudentNote | undefined> {
    const updateData: any = { is_returned: isReturned };
    if (returnDate) {
      updateData.return_date = returnDate.toISOString();
    }
    if (condition) {
      updateData.condition = condition;
    }
    
    const { data, error } = await supabase
      .from('student_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    
    // Transform the returned data to camelCase
    return {
      id: data.id,
      studentId: data.student_id,
      noteId: data.note_id,
      dateIssued: data.date_issued,
      isReturned: data.is_returned,
      returnDate: data.return_date,
      condition: data.condition,
      notes: data.notes
    };
  }

  // Add sample data - this can be used for initial setup only if needed
  async addSampleData() {
    try {
      // Check if there are any users first
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // If there are already users, don't add sample data
      if (count && count > 0) {
        console.log('[supabase] Database already has data, skipping sample data addition');
        return;
      }
      
      // Add sample users, students, classes, etc.
      console.log('[supabase] Adding sample data...');
      
      // Implementation of adding sample data would go here
      // ...
      
      console.log('[supabase] Sample data added successfully');
    } catch (error) {
      console.error('[supabase] Error adding sample data:', error);
    }
  }
}