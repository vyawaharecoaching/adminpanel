import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertClassSchema, 
  insertAttendanceSchema, 
  insertTestResultSchema, 
  insertInstallmentSchema, 
  insertEventSchema,
  insertTeacherPaymentSchema
} from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up in-memory storage for development
  process.env.USE_SUPABASE = 'false';
  console.log('[storage] Using in-memory storage for development');
  
  // Debug endpoint to check the database connection
  app.get("/api/debug/check-db", async (req: Request, res: Response) => {
    try {
      // Check if users exist
      const users = await storage.getUsers();
      
      res.json({
        usersCount: users?.length || 0,
        connectionStatus: 'connected',
        tablesExist: true
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error checking database",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint to view students without authentication  
  app.get("/api/debug/students", async (req: Request, res: Response) => {
    try {
      const students = await storage.getUsersByRole("student");
      
      // If no students are found, return sample data for testing
      if (!students || students.length === 0) {
        return res.json([
          { id: 101, fullName: "Ananya Sharma", role: "student", grade: "10th" },
          { id: 102, fullName: "Rahul Patel", role: "student", grade: "8th" },
          { id: 103, fullName: "Priya Desai", role: "student", grade: "12th" },
          { id: 104, fullName: "Arjun Singh", role: "student", grade: "9th" }
        ]);
      }
      
      res.json(students);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching students",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Debug endpoint to view installments without authentication
  app.get("/api/debug/installments", async (req: Request, res: Response) => {
    try {
      const pendingInstallments = await storage.getInstallmentsByStatus("pending");
      const overdueInstallments = await storage.getInstallmentsByStatus("overdue");
      const paidInstallments = await storage.getInstallmentsByStatus("paid");
      
      // Check if we have any installments, if not return sample data for testing
      const hasInstallments = 
        (pendingInstallments && pendingInstallments.length > 0) || 
        (overdueInstallments && overdueInstallments.length > 0) || 
        (paidInstallments && paidInstallments.length > 0);
      
      if (!hasInstallments) {
        const date = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(date.getMonth() - 1);
        const nextMonth = new Date();
        nextMonth.setMonth(date.getMonth() + 1);
        
        const samplePending = [
          { id: 1001, studentId: 101, amount: 5000, dueDate: date.toISOString(), status: "pending" },
          { id: 1002, studentId: 103, amount: 6000, dueDate: nextMonth.toISOString(), status: "pending" }
        ];
        
        const sampleOverdue = [
          { id: 1003, studentId: 102, amount: 4500, dueDate: lastMonth.toISOString(), status: "overdue" },
          { id: 1004, studentId: 104, amount: 5500, dueDate: lastMonth.toISOString(), status: "overdue" }
        ];
        
        const samplePaid = [
          { id: 1005, studentId: 101, amount: 5000, dueDate: lastMonth.toISOString(), paymentDate: lastMonth.toISOString(), status: "paid" },
          { id: 1006, studentId: 103, amount: 6000, dueDate: lastMonth.toISOString(), paymentDate: lastMonth.toISOString(), status: "paid" }
        ];
        
        return res.json({
          pending: samplePending,
          overdue: sampleOverdue,
          paid: samplePaid,
          all: [...samplePending, ...sampleOverdue, ...samplePaid]
        });
      }
      
      res.json({
        pending: pendingInstallments,
        overdue: overdueInstallments,
        paid: paidInstallments,
        all: [...pendingInstallments, ...overdueInstallments, ...paidInstallments]
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching installments",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Debug endpoint to view test results without authentication
  app.get("/api/debug/test-results", async (req: Request, res: Response) => {
    try {
      // We need to collect test results differently since there's no direct getTestResults method
      const classes = await storage.getClasses();
      const testResults = [];
      
      for (const cls of classes) {
        const results = await storage.getTestResultsByClass(cls.id);
        if (results && results.length > 0) {
          testResults.push(...results);
        }
      }
      
      // If no test results are found, return sample data for testing
      if (testResults.length === 0) {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        
        const sampleTestResults = [
          { 
            id: 2001, 
            name: "Math Midterm", 
            studentId: 101, 
            classId: 501, 
            date: lastWeek.toISOString(), 
            score: 85, 
            maxScore: 100, 
            status: "graded" 
          },
          { 
            id: 2002, 
            name: "Science Quiz", 
            studentId: 102, 
            classId: 502, 
            date: today.toISOString(), 
            score: 72, 
            maxScore: 100, 
            status: "graded" 
          },
          { 
            id: 2003, 
            name: "English Essay", 
            studentId: 103, 
            classId: 503, 
            date: today.toISOString(), 
            score: 0, 
            maxScore: 100, 
            status: "pending" 
          },
          { 
            id: 2004, 
            name: "History Final", 
            studentId: 104, 
            classId: 504, 
            date: lastWeek.toISOString(), 
            score: 90, 
            maxScore: 100, 
            status: "graded" 
          }
        ];
        
        return res.json(sampleTestResults);
      }
      
      res.json(testResults);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching test results",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Debug endpoint to create a test user
  app.post("/api/debug/create-test-user", async (req: Request, res: Response) => {
    try {
      // Create a test admin user
      const scryptAsync = promisify(scrypt);
      
      const hashPassword = async (password: string) => {
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        return `${buf.toString("hex")}.${salt}`;
      };
      
      const user = await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"),
        fullName: "Administrator",
        email: "admin@example.com",
        role: "admin",
      });
      
      res.status(201).json({
        message: "Test user created successfully",
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      res.status(500).json({ 
        message: "Error creating test user",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // User routes
  app.get("/api/users", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:role", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const roleParam = req.params.role;
      if (!["admin", "teacher", "student"].includes(roleParam)) {
        return res.status(400).json({ message: "Invalid role parameter" });
      }
      
      const users = await storage.getUsersByRole(roleParam);
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  // Get specific user by ID
  app.get("/api/user/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.id, 10);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  // Get student profile by user ID
  app.get("/api/students/user/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.userId, 10);
      const student = await storage.getStudentByUserId(userId);
      
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      res.json(student);
    } catch (error) {
      next(error);
    }
  });

  // Classes routes
  app.get("/api/classes", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/classes/teacher/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const teacherId = parseInt(req.params.id, 10);
      const classes = await storage.getClassesByTeacher(teacherId);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/classes", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(validatedData);
      res.status(201).json(newClass);
    } catch (error) {
      next(error);
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : undefined;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
      const dateParam = req.query.date as string;
      
      if (classId) {
        const attendance = await storage.getAttendanceByClass(classId);
        return res.json(attendance);
      } else if (studentId) {
        const attendance = await storage.getAttendanceByStudent(studentId);
        return res.json(attendance);
      } else if (dateParam) {
        const date = new Date(dateParam);
        const attendance = await storage.getAttendanceByDate(date);
        return res.json(attendance);
      } else {
        return res.status(400).json({ message: "Missing query parameters" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/attendance", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || 
         (req.user?.role !== "admin" && req.user?.role !== "teacher")) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/attendance/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || 
         (req.user?.role !== "admin" && req.user?.role !== "teacher")) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id, 10);
      const status = req.body.status;
      
      if (!["present", "absent", "late"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedAttendance = await storage.updateAttendance(id, status);
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedAttendance);
    } catch (error) {
      next(error);
    }
  });

  // Test results routes
  app.get("/api/test-results", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check for the special "all" value which is used in the UI
      const hasClassFilter = req.query.classId && req.query.classId !== "all";
      const hasStudentFilter = req.query.studentId && req.query.studentId !== "all";
      
      // Parse IDs if they are not "all"
      const classId = hasClassFilter ? parseInt(req.query.classId as string, 10) : undefined;
      const studentId = hasStudentFilter ? parseInt(req.query.studentId as string, 10) : undefined;
      
      if (hasClassFilter && classId) {
        const results = await storage.getTestResultsByClass(classId);
        return res.json(results);
      } else if (hasStudentFilter && studentId) {
        const results = await storage.getTestResultsByStudent(studentId);
        return res.json(results);
      } else if (req.query.classId === "all" || req.query.studentId === "all") {
        // If either filter is explicitly set to "all", return all results
        // This would ideally be paginated in a real app with many results
        const students = await storage.getUsers();
        const testResults = [];
        for (const student of students) {
          if (student.role === "student") {
            const results = await storage.getTestResultsByStudent(student.id);
            testResults.push(...results);
          }
        }
        return res.json(testResults);
      } else {
        // Return all test results if no filters are provided
        const classes = await storage.getClasses();
        const testResults = [];
        for (const cls of classes) {
          const results = await storage.getTestResultsByClass(cls.id);
          testResults.push(...results);
        }
        return res.json(testResults);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/test-results", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || 
         (req.user?.role !== "admin" && req.user?.role !== "teacher")) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertTestResultSchema.parse(req.body);
      const result = await storage.createTestResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/test-results/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || 
         (req.user?.role !== "admin" && req.user?.role !== "teacher")) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id, 10);
      const { score, status } = req.body;
      
      if (!["pending", "graded"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedResult = await storage.updateTestResult(id, score, status);
      if (!updatedResult) {
        return res.status(404).json({ message: "Test result not found" });
      }
      
      res.json(updatedResult);
    } catch (error) {
      next(error);
    }
  });

  // Installment routes
  app.get("/api/installments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Allow both admin and teacher roles to view installments
      if (req.user?.role !== "admin" && req.user?.role !== "teacher") {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }
      
      // Check for special "all" value
      const hasStudentFilter = req.query.studentId && req.query.studentId !== "all";
      const studentId = hasStudentFilter ? parseInt(req.query.studentId as string, 10) : undefined;
      const status = req.query.status as string;
      
      if (hasStudentFilter && studentId) {
        const installments = await storage.getInstallmentsByStudent(studentId);
        return res.json(installments);
      } else if (req.query.studentId === "all") {
        // If studentId is explicitly set to "all", fetch installments for all students
        const students = await storage.getUsers();
        const allInstallments = [];
        for (const student of students) {
          if (student.role === "student") {
            const installments = await storage.getInstallmentsByStudent(student.id);
            allInstallments.push(...installments);
          }
        }
        return res.json(allInstallments);
      } else if (status) {
        if (status === "all") {
          // If status is "all", return all installments
          const paidInstallments = await storage.getInstallmentsByStatus("paid");
          const pendingInstallments = await storage.getInstallmentsByStatus("pending");
          const overdueInstallments = await storage.getInstallmentsByStatus("overdue");
          return res.json([...paidInstallments, ...pendingInstallments, ...overdueInstallments]);
        } else if (["paid", "pending", "overdue"].includes(status)) {
          const installments = await storage.getInstallmentsByStatus(status);
          return res.json(installments);
        } else {
          return res.status(400).json({ message: "Invalid status value" });
        }
      } else {
        // Return all installments if no specific filters are provided
        const students = await storage.getUsers();
        const allInstallments = [];
        for (const student of students) {
          if (student.role === "student") {
            const installments = await storage.getInstallmentsByStudent(student.id);
            allInstallments.push(...installments);
          }
        }
        return res.json(allInstallments);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/installments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertInstallmentSchema.parse(req.body);
      const installment = await storage.createInstallment(validatedData);
      res.status(201).json(installment);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/installments/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id, 10);
      const { status, paymentDate } = req.body;
      
      if (!["paid", "pending", "overdue"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedInstallment = await storage.updateInstallment(
        id, 
        status, 
        paymentDate ? new Date(paymentDate) : undefined
      );
      
      if (!updatedInstallment) {
        return res.status(404).json({ message: "Installment not found" });
      }
      
      res.json(updatedInstallment);
    } catch (error) {
      next(error);
    }
  });

  // Events routes
  app.get("/api/events", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/events", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  });
  
  // Financial Reports API - Admin only
  app.get("/api/reports/finance", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { period, date } = req.query;
      const installments = await storage.getInstallmentsByStatus('paid');
      
      // Basic aggregations on the data
      const totalRevenue = installments.reduce((sum, item) => sum + item.amount, 0);
      const paymentCount = installments.length;
      const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;
      
      res.json({
        totalRevenue,
        paymentCount,
        averagePayment,
        installments
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Teacher Payment routes
  app.get("/api/teacher-payments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only admin can view all teacher payments
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }
      
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string, 10) : undefined;
      const month = req.query.month as string;
      const status = req.query.status as string;
      
      if (teacherId) {
        const payments = await storage.getTeacherPaymentsByTeacher(teacherId);
        return res.json(payments);
      } else if (month) {
        const payments = await storage.getTeacherPaymentsByMonth(month);
        return res.json(payments);
      } else if (status && ["paid", "pending"].includes(status)) {
        const payments = await storage.getTeacherPaymentsByStatus(status);
        return res.json(payments);
      } else {
        // Get payments for all teachers
        const teachers = await storage.getUsersByRole("teacher");
        const allPayments = [];
        
        for (const teacher of teachers) {
          const payments = await storage.getTeacherPaymentsByTeacher(teacher.id);
          allPayments.push(...payments);
        }
        
        return res.json(allPayments);
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/teacher-payments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertTeacherPaymentSchema.parse(req.body);
      const payment = await storage.createTeacherPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/teacher-payments/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id, 10);
      const { status, paymentDate } = req.body;
      
      if (!["paid", "pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedPayment = await storage.updateTeacherPayment(
        id, 
        status, 
        paymentDate ? new Date(paymentDate) : undefined
      );
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "Teacher payment not found" });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      next(error);
    }
  });
  
  // Debug endpoint to test direct access to the application
  app.get("/api/debug/hello", (req: Request, res: Response) => {
    res.json({ 
      message: "API is accessible", 
      timestamp: new Date().toISOString(),
      server: "Running"
    });
  });

  // Debug endpoint to get all teachers without authentication
  app.get("/api/debug/teachers", async (req: Request, res: Response) => {
    try {
      const teachers = await storage.getUsersByRole("teacher");
      
      // If no teachers are found, return sample data for testing
      if (!teachers || teachers.length === 0) {
        return res.json([
          { id: 201, fullName: "Rahul Vyawahare", role: "teacher", email: "rahul@vyawahare.edu" },
          { id: 202, fullName: "Anjali Deshmukh", role: "teacher", email: "anjali@vyawahare.edu" }
        ]);
      }
      
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching teachers",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint to get all students without authentication
  app.get("/api/debug/students", async (req: Request, res: Response) => {
    try {
      const students = await storage.getUsersByRole("student");
      
      // If no students are found, return sample data for testing
      if (!students || students.length === 0) {
        return res.json([
          { id: 301, fullName: "Rohit Sharma", role: "student", email: "rohit@student.edu", grade: "10" },
          { id: 302, fullName: "Priya Patel", role: "student", email: "priya@student.edu", grade: "8" }
        ]);
      }
      
      res.json(students);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching students",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint to check database connection
  app.get("/api/debug/check-db", async (req: Request, res: Response) => {
    try {
      // Check if storage has Supabase connection
      const hasSupabase = !!storage.supabase;
      
      // Try to fetch some data to verify connection
      const users = await storage.getUsers();
      
      res.json({
        database: hasSupabase ? "Supabase" : "In-Memory",
        connection: "OK",
        users_count: users.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        database: storage.supabase ? "Supabase" : "In-Memory",
        connection: "Error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Debug endpoint to create a test admin user
  app.post("/api/debug/create-test-user", async (req: Request, res: Response) => {
    try {
      // Check if the admin user already exists
      const existingUser = await storage.getUserByUsername("admin");
      
      if (existingUser) {
        return res.status(200).json({
          message: "Test user already exists",
          user: {
            id: existingUser.id,
            username: existingUser.username,
            fullName: existingUser.fullName,
            role: existingUser.role
          }
        });
      }
      
      // Create a test admin user
      const user = await storage.createUser({
        username: "admin",
        password: "password123",
        fullName: "Administrator",
        email: "admin@vyawahare.edu",
        role: "admin",
        grade: null,
        joinDate: new Date()
      });
      
      return res.status(201).json({
        message: "Test user created successfully",
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({
        message: "Error creating test user",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Debug endpoint to check installments data
  app.get("/api/debug/installments", async (req: Request, res: Response) => {
    try {
      const pending = await storage.getInstallmentsByStatus("pending");
      const overdue = await storage.getInstallmentsByStatus("overdue");
      const paid = await storage.getInstallmentsByStatus("paid");
      
      res.json({
        count: pending.length + overdue.length + paid.length,
        pending: pending,
        overdue: overdue,
        paid: paid,
        all: [...pending, ...overdue, ...paid]
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching installments",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Debug endpoint to check API health
  app.get("/api/debug/hello", (req: Request, res: Response) => {
    res.json({
      message: "API is running",
      timestamp: new Date().toISOString(),
      version: "1.0",
      env: process.env.NODE_ENV || "development"
    });
  });
  
  // Debug endpoint to check teachers data
  app.get("/api/debug/teachers", async (req: Request, res: Response) => {
    try {
      const teachers = await storage.getUsersByRole("teacher");
      
      // If no teachers are found, return sample data for testing
      if (!teachers || teachers.length === 0) {
        return res.json([
          { id: 201, fullName: "Rajesh Kumar", role: "teacher", email: "rajesh@vyawahare.edu" },
          { id: 202, fullName: "Sunita Joshi", role: "teacher", email: "sunita@vyawahare.edu" },
          { id: 203, fullName: "Vikram Deshmukh", role: "teacher", email: "vikram@vyawahare.edu" }
        ]);
      }
      
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching teachers",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create and return the server instance
  const httpServer = createServer(app);
  return httpServer;
}