import { IStorage } from '../storage';
import session from 'express-session';
import { Store } from 'express-session';
import { 
  User, Student, Class, Attendance, TestResult, Installment, Event, 
  IUser, IStudent, IClass, IAttendance, ITestResult, IInstallment, IEvent 
} from './models';
import { 
  User as SelectUser, Student as SelectStudent, Class as SelectClass,
  Attendance as SelectAttendance, TestResult as SelectTestResult,
  Installment as SelectInstallment, Event as SelectEvent,
  InsertUser, InsertStudent, InsertClass, InsertAttendance,
  InsertTestResult, InsertInstallment, InsertEvent
} from '@shared/schema';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

// Helper function to convert MongoDB document to our schema type
function toUser(doc: IUser): SelectUser {
  return {
    id: parseInt(doc._id?.toString() || '0'),
    username: doc.username,
    password: doc.password,
    fullName: doc.fullName,
    email: doc.email,
    role: doc.role as "admin" | "teacher" | "student",
    grade: doc.grade || null,
    joinDate: doc.joinDate ? doc.joinDate : new Date()
  };
}

function toStudent(doc: IStudent): SelectStudent {
  return {
    id: parseInt(doc._id?.toString() || '0'),
    userId: doc.userId,
    parentName: doc.parentName || null,
    phone: doc.phone || null,
    address: doc.address || null,
    dateOfBirth: doc.dateOfBirth ? doc.dateOfBirth.toISOString() : null
  };
}

function toClass(doc: IClass): SelectClass {
  return {
    id: parseInt(doc._id?.toString() || '0'),
    name: doc.name,
    grade: doc.grade,
    teacherId: doc.teacherId,
    schedule: doc.schedule || null
  };
}

function toAttendance(doc: IAttendance): SelectAttendance {
  return {
    id: parseInt(doc._id?.toString() || '0'),
    studentId: doc.studentId,
    classId: doc.classId,
    date: doc.date.toISOString(),
    status: doc.status as "present" | "absent" | "late"
  };
}

function toTestResult(doc: ITestResult): SelectTestResult {
  return {
    id: parseInt(doc._id?.toString() || '0'),
    name: doc.name,
    studentId: doc.studentId,
    classId: doc.classId,
    date: doc.date.toISOString(),
    score: doc.score,
    maxScore: doc.maxScore,
    status: doc.status as "pending" | "graded"
  };
}

function toInstallment(doc: IInstallment): SelectInstallment {
  return {
    id: parseInt(doc._id?.toString() || '0'),
    studentId: doc.studentId,
    amount: doc.amount,
    dueDate: doc.dueDate.toISOString(),
    paymentDate: doc.paymentDate ? doc.paymentDate.toISOString() : null,
    status: doc.status as "pending" | "paid" | "overdue"
  };
}

function toEvent(doc: IEvent): SelectEvent {
  return {
    id: parseInt(doc._id?.toString() || '0'),
    title: doc.title,
    description: doc.description || null,
    date: doc.date.toISOString(),
    time: doc.time || null,
    targetGrades: doc.targetGrades || null
  };
}

