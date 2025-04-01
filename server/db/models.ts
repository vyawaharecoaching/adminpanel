import mongoose, { Schema, Document } from 'mongoose';

// User model interface
export interface IUser extends Document {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: "admin" | "teacher" | "student";
  grade?: string;
  joinDate: Date;
}

// Student model interface
export interface IStudent extends Document {
  userId: number;
  parentName: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: Date | null;
}

// Class model interface
export interface IClass extends Document {
  name: string;
  grade: string;
  teacherId: number;
  schedule: string | null;
}

// Attendance model interface
export interface IAttendance extends Document {
  studentId: number;
  classId: number;
  date: Date;
  status: "present" | "absent" | "late";
}

// Test Result model interface
export interface ITestResult extends Document {
  name: string;
  studentId: number;
  classId: number;
  date: Date;
  score: number;
  maxScore: number;
  status: "pending" | "graded";
}

// Installment model interface
export interface IInstallment extends Document {
  studentId: number;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: "paid" | "pending" | "overdue";
}

// Event model interface
export interface IEvent extends Document {
  title: string;
  description: string | null;
  date: Date;
  time: string | null;
  targetGrades: string | null;
}

// User Schema
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'teacher', 'student'] },
  grade: { type: String },
  joinDate: { type: Date, default: Date.now }
});

// Student Schema
const StudentSchema = new Schema<IStudent>({
  userId: { type: Number, required: true, unique: true },
  parentName: { type: String },
  phone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date }
});

// Class Schema
const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true },
  grade: { type: String, required: true },
  teacherId: { type: Number, required: true },
  schedule: { type: String }
});

// Attendance Schema
const AttendanceSchema = new Schema<IAttendance>({
  studentId: { type: Number, required: true },
  classId: { type: Number, required: true },
  date: { type: Date, required: true },
  status: { type: String, required: true, enum: ['present', 'absent', 'late'] }
});

// Test Result Schema
const TestResultSchema = new Schema<ITestResult>({
  name: { type: String, required: true },
  studentId: { type: Number, required: true },
  classId: { type: Number, required: true },
  date: { type: Date, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true, default: 100 },
  status: { type: String, required: true, enum: ['pending', 'graded'], default: 'pending' }
});

// Installment Schema
const InstallmentSchema = new Schema<IInstallment>({
  studentId: { type: Number, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paymentDate: { type: Date },
  status: { type: String, required: true, enum: ['paid', 'pending', 'overdue'], default: 'pending' }
});

// Event Schema
const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  time: { type: String },
  targetGrades: { type: String }
});

// Create and export the models
export const User = mongoose.model<IUser>('User', UserSchema);
export const Student = mongoose.model<IStudent>('Student', StudentSchema);
export const Class = mongoose.model<IClass>('Class', ClassSchema);
export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const TestResult = mongoose.model<ITestResult>('TestResult', TestResultSchema);
export const Installment = mongoose.model<IInstallment>('Installment', InstallmentSchema);
export const Event = mongoose.model<IEvent>('Event', EventSchema);