import { 
  User, InsertUser, 
  Student, InsertStudent, 
  Class, InsertClass, 
  Attendance, InsertAttendance, 
  TestResult, InsertTestResult, 
  Installment, InsertInstallment, 
  Event, InsertEvent 
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";

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
  
  currentUserId: number;
  currentStudentId: number;
  currentClassId: number;
  currentAttendanceId: number;
  currentTestResultId: number;
  currentInstallmentId: number;
  currentEventId: number;
  
  sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.classes = new Map();
    this.attendance = new Map();
    this.testResults = new Map();
    this.installments = new Map();
    this.events = new Map();
    
    this.currentUserId = 1;
    this.currentStudentId = 1;
    this.currentClassId = 1;
    this.currentAttendanceId = 1;
    this.currentTestResultId = 1;
    this.currentInstallmentId = 1;
    this.currentEventId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
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
}

import { MongoDBStorage } from './db/mongodb-storage';

// Configure which storage to use, defaulting to in-memory storage
// This can be overridden by setting USE_MONGODB environment variable to 'true'
const USE_MONGODB = process.env.USE_MONGODB === 'true';

// Export the appropriate storage implementation
// We'll default to MemStorage for simplicity and reliability
export const storage = USE_MONGODB 
  ? new MongoDBStorage() 
  : new MemStorage();