export class MongoDBStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    // Initialize MongoDB session store
    this.sessionStore = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/edumanage',
      ttl: 60 * 60 * 24 // 1 day
    });
  }

  // User related methods
  async getUser(id: number): Promise<SelectUser | undefined> {
    try {
      const user = await User.findById(id);
      return user ? toUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<SelectUser | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? toUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<SelectUser> {
    try {
      const newUser = new User(user);
      await newUser.save();
      return toUser(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUsers(): Promise<SelectUser[]> {
    try {
      const users = await User.find();
      return users.map(user => toUser(user));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async getUsersByRole(role: string): Promise<SelectUser[]> {
    try {
      const users = await User.find({ role });
      return users.map(user => toUser(user));
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  // Student related methods
  async getStudent(id: number): Promise<SelectStudent | undefined> {
    try {
      const student = await Student.findById(id);
      return student ? toStudent(student) : undefined;
    } catch (error) {
      console.error('Error getting student:', error);
      return undefined;
    }
  }

  async getStudentByUserId(userId: number): Promise<SelectStudent | undefined> {
    try {
      const student = await Student.findOne({ userId });
      return student ? toStudent(student) : undefined;
    } catch (error) {
      console.error('Error getting student by user ID:', error);
      return undefined;
    }
  }

  async createStudent(student: InsertStudent): Promise<SelectStudent> {
    try {
      const newStudent = new Student(student);
      await newStudent.save();
      return toStudent(newStudent);
    } catch (error) {
      console.error('Error creating student:', error);
      throw new Error('Failed to create student');
    }
  }

  async getStudents(): Promise<SelectStudent[]> {
    try {
      const students = await Student.find();
      return students.map(student => toStudent(student));
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  // Class related methods
  async getClass(id: number): Promise<SelectClass | undefined> {
    try {
      const classDoc = await Class.findById(id);
      return classDoc ? toClass(classDoc) : undefined;
    } catch (error) {
      console.error('Error getting class:', error);
      return undefined;
    }
  }

  async getClasses(): Promise<SelectClass[]> {
    try {
      const classes = await Class.find();
      return classes.map(classDoc => toClass(classDoc));
    } catch (error) {
      console.error('Error getting classes:', error);
      return [];
    }
  }

  async getClassesByTeacher(teacherId: number): Promise<SelectClass[]> {
    try {
      const classes = await Class.find({ teacherId });
      return classes.map(classDoc => toClass(classDoc));
    } catch (error) {
      console.error('Error getting classes by teacher:', error);
      return [];
    }
  }

  async createClass(classData: InsertClass): Promise<SelectClass> {
    try {
      const newClass = new Class(classData);
      await newClass.save();
      return toClass(newClass);
    } catch (error) {
      console.error('Error creating class:', error);
      throw new Error('Failed to create class');
    }
  }

  // Attendance related methods
  async getAttendance(id: number): Promise<SelectAttendance | undefined> {
    try {
      const attendance = await Attendance.findById(id);
      return attendance ? toAttendance(attendance) : undefined;
    } catch (error) {
      console.error('Error getting attendance:', error);
      return undefined;
    }
  }

  async getAttendanceByClass(classId: number): Promise<SelectAttendance[]> {
    try {
      const attendances = await Attendance.find({ classId });
      return attendances.map(attendance => toAttendance(attendance));
    } catch (error) {
      console.error('Error getting attendance by class:', error);
      return [];
    }
  }

  async getAttendanceByStudent(studentId: number): Promise<SelectAttendance[]> {
    try {
      const attendances = await Attendance.find({ studentId });
      return attendances.map(attendance => toAttendance(attendance));
    } catch (error) {
      console.error('Error getting attendance by student:', error);
      return [];
    }
  }

  async getAttendanceByDate(date: Date): Promise<SelectAttendance[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const attendances = await Attendance.find({
        date: { $gte: startOfDay, $lte: endOfDay }
      });
      
      return attendances.map(attendance => toAttendance(attendance));
    } catch (error) {
      console.error('Error getting attendance by date:', error);
      return [];
    }
  }

  async createAttendance(attendance: InsertAttendance): Promise<SelectAttendance> {
    try {
      const newAttendance = new Attendance(attendance);
      await newAttendance.save();
      return toAttendance(newAttendance);
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw new Error('Failed to create attendance');
    }
  }

  async updateAttendance(id: number, status: string): Promise<SelectAttendance | undefined> {
    try {
      const attendance = await Attendance.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      return attendance ? toAttendance(attendance) : undefined;
    } catch (error) {
      console.error('Error updating attendance:', error);
      return undefined;
    }
  }

  // Test results related methods
  async getTestResult(id: number): Promise<SelectTestResult | undefined> {
    try {
      const result = await TestResult.findById(id);
      return result ? toTestResult(result) : undefined;
    } catch (error) {
      console.error('Error getting test result:', error);
      return undefined;
    }
  }

  async getTestResultsByClass(classId: number): Promise<SelectTestResult[]> {
    try {
      const results = await TestResult.find({ classId });
      return results.map(result => toTestResult(result));
    } catch (error) {
      console.error('Error getting test results by class:', error);
      return [];
    }
  }

  async getTestResultsByStudent(studentId: number): Promise<SelectTestResult[]> {
    try {
      const results = await TestResult.find({ studentId });
      return results.map(result => toTestResult(result));
    } catch (error) {
      console.error('Error getting test results by student:', error);
      return [];
    }
  }

  async createTestResult(result: InsertTestResult): Promise<SelectTestResult> {
    try {
      const newResult = new TestResult(result);
      await newResult.save();
      return toTestResult(newResult);
    } catch (error) {
      console.error('Error creating test result:', error);
      throw new Error('Failed to create test result');
    }
  }

  async updateTestResult(id: number, score: number, status: string): Promise<SelectTestResult | undefined> {
    try {
      const result = await TestResult.findByIdAndUpdate(
        id,
        { score, status },
        { new: true }
      );
      return result ? toTestResult(result) : undefined;
    } catch (error) {
      console.error('Error updating test result:', error);
      return undefined;
    }
  }

  // Installment related methods
  async getInstallment(id: number): Promise<SelectInstallment | undefined> {
    try {
      const installment = await Installment.findById(id);
      return installment ? toInstallment(installment) : undefined;
    } catch (error) {
      console.error('Error getting installment:', error);
      return undefined;
    }
  }

  async getInstallmentsByStudent(studentId: number): Promise<SelectInstallment[]> {
    try {
      const installments = await Installment.find({ studentId });
      return installments.map(installment => toInstallment(installment));
    } catch (error) {
      console.error('Error getting installments by student:', error);
      return [];
    }
  }

  async getInstallmentsByStatus(status: string): Promise<SelectInstallment[]> {
    try {
      const installments = await Installment.find({ status });
      return installments.map(installment => toInstallment(installment));
    } catch (error) {
      console.error('Error getting installments by status:', error);
      return [];
    }
  }

  async createInstallment(installment: InsertInstallment): Promise<SelectInstallment> {
    try {
      const newInstallment = new Installment(installment);
      await newInstallment.save();
      return toInstallment(newInstallment);
    } catch (error) {
      console.error('Error creating installment:', error);
      throw new Error('Failed to create installment');
    }
  }

  async updateInstallment(id: number, status: string, paymentDate?: Date): Promise<SelectInstallment | undefined> {
    try {
      const updateData: any = { status };
      if (paymentDate) {
        updateData.paymentDate = paymentDate;
      }
      
      const installment = await Installment.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      
      return installment ? toInstallment(installment) : undefined;
    } catch (error) {
      console.error('Error updating installment:', error);
      return undefined;
    }
  }

  // Event related methods
  async getEvent(id: number): Promise<SelectEvent | undefined> {
    try {
      const event = await Event.findById(id);
      return event ? toEvent(event) : undefined;
    } catch (error) {
      console.error('Error getting event:', error);
      return undefined;
    }
  }

  async getEvents(): Promise<SelectEvent[]> {
    try {
      const events = await Event.find();
      return events.map(event => toEvent(event));
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async createEvent(event: InsertEvent): Promise<SelectEvent> {
    try {
      const newEvent = new Event(event);
      await newEvent.save();
      return toEvent(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }
}