import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as path from "path";
import multer from "multer";
import sharp from "sharp";
import * as fs from "fs";
import cors from "cors";

import {
  insertPatientSchema,
  insertAppointmentSchema,
  insertMedicationSchema,
  insertPrescriptionSchema,
  insertSkinAnalysisSchema,
  insertQuestionnaireSchema,
  analysisResultSchema,
  patients,
  questionnaires,
  skinAnalyses,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { analyzeMedicalImage } from "./openai";
import { setupAuth, requireRole } from "./auth";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { WebSocketServer } from "ws";
import { VideoCallService } from "./video-call-service";
import { randomUUID } from "crypto";

// Set up multer for file uploads
const storage_dir = path.join(process.cwd(), "uploads");
// Ensure uploads directory exists
if (!fs.existsSync(storage_dir)) {
  fs.mkdirSync(storage_dir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storage_dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB (UI states this limit)
  },
  fileFilter: (req, file, cb) => {
    try {
      if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
      }
    } catch (error) {
      console.error("File upload error:", error);
      cb(null, false);
      return cb(new Error("File upload error. Please try again with a smaller file."));
    }
  },
});

// This function has been replaced with OpenAI's API
// The actual implementation is now in openai.ts

// Generate a unique patient ID
function generatePatientId() {
  return `DRM${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the authentication system
  setupAuth(app);
  
  // API routes


  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy" });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(storage_dir));

  // Patients API - requires authentication
  app.get("/api/patients", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // If the user is a patient, they should only see their own profile
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient) {
          return res.status(404).json({ 
            message: "Your patient profile is missing. Please contact support.",
            errorCode: "MISSING_PATIENT_PROFILE"
          });
        }
        // Return as an array with only their own profile
        return res.json([patient]);
      }
      
      // For doctor and assistant roles, return all patients
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient") {
        const userPatient = await storage.getPatientByUserId(req.user.id);
        if (!userPatient || userPatient.id !== id) {
          return res.status(403).json({ message: "You can only access your own patient data" });
        }
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.get("/api/patients/pid/:pid", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const pid = req.params.pid;
      const patient = await storage.getPatientByPid(pid);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient") {
        const userPatient = await storage.getPatientByUserId(req.user.id);
        if (!userPatient || userPatient.pid !== pid) {
          return res.status(403).json({ message: "You can only access your own patient data" });
        }
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.get("/api/patients/user/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        console.error("Invalid user ID format:", req.params.userId);
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      console.log(`Fetching patient data for user ID: ${userId}, current user role: ${req.user?.role}`);
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient" && req.user.id !== userId) {
        console.warn(`Patient user (${req.user.id}) attempted to access data for another user (${userId})`);
        return res.status(403).json({ message: "You can only access your own patient data" });
      }
      
      const patient = await storage.getPatientByUserId(userId);
      
      if (!patient) {
        // For patient users, this is a significant error as they should have an associated patient record
        if (req.user?.role === "patient") {
          console.error(`No patient record found for patient user with ID: ${userId}`);
          return res.status(404).json({ 
            message: "Your patient profile is missing. Please contact support.",
            errorCode: "MISSING_PATIENT_PROFILE"
          });
        } else {
          // For doctors/assistants, this is just informational
          console.log(`No patient record found for user with ID: ${userId}`);
          return res.status(404).json({ message: "Patient record not found" });
        }
      }
      
      console.log(`Successfully retrieved patient record ${patient.id} for user ${userId}`);
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient by user ID:", error);
      res.status(500).json({ message: "Failed to fetch patient data" });
    }
  });

  app.post("/api/patients", upload.single("profileImage"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Merge form data with file path
      const patientData = {
        ...req.body,
        pid: generatePatientId(),
        profileImage: req.file ? `/uploads/${req.file.filename}` : undefined,
        age: req.body.age ? parseInt(req.body.age) : undefined,
      };

      // If userId is provided in the body, use that (client-side form data)
      if (req.body.userId) {
        patientData.userId = parseInt(req.body.userId);
        console.log(`Setting patient userId to: ${patientData.userId}`);
      } 
      // If not provided but user is authenticated as patient, use the authenticated user's ID
      else if (req.user && req.user.role === "patient") {
        patientData.userId = req.user.id;
        console.log(`Linking patient to authenticated user account with ID: ${req.user.id}`);
      }

      // Validate data
      const validatedData = insertPatientSchema.parse(patientData);
      
      // Save patient
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", upload.single("profileImage"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      
      // If user is a patient, verify they're only updating their own record
      if (req.user && req.user.role === "patient") {
        const patientRecord = await storage.getPatientByUserId(req.user.id);
        if (!patientRecord || patientRecord.id !== id) {
          return res.status(403).json({ message: "You can only update your own patient record" });
        }
      }
      
      // Log request information for debugging
      console.log("Updating patient with ID:", id);
      console.log("Has file:", req.file ? "Yes" : "No");
      if (req.file) {
        console.log("File details:", {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          filename: req.file.filename
        });
      }
      
      // Merge form data with file path if file exists
      const patientData = {
        ...req.body,
        age: req.body.age ? parseInt(req.body.age) : undefined,
      };

      // Only add the profileImage field if a file was uploaded
      if (req.file) {
        patientData.profileImage = `/uploads/${req.file.filename}`;
        console.log("Setting new profile image:", patientData.profileImage);
      }

      console.log("Patient update data:", patientData);
      const patient = await storage.updatePatient(id, patientData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      console.log("Patient updated successfully", patient);
      res.json(patient);
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      
      // Only doctors can delete patient records
      if (req.user && req.user.role !== "doctor") {
        return res.status(403).json({ 
          message: "You don't have permission to delete patient records. This action requires doctor privileges." 
        });
      }
      
      const success = await storage.deletePatient(id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Appointments API
  app.get("/api/appointments", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // If the user is a patient, they should only see their own appointments
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient) {
          return res.status(404).json({ 
            message: "Your patient profile is missing. Please contact support.",
            errorCode: "MISSING_PATIENT_PROFILE"
          });
        }
        const patientAppointments = await storage.getAppointmentsByPatientId(patient.id);
        return res.json(patientAppointments);
      }
      
      // For doctor and assistant roles, return all appointments
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // If the user is a patient, verify they're only accessing their own appointments
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || appointment.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only access your own appointments" });
        }
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.get("/api/appointments/patient/:patientId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const patientId = parseInt(req.params.patientId);
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || patient.id !== patientId) {
          return res.status(403).json({ message: "You can only access your own appointments" });
        }
      }
      
      const appointments = await storage.getAppointmentsByPatientId(patientId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/date/:date", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only doctor and assistant roles can view all appointments by date
      if (req.user && req.user.role === "patient") {
        return res.status(403).json({ 
          message: "You don't have permission to view all appointments. This feature is only available to clinic staff." 
        });
      }
      
      const date = new Date(req.params.date);
      const appointments = await storage.getAppointmentsByDate(date);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // If the user is a patient, verify they're only creating appointments for themselves
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || patient.id !== parseInt(req.body.patientId)) {
          return res.status(403).json({ 
            message: "Patients can only create appointments for themselves" 
          });
        }
      }
      
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const existingAppointment = await storage.getAppointment(id);
      
      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // If the user is a patient, verify they're only updating their own appointments
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || existingAppointment.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only update your own appointments" });
        }
        
        // Additionally, ensure patients can't change the patientId field
        if (req.body.patientId && parseInt(req.body.patientId) !== patient.id) {
          return res.status(403).json({ message: "You cannot change the patient for an appointment" });
        }
      }
      
      const appointment = await storage.updateAppointment(id, req.body);
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // If the user is a patient, verify they're only deleting their own appointments
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || appointment.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only delete your own appointments" });
        }
      }
      
      const success = await storage.deleteAppointment(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Hospital routes
  app.get("/api/hospitals", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const hospitals = await storage.getHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  app.get("/api/hospitals/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const hospital = await storage.getHospital(id);
      
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospital" });
    }
  });

  // Doctor routes
  app.get("/api/doctors", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const hospitalId = req.query.hospitalId ? parseInt(req.query.hospitalId as string) : undefined;
      
      if (hospitalId) {
        const doctors = await storage.getDoctorsByHospitalId(hospitalId);
        res.json(doctors);
      } else {
        const doctors = await storage.getDoctors();
        res.json(doctors);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.get("/api/doctors/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const doctor = await storage.getDoctor(id);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor" });
    }
  });

  // Medications API
  app.get("/api/medications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // All authenticated users can retrieve medications list
      const medications = await storage.getMedications();
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.get("/api/medications/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const medication = await storage.getMedication(id);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.json(medication);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medication" });
    }
  });

  app.post("/api/medications", upload.single("image"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Only doctors can create medications
    if (req.user && req.user.role !== "doctor") {
      return res.status(403).json({ 
        message: "Only doctors can add medications to the system" 
      });
    }
    
    try {
      const medicationData = {
        ...req.body,
        price: parseInt(req.body.price),
        inStock: req.body.inStock === "true",
        image: req.file ? `/uploads/${req.file.filename}` : undefined,
      };

      const validatedData = insertMedicationSchema.parse(medicationData);
      const medication = await storage.createMedication(validatedData);
      res.status(201).json(medication);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create medication" });
    }
  });

  app.put("/api/medications/:id", upload.single("image"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Only doctors can update medications
    if (req.user && req.user.role !== "doctor") {
      return res.status(403).json({ 
        message: "Only doctors can update medications in the system" 
      });
    }
    
    try {
      const id = parseInt(req.params.id);
      
      const medicationData: any = {
        ...req.body
      };
      
      if (req.body.price) {
        medicationData.price = parseInt(req.body.price);
      }
      
      if (req.body.inStock !== undefined) {
        medicationData.inStock = req.body.inStock === "true";
      }
      
      if (req.file) {
        medicationData.image = `/uploads/${req.file.filename}`;
      }

      const medication = await storage.updateMedication(id, medicationData);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.json(medication);
    } catch (error) {
      res.status(500).json({ message: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Only doctors can delete medications
    if (req.user && req.user.role !== "doctor") {
      return res.status(403).json({ 
        message: "Only doctors can remove medications from the system" 
      });
    }
    
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMedication(id);
      if (!success) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete medication" });
    }
  });
  
  // Purchase medication API endpoint
  app.post("/api/medications/purchase", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { medicationId, patientId, quantity } = req.body;
      
      if (!medicationId) {
        return res.status(400).json({ message: "Medication ID is required" });
      }
      
      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }
      
      // If the user is a patient, verify they're only purchasing for themselves
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || patient.id !== parseInt(patientId)) {
          return res.status(403).json({ 
            message: "Patients can only purchase medications for themselves" 
          });
        }
      }
      
      const medication = await storage.getMedication(parseInt(medicationId));
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      const patient = await storage.getPatient(parseInt(patientId));
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // In a real application, this would create a prescription or purchase record
      // For now, just return success
      res.status(200).json({ 
        success: true,
        message: "Medication purchased successfully",
        medication,
        patient,
        quantity: quantity || 1
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to purchase medication" });
    }
  });

  // Prescriptions API
  app.get("/api/prescriptions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // If the user is a patient, they should only see their own prescriptions
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient) {
          return res.status(404).json({ 
            message: "Your patient profile is missing. Please contact support.",
            errorCode: "MISSING_PATIENT_PROFILE"
          });
        }
        const patientPrescriptions = await storage.getPrescriptionsByPatientId(patient.id);
        return res.json(patientPrescriptions);
      }
      
      // For doctor and assistant roles, return all prescriptions
      const prescriptions = await storage.getPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get("/api/prescriptions/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const prescription = await storage.getPrescription(id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || prescription.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only access your own prescriptions" });
        }
      }
      
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescription" });
    }
  });

  app.get("/api/prescriptions/patient/:patientId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const patientId = parseInt(req.params.patientId);
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || patient.id !== patientId) {
          return res.status(403).json({ message: "You can only access your own prescriptions" });
        }
      }
      
      const prescriptions = await storage.getPrescriptionsByPatientId(patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.post("/api/prescriptions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // If the user is a patient, verify they're only creating records for themselves
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || patient.id !== parseInt(req.body.patientId)) {
          return res.status(403).json({ 
            message: "Patients can only create prescriptions for themselves" 
          });
        }
      }
      
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.put("/api/prescriptions/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const existingPrescription = await storage.getPrescription(id);
      
      if (!existingPrescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // If the user is a patient, verify they're only updating their own prescriptions
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || existingPrescription.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only update your own prescriptions" });
        }
        
        // Additionally, ensure patients can't change the patientId field
        if (req.body.patientId && parseInt(req.body.patientId) !== patient.id) {
          return res.status(403).json({ message: "You cannot change the patient for a prescription" });
        }
      }
      
      const prescription = await storage.updatePrescription(id, req.body);
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: "Failed to update prescription" });
    }
  });

  app.delete("/api/prescriptions/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const prescription = await storage.getPrescription(id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // If the user is a patient, verify they're only deleting their own prescriptions
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || prescription.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only delete your own prescriptions" });
        }
      }
      
      const success = await storage.deletePrescription(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete prescription" });
    }
  });

  // Force logout endpoint for testing
  app.post("/api/force-logout", (req, res) => {
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) console.error("Session destroy error:", destroyErr);
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Forced logout complete" });
      });
    });
  });

  // Skin Analysis API
  app.get("/api/skin-analyses", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      console.log(`API /skin-analyses called by user: ${req.user?.username} (ID: ${req.user?.id}, Role: ${req.user?.role})`);
      
      // For patient users, get only their analyses with validation status
      if (req.user && req.user.role === "patient") {
        let patient = await storage.getPatientByUserId(req.user.id);
        
        // Auto-create patient profile if missing
        if (!patient) {
          try {
            const patientData = {
              pid: generatePatientId(),
              userId: req.user.id,
              name: req.user.name || req.user.username,
              age: 25,
              gender: "other",
              email: `${req.user.username}@example.com`,
              phone: "000-000-0000",
              address: "",
              allergies: "",
              lastVisitDate: null,
              nextVisitDate: null,
              profileImage: null
            };
            
            patient = await storage.createPatient(patientData);
            console.log(`Auto-created missing patient profile for user: ${req.user.username} (ID: ${req.user.id})`);
          } catch (error) {
            console.error("Failed to auto-create patient profile:", error);
            return res.status(500).json({ 
              message: "Failed to initialize patient profile. Please try again.",
              errorCode: "PROFILE_CREATION_FAILED"
            });
          }
        }
        
        const analyses = await storage.getSkinAnalysesByPatientId(patient.id);
        
        // The validation status and expert results are already in the analysis object
        const enhancedAnalyses = analyses.map((analysis) => {
          const enhanced = {
            ...analysis,
            validationStatus: analysis.validationStatus || "pending",
            expertResults: analysis.expertResults || null,
            expertComments: analysis.expertComments || null,
            aiResults: analysis.results, // Keep original AI results
            finalResults: analysis.finalResults || analysis.expertResults || analysis.results // Priority: finalResults > expertResults > original results
          };
          
          console.log(`Patient API - Analysis ${analysis.id}:`, {
            originalValidationStatus: analysis.validationStatus,
            enhancedValidationStatus: enhanced.validationStatus,
            hasExpertResults: !!analysis.expertResults,
            expertResultsType: typeof analysis.expertResults
          });
          
          return enhanced;
        });
        
        return res.json(enhancedAnalyses);
      }
      
      // For doctors and assistants, get all analyses
      const analyses = await storage.getSkinAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching skin analyses:", error);
      res.status(500).json({ message: "Failed to fetch skin analyses" });
    }
  });

  app.get("/api/skin-analyses/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getSkinAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Skin analysis not found" });
      }
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient") {
        let patient = await storage.getPatientByUserId(req.user.id);
        
        // Auto-create patient profile if missing
        if (!patient) {
          try {
            const patientData = {
              pid: generatePatientId(),
              userId: req.user.id,
              name: req.user.name || req.user.username,
              age: 25,
              gender: "other",
              email: `${req.user.username}@example.com`,
              phone: "000-000-0000",
              address: "",
              allergies: "",
              lastVisitDate: null,
              nextVisitDate: null,
              profileImage: null
            };
            
            patient = await storage.createPatient(patientData);
            console.log(`Auto-created missing patient profile for user: ${req.user.username} (ID: ${req.user.id})`);
          } catch (error) {
            console.error("Failed to auto-create patient profile:", error);
            return res.status(500).json({ 
              message: "Failed to initialize patient profile. Please try again.",
              errorCode: "PROFILE_CREATION_FAILED"
            });
          }
        }
        
        if (analysis.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only access your own skin analyses" });
        }
      }
      
      // Enhance analysis with validation status and expert results
      try {
        const validations = await storage.getAnalysisValidations();
        const validation = validations.find(v => v.skinAnalysisId === analysis.id);
        
        const enhancedAnalysis = {
          ...analysis,
          validationStatus: validation ? validation.status : "pending",
          expertResults: validation?.expertResults || null,
          expertComments: validation?.expertComments || null,
          reviewedAt: validation?.reviewedAt || null,
          aiResults: analysis.results, // Keep original AI results
          finalResults: validation?.expertResults || analysis.results // Show expert results if available, otherwise AI results
        };
        
        res.json(enhancedAnalysis);
      } catch (validationError) {
        // If validation check fails, return basic analysis without validation info
        res.json({
          ...analysis,
          validationStatus: "pending",
          expertResults: null,
          expertComments: null,
          reviewedAt: null,
          aiResults: analysis.results,
          finalResults: analysis.results
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skin analysis" });
    }
  });

  app.get("/api/skin-analyses/patient/:patientId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const patientId = parseInt(req.params.patientId);
      
      // If the user is a patient, verify they're only accessing their own data
      if (req.user && req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || patient.id !== patientId) {
          return res.status(403).json({ message: "You can only access your own skin analyses" });
        }
      }
      
      const analyses = await storage.getSkinAnalysesByPatientId(patientId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch skin analyses" });
    }
  });

  app.post("/api/skin-analyses", upload.single("image"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Log request details for debugging
      console.log("Skin analysis request from user:", req.user?.id);
      console.log("Request body:", {
        patientId: req.body.patientId,
        imageType: req.body.imageType,
        bodyPart: req.body.bodyPart,
        notes: req.body.notes ? "Provided" : "None"
      });
      console.log("File details:", {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Check if the patient exists
      const patientId = parseInt(req.body.patientId);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(400).json({ message: `Patient with ID ${patientId} not found` });
      }
      
      // If the user is a patient, verify they're only creating analyses for themselves
      if (req.user && req.user.role === "patient") {
        const userPatient = await storage.getPatientByUserId(req.user.id);
        if (!userPatient || userPatient.id !== patientId) {
          return res.status(403).json({ 
            message: "Patients can only create skin analyses for themselves" 
          });
        }
      }
      
      // Get the uploaded file path
      const imagePath = req.file.path;
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Process the image (resize, optimize)
      await sharp(imagePath)
        .resize(800)
        .jpeg({ quality: 80 })
        .toFile(path.join(storage_dir, `processed-${req.file.filename}`));
      
      // Extract image type and body part from request
      const imageType = req.body.imageType || 'skin';
      const bodyPart = req.body.bodyPart || null;
      
      // Determine which AI service to use (user can specify in request)
      let analysisService = req.body.analysisService || process.env.ANALYSIS_SERVICE || 'openai';
      
      // Validate service to ensure only 'openai' or 'claude' are accepted
      if (analysisService !== 'openai' && analysisService !== 'claude') {
        console.warn(`Invalid analysis service requested: ${analysisService}. Defaulting to OpenAI.`);
        analysisService = 'openai';
      }
      console.log(`Skin analysis request from user: ${req.user?.id} with role: ${req.user?.role}`);
      console.log(`Request info: ${JSON.stringify({
        patientId: req.body.patientId,
        imageType: req.body.imageType,
        bodyPart: req.body.bodyPart,
        service: analysisService,
        notes: req.body.notes || 'None'
      })}`);
      
      console.log(`File details: ${JSON.stringify({
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      })}`);
      
      // Check API keys based on selected service
      if (analysisService === 'openai' && !process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured. Please contact system administrator."
        });
      }
      
      if (analysisService === 'claude' && !process.env.ANTHROPIC_API_KEY) {
        // If Claude API key isn't available but OpenAI is, switch to OpenAI
        if (process.env.OPENAI_API_KEY) {
          console.log("Claude API key not configured or invalid, automatically switching to OpenAI");
          analysisService = 'openai';
        } else {
          return res.status(500).json({
            message: "Claude API key not configured. Please contact system administrator."
          });
        }
      }
      

      
      // Analyze the medical image using selected service
      console.log(`Starting ${analysisService} analysis for patient ${patientId}...`);
      const results = await analyzeMedicalImage(imagePath, imageType, bodyPart, analysisService);
      console.log("AI Analysis results:", results);
      
      // Create medical image analysis record
      const analysisData = {
        patientId: patientId,
        imageUrl: imageUrl,
        imageType: imageType,
        bodyPart: bodyPart,
        results: [], // Empty until expert approval
        aiResults: results, // Store AI results separately
        finalResults: null, // Will be set after expert validation
        validationStatus: "pending",
        date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        notes: req.body.notes || null
      };

      const validatedData = insertSkinAnalysisSchema.parse(analysisData);
      const analysis = await storage.createSkinAnalysis(validatedData);
      
      // Automatically create validation for expert review
      try {
        const validation = await storage.createAnalysisValidation({
          skinAnalysisId: analysis.id,
          expertId: 27, // Default expert ID
          aiResults: results,
          status: "pending",
          expertResults: null,
          expertComments: null
        });
        
        // Create expert notification
        await storage.createExpertNotification({
          message: `New skin analysis submitted by patient requiring expert validation for ${results[0]?.condition || 'skin condition'}`,
          expertId: 27,
          analysisValidationId: validation.id,
          title: `${results[0]?.condition || 'Skin Analysis'} - Expert Review Required`,
          isRead: false,
          priority: results[0]?.severity === "Severe" || results[0]?.severity === "Critical" ? "urgent" : "normal"
        });
        
        console.log(`Created validation ${validation.id} for analysis ${analysis.id}`);
        
        // Send SMS alert to expert
        const { smsService } = await import("./sms-service");
        const patient = await storage.getPatient(analysis.patientId);
        const pendingValidations = await storage.getPendingValidationsByExpert(27);
        
        if (results[0]?.severity === "Severe" || results[0]?.severity === "Critical") {
          await smsService.sendUrgentAlert(
            patient?.name || "Unknown Patient",
            results[0]?.condition || "Unknown Condition"
          );
        } else {
          await smsService.sendExpertAlert(
            pendingValidations.length,
            patient?.name
          );
        }
        
      } catch (validationError) {
        console.error("Failed to create validation or send SMS:", validationError);
        // Continue without failing the analysis creation
      }
      
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Skin analysis error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create skin analysis" });
    }
  });

  app.put("/api/skin-analyses/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      
      // For patient role, verify they're only updating their own data
      if (req.user && req.user.role === "patient") {
        const existingAnalysis = await storage.getSkinAnalysis(id);
        if (!existingAnalysis) {
          return res.status(404).json({ message: "Skin analysis not found" });
        }
        
        const patient = await storage.getPatientByUserId(req.user.id);
        if (!patient || existingAnalysis.patientId !== patient.id) {
          return res.status(403).json({ message: "You can only update your own skin analyses" });
        }
      }
      
      const analysis = await storage.updateSkinAnalysis(id, req.body);
      if (!analysis) {
        return res.status(404).json({ message: "Skin analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to update skin analysis" });
    }
  });

  app.delete("/api/skin-analyses/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      
      // Non-doctor users cannot delete skin analyses
      if (req.user && req.user.role !== "doctor") {
        return res.status(403).json({ 
          message: "Only doctors can delete skin analyses" 
        });
      }
      
      const success = await storage.deleteSkinAnalysis(id);
      if (!success) {
        return res.status(404).json({ message: "Skin analysis not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skin analysis" });
    }
  });

  // Questionnaire routes
  app.get("/api/questionnaires", async (req: Request, res: Response) => {
    try {
      // Use db for direct database access as we might not have a storage interface method
      const allQuestionnaires = await db.select().from(questionnaires);
      res.json(allQuestionnaires);
    } catch (error) {
      console.error("Error fetching questionnaires:", error);
      res.status(500).json({ message: "Error fetching questionnaires" });
    }
  });

  app.get("/api/questionnaires/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [questionnaireData] = await db
        .select()
        .from(questionnaires)
        .where(eq(questionnaires.id, id));

      if (!questionnaireData) {
        return res.status(404).json({ message: "Questionnaire not found" });
      }

      res.json(questionnaireData);
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      res.status(500).json({ message: "Error fetching questionnaire" });
    }
  });

  app.get("/api/questionnaires/patient/:patientId", async (req: Request, res: Response) => {
    try {
      const patientId = parseInt(req.params.patientId);
      
      // Check if the current user has access to this patient's data
      if (req.user?.role !== "doctor" && req.user?.role !== "assistant") {
        const [patientRecord] = await db
          .select()
          .from(patients)
          .where(eq(patients.id, patientId));
          
        if (!patientRecord || patientRecord.userId !== req.user?.id) {
          return res.status(403).json({ message: "You don't have permission to access this patient's questionnaires" });
        }
      }
      
      const patientQuestionnaires = await db
        .select()
        .from(questionnaires)
        .where(eq(questionnaires.patientId, patientId));

      res.json(patientQuestionnaires);
    } catch (error) {
      console.error("Error fetching patient questionnaires:", error);
      res.status(500).json({ message: "Error fetching patient questionnaires" });
    }
  });

  app.get("/api/questionnaires/type/:type/patient/:patientId", async (req: Request, res: Response) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const type = req.params.type as "skin" | "hair" | "antiaging";
      
      // Check if the current user has access to this patient's data
      if (req.user?.role !== "doctor" && req.user?.role !== "assistant") {
        const [patientRecord] = await db
          .select()
          .from(patients)
          .where(eq(patients.id, patientId));
          
        if (!patientRecord || patientRecord.userId !== req.user?.id) {
          return res.status(403).json({ message: "You don't have permission to access this patient's questionnaires" });
        }
      }
      
      // Get questionnaires filtered by type and sorted by date (newest first)
      const typeQuestionnaires = await db
        .select()
        .from(questionnaires)
        .where(and(
          eq(questionnaires.patientId, patientId),
          eq(questionnaires.questionnaireType, type)
        ))
        .orderBy(desc(questionnaires.createdAt));

      res.json(typeQuestionnaires);
    } catch (error) {
      console.error("Error fetching questionnaires by type:", error);
      res.status(500).json({ message: "Error fetching questionnaires by type" });
    }
  });

  app.post("/api/questionnaires", async (req: Request, res: Response) => {
    try {
      // Parse the questionnaire data from the request body
      const questionnaireData = {
        ...req.body,
        patientId: parseInt(req.body.patientId.toString()),
      };

      // Check user has permission to create a questionnaire for this patient
      if (req.user?.role !== "doctor" && req.user?.role !== "assistant") {
        const [patientRecord] = await db
          .select()
          .from(patients)
          .where(eq(patients.id, questionnaireData.patientId));
          
        if (!patientRecord || patientRecord.userId !== req.user?.id) {
          return res.status(403).json({ message: "You don't have permission to create a questionnaire for this patient" });
        }
      }

      // Insert the questionnaire into the database
      const [newQuestionnaire] = await db
        .insert(questionnaires)
        .values(questionnaireData)
        .returning();
      
      console.log("Created new questionnaire:", newQuestionnaire.id);
      res.status(201).json(newQuestionnaire);
    } catch (error) {
      console.error("Error creating questionnaire:", error);
      res.status(500).json({ message: "Error creating questionnaire" });
    }
  });

  app.put("/api/questionnaires/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the current questionnaire to check permissions
      const [currentQuestionnaire] = await db
        .select()
        .from(questionnaires)
        .leftJoin(patients, eq(questionnaires.patientId, patients.id))
        .where(eq(questionnaires.id, id));

      if (!currentQuestionnaire) {
        return res.status(404).json({ message: "Questionnaire not found" });
      }

      // Check permissions
      if (req.user?.role !== "doctor" && req.user?.role !== "assistant") {
        if (!currentQuestionnaire.patients || currentQuestionnaire.patients.userId !== req.user?.id) {
          return res.status(403).json({ message: "You don't have permission to update this questionnaire" });
        }
      }

      // Parse questionnaire data
      const questionnaireData = {
        ...req.body,
        patientId: parseInt(req.body.patientId.toString()),
      };

      // Update the questionnaire
      const [updatedQuestionnaire] = await db
        .update(questionnaires)
        .set(questionnaireData)
        .where(eq(questionnaires.id, id))
        .returning();

      res.json(updatedQuestionnaire);
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      res.status(500).json({ message: "Error updating questionnaire" });
    }
  });

  app.delete("/api/questionnaires/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the current questionnaire to check permissions
      const [currentQuestionnaire] = await db
        .select()
        .from(questionnaires)
        .leftJoin(patients, eq(questionnaires.patientId, patients.id))
        .where(eq(questionnaires.id, id));

      if (!currentQuestionnaire) {
        return res.status(404).json({ message: "Questionnaire not found" });
      }

      // Check permissions
      if (req.user?.role !== "doctor" && req.user?.role !== "assistant") {
        if (!currentQuestionnaire.patients || currentQuestionnaire.patients.userId !== req.user?.id) {
          return res.status(403).json({ message: "You don't have permission to delete this questionnaire" });
        }
      }

      // Delete the questionnaire
      await db.delete(questionnaires).where(eq(questionnaires.id, id));
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting questionnaire:", error);
      res.status(500).json({ message: "Error deleting questionnaire" });
    }
  });

  // AI Chat endpoint for doctors
  app.post("/api/ai-chat", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { message, context, patientId, conversationHistory } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Create medical context for AI
      let contextPrompt = `You are an expert dermatologist AI assistant helping Dr. AriHariSudhan with medical consultations. 

Provide SHORT, CONCISE, professional medical advice. Keep responses under 3-4 sentences maximum. Focus on:
- Direct treatment recommendations
- Key differential diagnoses
- Essential patient counseling points
- Specific medication suggestions
- Critical follow-up needs

Be brief and clinical. Avoid lengthy explanations.`;

      if (context) {
        contextPrompt += `\n\nCurrent Case Context:
- Diagnosed Condition: ${context.condition}
- Confidence Level: ${(context.confidence * 100).toFixed(1)}%
- Severity: ${context.severity}
- Analysis: ${context.description}`;
      }

      // Build conversation history with proper typing
      const messages: any[] = [
        { role: "system", content: contextPrompt }
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach((msg: any) => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }

      messages.push({ role: "user", content: message });

      // Use OpenAI for chat
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "AI service not configured" });
      }

      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const chatResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 150,
        temperature: 0.3
      });

      const aiMessage = chatResponse.choices[0].message.content;

      res.json({ 
        message: aiMessage,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: "Failed to process AI chat request" });
    }
  });

  // Expert Validation API routes
  app.get("/api/analysis-validations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can access validation endpoints
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const validations = await storage.getAnalysisValidations();
      res.json(validations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis validations" });
    }
  });

  app.get("/api/analysis-validations/pending", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can access validation endpoints
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const pendingValidations = await storage.getPendingValidationsByExpert(req.user.id);
      
      // Enhance each validation with complete skin analysis and patient data
      const enhancedValidations = await Promise.all(
        pendingValidations.map(async (validation) => {
          const skinAnalysis = await storage.getSkinAnalysis(validation.skinAnalysisId);
          const patient = skinAnalysis ? await storage.getPatient(skinAnalysis.patientId) : null;
          const questionnaire = await storage.getMedicalQuestionnaireByAnalysisId(validation.skinAnalysisId);
          
          // Debug logging
          console.log(`Validation ${validation.id}: Patient name = "${patient?.name || 'NOT FOUND'}"`);
          
          return {
            ...validation,
            skinAnalysis: skinAnalysis,
            patient: patient,
            questionnaire: questionnaire
          };
        })
      );
      
      res.json(enhancedValidations);
    } catch (error) {
      console.error("Failed to fetch pending validations:", error);
      res.status(500).json({ message: "Failed to fetch pending validations" });
    }
  });

  app.get("/api/analysis-validations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can access validation endpoints
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const id = parseInt(req.params.id);
      const validation = await storage.getAnalysisValidation(id);
      
      if (!validation) {
        return res.status(404).json({ message: "Analysis validation not found" });
      }

      // Fetch the associated skin analysis with image data
      const skinAnalysis = await storage.getSkinAnalysis(validation.skinAnalysisId);
      
      // Fetch the patient data
      const patient = skinAnalysis ? await storage.getPatient(skinAnalysis.patientId) : null;
      
      // Fetch medical questionnaire if exists
      const questionnaire = await storage.getMedicalQuestionnaireByAnalysisId(validation.skinAnalysisId);
      
      // Return validation with complete skin analysis and patient data
      const validationDetails = {
        ...validation,
        skinAnalysis: skinAnalysis,
        patient: patient,
        questionnaire: questionnaire
      };
      
      res.json(validationDetails);
    } catch (error) {
      console.error("Failed to fetch validation details:", error);
      res.status(500).json({ message: "Failed to fetch validation details" });
    }
  });

  app.post("/api/analysis-validations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can create validations
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const validationData = {
        ...req.body,
        expertId: req.user.id,
        status: "pending"
      };
      
      const validation = await storage.createAnalysisValidation(validationData);
      res.status(201).json(validation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create analysis validation" });
    }
  });

  // Generate condition details endpoint for expert dashboard
  app.post("/api/generate-condition-details", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can access this endpoint
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const { generateConditionDetails } = await import("./condition-knowledge");
      const { condition, severity = "Moderate", bodyPart } = req.body;
      
      if (!condition) {
        return res.status(400).json({ message: "Condition name is required" });
      }
      
      const conditionDetails = await generateConditionDetails(condition, severity, bodyPart);
      res.json(conditionDetails);
    } catch (error) {
      console.error("Failed to generate condition details:", error);
      res.status(500).json({ message: "Failed to generate condition details" });
    }
  });

  app.put("/api/analysis-validations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can update validations
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const id = parseInt(req.params.id);
      const validation = await storage.updateAnalysisValidation(id, req.body);
      
      if (!validation) {
        return res.status(404).json({ message: "Analysis validation not found" });
      }
      
      // When validation is approved or modified, update the corresponding skin analysis
      if (req.body.status === "approved" || req.body.status === "modified") {
        // Ensure expertResults is properly formatted - use AI results if expert didn't modify them
        const expertResults = req.body.expertResults && Array.isArray(req.body.expertResults) && req.body.expertResults.length > 0 
          ? req.body.expertResults 
          : validation.aiResults;
        
        const updateData = {
          validationStatus: req.body.status,
          expertResults: expertResults,
          expertComments: req.body.expertComments || null,
          reviewedAt: new Date()
        };
        
        await storage.updateSkinAnalysis(validation.skinAnalysisId, updateData);
        
        console.log(`Updated skin analysis ${validation.skinAnalysisId} with expert validation:`, {
          status: req.body.status,
          hasExpertResults: !!(expertResults && expertResults.length > 0),
          expertResultsCount: expertResults ? expertResults.length : 0
        });
        
        // Send real-time notification via WebSocket
        const wsManager = req.app.get('wsManager');
        if (wsManager) {
          const analysis = await storage.getSkinAnalysis(validation.skinAnalysisId);
          if (analysis) {
            wsManager.notifyAnalysisValidated(validation.skinAnalysisId, analysis.patientId, {
              expertResults: req.body.expertResults,
              expertComments: req.body.expertComments,
              validatedAt: new Date().toISOString(),
              validatedBy: req.user.id,
              status: req.body.status
            });
            console.log(`WebSocket notification sent for analysis ${validation.skinAnalysisId}`);
          }
        }
      }
      
      res.json(validation);
    } catch (error) {
      console.error("Failed to update analysis validation:", error);
      res.status(500).json({ message: "Failed to update analysis validation" });
    }
  });

  // Medical Questionnaire API routes
  app.get("/api/medical-questionnaires", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const questionnaires = await storage.getMedicalQuestionnaires();
      res.json(questionnaires);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medical questionnaires" });
    }
  });

  app.get("/api/medical-questionnaires/analysis/:analysisId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const analysisId = parseInt(req.params.analysisId);
      const questionnaire = await storage.getMedicalQuestionnaireByAnalysisId(analysisId);
      
      if (!questionnaire) {
        return res.status(404).json({ message: "Medical questionnaire not found" });
      }
      
      res.json(questionnaire);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medical questionnaire" });
    }
  });

  app.post("/api/medical-questionnaires", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const questionnaire = await storage.createMedicalQuestionnaire(req.body);
      res.status(201).json(questionnaire);
    } catch (error) {
      res.status(500).json({ message: "Failed to create medical questionnaire" });
    }
  });

  // Expert Notification API routes
  app.get("/api/expert-notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can access notifications
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const notifications = await storage.getExpertNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expert notifications" });
    }
  });

  app.post("/api/expert-notifications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const notification = await storage.createExpertNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to create expert notification" });
    }
  });

  app.put("/api/expert-notifications/:id/read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      // Only experts can mark notifications as read
      if (!["expert", "doctor"].includes(req.user?.role || "")) {
        return res.status(403).json({ message: "Expert access required" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // SMS test route for experts
  app.post("/api/test-sms", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (req.user && req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can test SMS alerts" });
    }
    
    try {
      const { smsService } = await import("./sms-service");
      
      if (!smsService.isAvailable()) {
        return res.status(400).json({ 
          message: "SMS service not configured. Please check Twilio credentials." 
        });
      }
      
      const success = await smsService.sendExpertAlert(1, "Test Patient");
      
      if (success) {
        res.json({ message: "Test SMS sent successfully!" });
      } else {
        res.status(500).json({ message: "Failed to send test SMS" });
      }
    } catch (error) {
      console.error("SMS test error:", error);
      res.status(500).json({ message: "SMS test failed" });
    }
  });

  // Video call API routes
  app.get("/api/video-calls/scheduled", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const calls = await storage.getVideoCallsForUser(req.user!.id, req.user!.role);
      
      // Enhance with participant names
      const enhancedCalls = await Promise.all(calls.map(async (call) => {
        const patient = await storage.getPatient(call.patientId);
        const doctor = await storage.getUser(call.doctorId);
        
        return {
          ...call,
          patient: patient ? { name: patient.name } : null,
          doctor: doctor ? { name: doctor.name } : null
        };
      }));

      res.json(enhancedCalls);
    } catch (error) {
      console.error("Error fetching video calls:", error);
      res.status(500).json({ message: "Failed to fetch video calls" });
    }
  });

  app.post("/api/video-calls/schedule", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { patientId, doctorId, scheduledTime, notes } = req.body;

      // Verify user has permission to schedule calls
      if (req.user!.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user!.id);
        if (!patient || patient.id !== patientId) {
          return res.status(403).json({ message: "You can only schedule calls for yourself" });
        }
      }

      const { randomUUID } = await import('crypto');
      const roomId = `call_${randomUUID()}`;
      
      const videoCall = await storage.createVideoCall({
        patientId,
        doctorId: doctorId || req.user!.id,
        roomId,
        status: "scheduled",
        scheduledTime: new Date(scheduledTime),
        callNotes: notes
      });

      res.status(201).json({ ...videoCall, roomId });
    } catch (error) {
      console.error("Error scheduling video call:", error);
      res.status(500).json({ message: "Failed to schedule video call" });
    }
  });

  app.post("/api/video-calls/:roomId/start", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { roomId } = req.params;
      const call = await storage.getVideoCallByRoomId(roomId);
      
      if (!call) {
        return res.status(404).json({ message: "Video call not found" });
      }

      // Verify user has permission to start this call
      const canStart = (req.user!.role === "patient" && call.patientId === req.user!.id) ||
                      (req.user!.role === "doctor" && call.doctorId === req.user!.id);
      
      if (!canStart) {
        return res.status(403).json({ message: "You don't have permission to start this call" });
      }

      res.json({ roomId, callId: call.id, status: call.status });
    } catch (error) {
      console.error("Error starting video call:", error);
      res.status(500).json({ message: "Failed to start video call" });
    }
  });

  app.get("/api/users/doctors", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const doctors = await storage.getUsers();
      const doctorUsers = doctors.filter(user => user.role === "doctor");
      res.json(doctorUsers.map(user => ({ id: user.id, name: user.name })));
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // Video Calls API
  app.get("/api/video-calls", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const videoCalls = await storage.getVideoCalls();
      res.json(videoCalls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video calls" });
    }
  });

  app.post("/api/video-calls", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const videoCallData = {
        ...req.body,
        roomId: randomUUID(),
        status: "scheduled"
      };
      
      const videoCall = await storage.createVideoCall(videoCallData);
      res.status(201).json(videoCall);
    } catch (error) {
      res.status(500).json({ message: "Failed to create video call" });
    }
  });

  app.put("/api/video-calls/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const videoCall = await storage.updateVideoCall(id, req.body);
      
      if (!videoCall) {
        return res.status(404).json({ message: "Video call not found" });
      }
      
      res.json(videoCall);
    } catch (error) {
      res.status(500).json({ message: "Failed to update video call" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for video calls and notifications
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false
  });

  // Initialize video call service  
  const videoCallService = new VideoCallService(wss);

  return httpServer;
}

import express from "express";
