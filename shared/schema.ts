import { pgTable, text, serial, integer, boolean, date, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull().default("student"),
  grade: text("grade"),
  joinDate: timestamp("join_date").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  grade: true,
});

// Students model for detailed student information
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  parentName: text("parent_name"),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  userId: true,
  parentName: true,
  phone: true,
  address: true,
  dateOfBirth: true,
});

// Classes model
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: integer("teacher_id").notNull(),
  grade: text("grade").notNull(),
  schedule: text("schedule"),
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
  teacherId: true,
  grade: true,
  schedule: true,
});

// Attendance model
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  studentId: integer("student_id").notNull(),
  date: date("date").notNull(),
  status: text("status", { enum: ["present", "absent", "late"] }).notNull().default("absent"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  classId: true,
  studentId: true,
  date: true,
  status: true,
});

// Test results model
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull(),
  studentId: integer("student_id").notNull(),
  date: date("date").notNull(),
  score: real("score").notNull(),
  maxScore: real("max_score").notNull().default(100),
  status: text("status", { enum: ["pending", "graded"] }).notNull().default("pending"),
});

export const insertTestResultSchema = createInsertSchema(testResults).pick({
  name: true,
  classId: true,
  studentId: true,
  date: true,
  score: true,
  maxScore: true,
  status: true,
});

// Financial installments model
export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  amount: real("amount").notNull(),
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  status: text("status", { enum: ["paid", "pending", "overdue"] }).notNull().default("pending"),
});

export const insertInstallmentSchema = createInsertSchema(installments).pick({
  studentId: true,
  amount: true,
  dueDate: true,
  paymentDate: true,
  status: true,
});

// Events model
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  time: text("time"),
  targetGrades: text("target_grades"),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  date: true,
  time: true,
  targetGrades: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;

export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type Installment = typeof installments.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Teacher Payments model
export const teacherPayments = pgTable("teacher_payments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  amount: real("amount").notNull(),
  month: text("month").notNull(), // Format: YYYY-MM
  description: text("description"),
  paymentDate: date("payment_date").notNull(),
  status: text("status", { enum: ["paid", "pending"] }).notNull().default("pending"),
});

export const insertTeacherPaymentSchema = createInsertSchema(teacherPayments).pick({
  teacherId: true,
  amount: true,
  month: true,
  description: true,
  paymentDate: true,
  status: true,
});

export type InsertTeacherPayment = z.infer<typeof insertTeacherPaymentSchema>;
export type TeacherPayment = typeof teacherPayments.$inferSelect;
