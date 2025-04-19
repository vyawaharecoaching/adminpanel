import express, { type Express, Request, Response, NextFunction } from "express";
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
  insertTeacherPaymentSchema,
  insertPublicationNoteSchema,
  insertStudentNoteSchema
} from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up in-memory storage for development
  process.env.USE_SUPABASE = 'false';
  console.log('[storage] Using in-memory storage for development');
  
  // Set up authentication routes and get the requireAuth middleware
  const requireAuth = setupAuth(app);

  // Protected routes - require authentication
  const apiRouter = express.Router();
  apiRouter.use(requireAuth);

  // User routes
  apiRouter.get("/users/student", async (req, res) => {
    try {
      const students = await storage.getUsersByRole("student");
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Error fetching students" });
    }
  });

  // Attendance routes
  apiRouter.get("/attendance", async (req, res) => {
    try {
      const attendance = await storage.getAttendance();
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Error fetching attendance" });
    }
  });

  // Test results routes
  apiRouter.get("/test-results", async (req, res) => {
    try {
      const results = await storage.getTestResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error fetching test results" });
    }
  });

  // Events routes
  apiRouter.get("/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  // Installments routes
  apiRouter.get("/installments", async (req, res) => {
    try {
      const installments = await storage.getInstallments();
      res.json(installments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching installments" });
    }
  });

  // Mount the protected routes
  app.use("/api", apiRouter);

  // Debug routes - these should be removed in production
  if (process.env.NODE_ENV !== "production") {
    // ... existing debug routes ...
  }

  // Create and return the HTTP server
  const server = createServer(app);
  return server;
}