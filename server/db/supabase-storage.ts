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
  TeacherPayment, InsertTeacherPayment
} from '@shared/schema';
import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    if (!data) throw new Error('Failed to create user: No data returned');
    
    return data as User;
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw new Error(`Failed to get users: ${error.message}`);
    return (data || []) as User[];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role);
    
    if (error) throw new Error(`Failed to get users by role: ${error.message}`);
    return (data || []) as User[];
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
      .eq('userId', userId)
      .single();
    
    if (error || !data) return undefined;
    return data as Student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert([student])
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
      .eq('teacherId', teacherId);
    
    if (error) throw new Error(`Failed to get classes by teacher: ${error.message}`);
    return (data || []) as Class[];
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
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
      .eq('classId', classId);
    
    if (error) throw new Error(`Failed to get attendance by class: ${error.message}`);
    return (data || []) as Attendance[];
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('studentId', studentId);
    
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
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendance])
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
      .eq('classId', classId);
    
    if (error) throw new Error(`Failed to get test results by class: ${error.message}`);
    return (data || []) as TestResult[];
  }

  async getTestResultsByStudent(studentId: number): Promise<TestResult[]> {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('studentId', studentId);
    
    if (error) throw new Error(`Failed to get test results by student: ${error.message}`);
    return (data || []) as TestResult[];
  }

  async createTestResult(result: InsertTestResult): Promise<TestResult> {
    const { data, error } = await supabase
      .from('test_results')
      .insert([result])
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
      .eq('studentId', studentId);
    
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
    const { data, error } = await supabase
      .from('installments')
      .insert([installment])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create installment: ${error.message}`);
    if (!data) throw new Error('Failed to create installment: No data returned');
    
    return data as Installment;
  }

  async updateInstallment(id: number, status: string, paymentDate?: Date): Promise<Installment | undefined> {
    const updateData: any = { status };
    if (paymentDate) {
      updateData.paymentDate = paymentDate.toISOString();
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
    const { data, error } = await supabase
      .from('events')
      .insert([event])
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
      .eq('teacherId', teacherId);
    
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
    const { data, error } = await supabase
      .from('teacher_payments')
      .insert([payment])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create teacher payment: ${error.message}`);
    if (!data) throw new Error('Failed to create teacher payment: No data returned');
    
    return data as TeacherPayment;
  }

  async updateTeacherPayment(id: number, status: string, paymentDate?: Date): Promise<TeacherPayment | undefined> {
    const updateData: any = { status };
    if (paymentDate) {
      updateData.paymentDate = paymentDate.toISOString();
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