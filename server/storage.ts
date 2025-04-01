import { 
  User, InsertUser, 
  Student, InsertStudent, 
  Class, InsertClass, 
  Attendance, InsertAttendance, 
  TestResult, InsertTestResult, 
  Installment, InsertInstallment, 
  Event, InsertEvent,
  TeacherPayment, InsertTeacherPayment
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";
import { SupabaseStorage } from './db/supabase-storage';
import { initSupabase } from './db/supabase';

// Create a memory store for sessions
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Student related methods
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getStudents(): Promise<Student[]>;
  
  // Class related methods
  getClass(id: number): Promise<Class | undefined>;
  getClasses(): Promise<Class[]>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  
  // Attendance related methods
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByClass(classId: number): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, status: string): Promise<Attendance | undefined>;
  
  // Test results related methods
  getTestResult(id: number): Promise<TestResult | undefined>;
  getTestResultsByClass(classId: number): Promise<TestResult[]>;
  getTestResultsByStudent(studentId: number): Promise<TestResult[]>;
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  updateTestResult(id: number, score: number, status: string): Promise<TestResult | undefined>;
  
  // Installment related methods
  getInstallment(id: number): Promise<Installment | undefined>;
  getInstallmentsByStudent(studentId: number): Promise<Installment[]>;
  getInstallmentsByStatus(status: string): Promise<Installment[]>;
  createInstallment(installment: InsertInstallment): Promise<Installment>;
  updateInstallment(id: number, status: string, paymentDate?: Date): Promise<Installment | undefined>;
  
  // Event related methods
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Teacher Payment related methods
  getTeacherPayment(id: number): Promise<TeacherPayment | undefined>;
  getTeacherPaymentsByTeacher(teacherId: number): Promise<TeacherPayment[]>;
  getTeacherPaymentsByMonth(month: string): Promise<TeacherPayment[]>;
  getTeacherPaymentsByStatus(status: string): Promise<TeacherPayment[]>;
  createTeacherPayment(payment: InsertTeacherPayment): Promise<TeacherPayment>;
  updateTeacherPayment(id: number, status: string, paymentDate?: Date): Promise<TeacherPayment | undefined>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private classes: Map<number, Class>;
  private attendance: Map<number, Attendance>;
  private testResults: Map<number, TestResult>;
  private installments: Map<number, Installment>;
  private events: Map<number, Event>;
  private teacherPayments: Map<number, TeacherPayment>;
  
  currentUserId: number;
  currentStudentId: number;
  currentClassId: number;
  currentAttendanceId: number;
  currentTestResultId: number;
  currentInstallmentId: number;
  currentEventId: number;
  currentTeacherPaymentId: number;
  
  sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.classes = new Map();
    this.attendance = new Map();
    this.testResults = new Map();
    this.installments = new Map();
    this.events = new Map();
    this.teacherPayments = new Map();
    
    this.currentUserId = 1;
    this.currentStudentId = 1;
    this.currentClassId = 1;
    this.currentAttendanceId = 1;
    this.currentTestResultId = 1;
    this.currentInstallmentId = 1;
    this.currentEventId = 1;
    this.currentTeacherPaymentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add sample data
    this.addSampleData();
  }
  
  private async addSampleData() {
    try {
      // Create admin user
      const adminUser = await this.createUser({
        username: "admin",
        password: "$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe", // "admin123"
        fullName: "Administrator",
        email: "admin@vyawahare.edu",
        role: "admin"
      });
      
      // Create teacher user
      const teacherUser = await this.createUser({
        username: "teacher1",
        password: "$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe", // "admin123"
        fullName: "Rahul Vyawahare",
        email: "rahul@vyawahare.edu",
        role: "teacher"
      });
      
      // Create sample classes
      const class8 = await this.createClass({
        name: "Math Class 8th",
        grade: "8th",
        teacherId: teacherUser.id,
        schedule: "Monday, Wednesday, Friday 9:00 AM - 10:30 AM"
      });
      
      const class10 = await this.createClass({
        name: "Science Class 10th",
        grade: "10th",
        teacherId: teacherUser.id,
        schedule: "Tuesday, Thursday 10:30 AM - 12:00 PM"
      });
      
      // Create sample students
      const student1User = await this.createUser({
        username: "student1",
        password: "$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe", // "admin123"
        fullName: "Raj Patel",
        email: "raj@example.com",
        role: "student",
        grade: "8th"
      });
      
      const student1 = await this.createStudent({
        userId: student1User.id,
        parentName: "Suresh Patel",
        phone: "9876543210",
        address: "123 Main Street, Pune",
        dateOfBirth: new Date("2010-05-15").toISOString()
      });
      
      const student2User = await this.createUser({
        username: "student2",
        password: "$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe", // "admin123"
        fullName: "Priya Sharma",
        email: "priya@example.com",
        role: "student",
        grade: "10th"
      });
      
      const student2 = await this.createStudent({
        userId: student2User.id,
        parentName: "Anita Sharma",
        phone: "9876543211",
        address: "456 Park Avenue, Pune",
        dateOfBirth: new Date("2008-07-20").toISOString()
      });
      
      // Create sample attendance records
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      await this.createAttendance({
        studentId: student1User.id,
        classId: class8.id,
        date: yesterday.toISOString(),
        status: "present"
      });
      
      await this.createAttendance({
        studentId: student1User.id,
        classId: class8.id,
        date: lastWeek.toISOString(),
        status: "absent"
      });
      
      await this.createAttendance({
        studentId: student2User.id,
        classId: class10.id,
        date: yesterday.toISOString(),
        status: "present"
      });
      
      // Create sample test results
      await this.createTestResult({
        name: "Midterm Math Exam",
        studentId: student1User.id,
        classId: class8.id,
        date: lastWeek.toISOString(),
        score: 85,
        maxScore: 100,
        status: "graded"
      });
      
      await this.createTestResult({
        name: "Science Quiz",
        studentId: student2User.id,
        classId: class10.id,
        date: yesterday.toISOString(),
        score: 75,
        maxScore: 100,
        status: "graded"
      });
      
      // Create sample installments
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      await this.createInstallment({
        studentId: student1User.id,
        amount: 5000,
        dueDate: lastMonth.toISOString(),
        paymentDate: lastMonth.toISOString(),
        status: "paid"
      });
      
      await this.createInstallment({
        studentId: student1User.id,
        amount: 5000,
        dueDate: new Date().toISOString(),
        status: "pending"
      });
      
      await this.createInstallment({
        studentId: student1User.id,
        amount: 5000,
        dueDate: nextMonth.toISOString(),
        status: "pending"
      });
      
      await this.createInstallment({
        studentId: student2User.id,
        amount: 6000,
        dueDate: lastMonth.toISOString(),
        status: "overdue"
      });
      
      await this.createInstallment({
        studentId: student2User.id,
        amount: 6000,
        dueDate: nextMonth.toISOString(),
        status: "pending"
      });
      
      // Create sample events
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      await this.createEvent({
        title: "Parent-Teacher Meeting",
        description: "Annual meeting to discuss student progress",
        date: nextWeek.toISOString(),
        time: "10:00 AM - 2:00 PM",
        targetGrades: "All"
      });
      
      const nextTwoWeeks = new Date();
      nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
      
      await this.createEvent({
        title: "Science Fair",
        description: "Annual science exhibition for students",
        date: nextTwoWeeks.toISOString(),
        time: "9:00 AM - 4:00 PM",
        targetGrades: "8th, 9th, 10th"
      });
      
      // Create sample teacher payments
      // For current month (paid)
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      await this.createTeacherPayment({
        teacherId: teacherUser.id,
        amount: 25000,
        month: currentMonth,
        description: "Monthly salary",
        paymentDate: currentDate.toISOString(),
        status: "paid"
      });
      
      // For next month (pending)
      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonthString = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
      
      await this.createTeacherPayment({
        teacherId: teacherUser.id,
        amount: 25000,
        month: nextMonthString,
        description: "Monthly salary",
        paymentDate: nextMonthDate.toISOString(),
        status: "pending"
      });
    } catch (error) {
      console.error("Failed to add sample data:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const joinDate = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      joinDate,
      role: insertUser.role || "student", 
      grade: insertUser.grade || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Student methods
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }
  
  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.userId === userId,
    );
  }
  
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const student: Student = { 
      ...insertStudent, 
      id,
      parentName: insertStudent.parentName || null,
      phone: insertStudent.phone || null,
      address: insertStudent.address || null,
      dateOfBirth: insertStudent.dateOfBirth || null
    };
    this.students.set(id, student);
    return student;
  }
  
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  // Class methods
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }
  
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }
  
  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      (cls) => cls.teacherId === teacherId,
    );
  }
  
  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = this.currentClassId++;
    const cls: Class = { 
      ...insertClass, 
      id,
      schedule: insertClass.schedule || null
    };
    this.classes.set(id, cls);
    return cls;
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }
  
  async getAttendanceByClass(classId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (attendance) => attendance.classId === classId,
    );
  }
  
  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (attendance) => attendance.studentId === studentId,
    );
  }
  
  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.attendance.values()).filter(
      (attendance) => {
        const attendanceDate = new Date(attendance.date).toISOString().split('T')[0];
        return attendanceDate === dateString;
      }
    );
  }
  
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const attendance: Attendance = { 
      ...insertAttendance, 
      id, 
      status: insertAttendance.status || "present" 
    };
    this.attendance.set(id, attendance);
    return attendance;
  }
  
  async updateAttendance(id: number, status: string): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { 
      ...attendance, 
      status: status as "present" | "absent" | "late"
    };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  // Test results methods
  async getTestResult(id: number): Promise<TestResult | undefined> {
    return this.testResults.get(id);
  }
  
  async getTestResultsByClass(classId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(
      (result) => result.classId === classId,
    );
  }
  
  async getTestResultsByStudent(studentId: number): Promise<TestResult[]> {
    return Array.from(this.testResults.values()).filter(
      (result) => result.studentId === studentId,
    );
  }
  
  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const id = this.currentTestResultId++;
    const result: TestResult = { 
      ...insertResult, 
      id,
      status: insertResult.status || "pending",
      maxScore: insertResult.maxScore || 100
    };
    this.testResults.set(id, result);
    return result;
  }
  
  async updateTestResult(id: number, score: number, status: string): Promise<TestResult | undefined> {
    const result = this.testResults.get(id);
    if (!result) return undefined;
    
    const updatedResult = { 
      ...result, 
      score, 
      status: status as "pending" | "graded" 
    };
    this.testResults.set(id, updatedResult);
    return updatedResult;
  }

  // Installment methods
  async getInstallment(id: number): Promise<Installment | undefined> {
    return this.installments.get(id);
  }
  
  async getInstallmentsByStudent(studentId: number): Promise<Installment[]> {
    return Array.from(this.installments.values()).filter(
      (installment) => installment.studentId === studentId,
    );
  }
  
  async getInstallmentsByStatus(status: string): Promise<Installment[]> {
    return Array.from(this.installments.values()).filter(
      (installment) => installment.status === status,
    );
  }
  
  async createInstallment(insertInstallment: InsertInstallment): Promise<Installment> {
    const id = this.currentInstallmentId++;
    const installment: Installment = { 
      ...insertInstallment, 
      id,
      status: insertInstallment.status || "pending",
      paymentDate: insertInstallment.paymentDate || null
    };
    this.installments.set(id, installment);
    return installment;
  }
  
  async updateInstallment(id: number, status: string, paymentDate?: Date): Promise<Installment | undefined> {
    const installment = this.installments.get(id);
    if (!installment) return undefined;
    
    // Convert Date to string for storage
    let paymentDateStr: string | null = null;
    if (paymentDate) {
      paymentDateStr = paymentDate.toISOString();
    }
    
    const updatedInstallment = { 
      ...installment, 
      status: status as "paid" | "pending" | "overdue",
      paymentDate: paymentDateStr
    };
    this.installments.set(id, updatedInstallment);
    return updatedInstallment;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = { 
      ...insertEvent, 
      id,
      description: insertEvent.description || null,
      time: insertEvent.time || null,
      targetGrades: insertEvent.targetGrades || null
    };
    this.events.set(id, event);
    return event;
  }

  // Teacher Payment methods
  async getTeacherPayment(id: number): Promise<TeacherPayment | undefined> {
    return this.teacherPayments.get(id);
  }
  
  async getTeacherPaymentsByTeacher(teacherId: number): Promise<TeacherPayment[]> {
    return Array.from(this.teacherPayments.values()).filter(
      (payment) => payment.teacherId === teacherId,
    );
  }
  
  async getTeacherPaymentsByMonth(month: string): Promise<TeacherPayment[]> {
    return Array.from(this.teacherPayments.values()).filter(
      (payment) => payment.month === month,
    );
  }
  
  async getTeacherPaymentsByStatus(status: string): Promise<TeacherPayment[]> {
    return Array.from(this.teacherPayments.values()).filter(
      (payment) => payment.status === status,
    );
  }
  
  async createTeacherPayment(insertPayment: InsertTeacherPayment): Promise<TeacherPayment> {
    const id = this.currentTeacherPaymentId++;
    const payment: TeacherPayment = { 
      ...insertPayment, 
      id,
      description: insertPayment.description || null,
      status: insertPayment.status || "pending"
    };
    this.teacherPayments.set(id, payment);
    return payment;
  }
  
  async updateTeacherPayment(id: number, status: string, paymentDate?: Date): Promise<TeacherPayment | undefined> {
    const payment = this.teacherPayments.get(id);
    if (!payment) return undefined;
    
    // Convert Date to string for storage if provided
    let paymentDateStr = payment.paymentDate;
    if (paymentDate) {
      paymentDateStr = paymentDate.toISOString();
    }
    
    const updatedPayment = { 
      ...payment, 
      status: status as "paid" | "pending",
      paymentDate: paymentDateStr
    };
    this.teacherPayments.set(id, updatedPayment);
    return updatedPayment;
  }
}

// Configure which storage to use
// Set to true to use Supabase for persistence
const USE_SUPABASE = true; 

// Export the appropriate storage implementation
export const storage = USE_SUPABASE 
  ? new SupabaseStorage() 
  : new MemStorage();

// Initialize Supabase connection if we're using it
if (USE_SUPABASE) {
  initSupabase()
    .then(connected => {
      if (!connected) {
        console.warn('[supabase] Failed to connect to Supabase, falling back to in-memory storage');
      }
    })
    .catch(err => {
      console.error('[supabase] Error initializing Supabase:', err);
    });
}