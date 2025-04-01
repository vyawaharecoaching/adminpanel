import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertClassSchema, 
  insertAttendanceSchema, 
  insertTestResultSchema, 
  insertInstallmentSchema, 
  insertEventSchema 
} from "@shared/schema";
import { connectToDatabase } from "./db/connection";

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB database
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.log('Continuing with in-memory storage');
  }

  // Set up authentication routes
  setupAuth(app);

  // User routes
  app.get("/api/users", async (req, res, next) => {
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

  app.get("/api/users/:role", async (req, res, next) => {
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

  // Classes routes
  app.get("/api/classes", async (req, res, next) => {
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

  app.get("/api/classes/teacher/:id", async (req, res, next) => {
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

  app.post("/api/classes", async (req, res, next) => {
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
  app.get("/api/attendance", async (req, res, next) => {
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

  app.post("/api/attendance", async (req, res, next) => {
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

  app.patch("/api/attendance/:id", async (req, res, next) => {
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
  app.get("/api/test-results", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const classId = req.query.classId ? parseInt(req.query.classId as string, 10) : undefined;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
      
      if (classId) {
        const results = await storage.getTestResultsByClass(classId);
        return res.json(results);
      } else if (studentId) {
        const results = await storage.getTestResultsByStudent(studentId);
        return res.json(results);
      } else {
        return res.status(400).json({ message: "Missing query parameters" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/test-results", async (req, res, next) => {
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

  app.patch("/api/test-results/:id", async (req, res, next) => {
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
  app.get("/api/installments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
      const status = req.query.status as string;
      
      if (studentId) {
        const installments = await storage.getInstallmentsByStudent(studentId);
        return res.json(installments);
      } else if (status) {
        if (!["paid", "pending", "overdue"].includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        const installments = await storage.getInstallmentsByStatus(status);
        return res.json(installments);
      } else {
        return res.status(400).json({ message: "Missing query parameters" });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/installments", async (req, res, next) => {
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

  app.patch("/api/installments/:id", async (req, res, next) => {
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
  app.get("/api/events", async (req, res, next) => {
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

  app.post("/api/events", async (req, res, next) => {
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
