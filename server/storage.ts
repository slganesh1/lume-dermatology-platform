import {
  patients,
  hospitals,
  doctors,
  appointments,
  medications,
  prescriptions,
  skinAnalyses,
  users,
  userSessions,
  analysisValidations,
  medicalQuestionnaires,
  expertNotifications,
  videoCalls,
  callParticipants,
  callMessages,
  type Patient,
  type InsertPatient,
  type Hospital,
  type InsertHospital,
  type Doctor,
  type InsertDoctor,
  type Appointment,
  type InsertAppointment,
  type Medication,
  type InsertMedication,
  type Prescription,
  type InsertPrescription,
  type SkinAnalysis,
  type InsertSkinAnalysis,
  type AnalysisValidation,
  type InsertAnalysisValidation,
  type MedicalQuestionnaire,
  type InsertMedicalQuestionnaire,
  type ExpertNotification,
  type InsertExpertNotification,
  type AnalysisResult,
  type User,
  type InsertUser,
  type VideoCall,
  type InsertVideoCall,
  type CallParticipant,
  type InsertCallParticipant,
  type CallMessage,
  type InsertCallMessage,
  type UserSession,
  type InsertUserSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, sql } from "drizzle-orm";
import session from "express-session";

// interface for storage operations
export interface IStorage {
  // Patient operations
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPid(pid: string): Promise<Patient | undefined>;
  getPatientByUserId(userId: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;

  // Hospital operations
  getHospitals(): Promise<Hospital[]>;
  getHospital(id: number): Promise<Hospital | undefined>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;

  // Doctor operations
  getDoctors(): Promise<Doctor[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctorsByHospitalId(hospitalId: number): Promise<Doctor[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatientId(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Medication operations
  getMedications(): Promise<Medication[]>;
  getMedication(id: number): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<boolean>;

  // Prescription operations
  getPrescriptions(): Promise<Prescription[]>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionsByPatientId(patientId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  deletePrescription(id: number): Promise<boolean>;

  // Skin Analysis operations
  getSkinAnalyses(): Promise<SkinAnalysis[]>;
  getSkinAnalysis(id: number): Promise<SkinAnalysis | undefined>;
  getSkinAnalysesByPatientId(patientId: number): Promise<SkinAnalysis[]>;
  createSkinAnalysis(analysis: InsertSkinAnalysis): Promise<SkinAnalysis>;
  updateSkinAnalysis(id: number, analysis: Partial<InsertSkinAnalysis>): Promise<SkinAnalysis | undefined>;
  deleteSkinAnalysis(id: number): Promise<boolean>;
  
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  verifyUserEmail(id: number): Promise<void>;
  updateUserVerificationToken(id: number, token: string): Promise<void>;
  
  // Analysis Validation operations
  getAnalysisValidations(): Promise<AnalysisValidation[]>;
  getAnalysisValidation(id: number): Promise<AnalysisValidation | undefined>;
  getPendingValidationsByExpert(expertId: number): Promise<AnalysisValidation[]>;
  createAnalysisValidation(validation: InsertAnalysisValidation): Promise<AnalysisValidation>;
  updateAnalysisValidation(id: number, validation: Partial<InsertAnalysisValidation>): Promise<AnalysisValidation | undefined>;
  
  // Medical Questionnaire operations
  getMedicalQuestionnaires(): Promise<MedicalQuestionnaire[]>;
  getMedicalQuestionnaire(id: number): Promise<MedicalQuestionnaire | undefined>;
  getMedicalQuestionnaireByAnalysisId(analysisId: number): Promise<MedicalQuestionnaire | undefined>;
  createMedicalQuestionnaire(questionnaire: InsertMedicalQuestionnaire): Promise<MedicalQuestionnaire>;
  
  // Expert Notification operations
  getExpertNotifications(expertId: number): Promise<ExpertNotification[]>;
  createExpertNotification(notification: InsertExpertNotification): Promise<ExpertNotification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Video call operations
  getVideoCalls(): Promise<VideoCall[]>;
  getVideoCall(id: number): Promise<VideoCall | undefined>;
  getVideoCallByRoomId(roomId: string): Promise<VideoCall | undefined>;
  getVideoCallsForUser(userId: number, role: string): Promise<VideoCall[]>;
  createVideoCall(call: InsertVideoCall): Promise<VideoCall>;
  updateVideoCallStatus(id: number, status: string, startTime?: Date, endTime?: Date, duration?: number): Promise<VideoCall | undefined>;
  
  // Call participant operations
  createCallParticipant(participant: InsertCallParticipant): Promise<CallParticipant>;
  updateCallParticipantLeftAt(callId: number, userId: number, leftAt: Date): Promise<boolean>;
  updateCallParticipantAudio(callId: number, userId: number, audioEnabled: boolean): Promise<boolean>;
  updateCallParticipantVideo(callId: number, userId: number, videoEnabled: boolean): Promise<boolean>;
  
  // Call message operations
  createCallMessage(message: InsertCallMessage): Promise<CallMessage>;
  getCallMessages(callId: number): Promise<CallMessage[]>;

  // Session store for authentication
  sessionStore: session.Store;
}

import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private patients: Map<number, Patient>;
  private hospitals: Map<number, Hospital>;
  private doctors: Map<number, Doctor>;
  private appointments: Map<number, Appointment>;
  private medications: Map<number, Medication>;
  private prescriptions: Map<number, Prescription>;
  private skinAnalyses: Map<number, SkinAnalysis>;
  private users: Map<number, User>;
  private analysisValidations: Map<number, AnalysisValidation>;
  private medicalQuestionnaires: Map<number, MedicalQuestionnaire>;
  private expertNotifications: Map<number, ExpertNotification>;
  
  private patientId: number;
  private hospitalId: number;
  private doctorId: number;
  private appointmentId: number;
  private medicationId: number;
  private prescriptionId: number;
  private skinAnalysisId: number;
  private userId: number;
  private analysisValidationId: number;
  private medicalQuestionnaireId: number;
  private expertNotificationId: number;
  
  sessionStore: session.Store;

  constructor() {
    this.patients = new Map();
    this.hospitals = new Map();
    this.doctors = new Map();
    this.appointments = new Map();
    this.medications = new Map();
    this.prescriptions = new Map();
    this.skinAnalyses = new Map();
    this.users = new Map();
    this.analysisValidations = new Map();
    this.medicalQuestionnaires = new Map();
    this.expertNotifications = new Map();
    
    this.patientId = 1;
    this.hospitalId = 1;
    this.doctorId = 1;
    this.appointmentId = 1;
    this.medicationId = 1;
    this.prescriptionId = 1;
    this.skinAnalysisId = 1;
    this.userId = 1;
    this.analysisValidationId = 1;
    this.medicalQuestionnaireId = 1;
    this.expertNotificationId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Initialize data
    this.initializeData();
  }

  private async initializeData() {
    // Initialize with some medications
    this.initializeMedications();
    
    // Initialize with default users (doctor and assistant)
    await this.initializeUsers();
    
    // Initialize with demo data for testing
    this.initializeDemoData();
  }
  
  private initializeUsers() {
    // Create demo users with plain passwords for testing
    // In production, these would be properly hashed
    console.log("Initializing demo users...");
    
    // Create a doctor user (super user)
    const doctor = this.createUser({
      username: "doctor",
      password: "password123",
      name: "Dr. AriHariSudhan",
      role: "doctor",
      active: true
    });
    console.log("Created doctor user:", doctor);
    
    // Create an assistant user (limited access)
    const assistant = this.createUser({
      username: "assistant",
      password: "password123",
      name: "Medical Assistant",
      role: "assistant",
      active: true
    });
    console.log("Created assistant user:", assistant);
    
    // Create an expert user for validation workflow
    const expert = this.createUser({
      username: "expert",
      password: "expert123",
      name: "Dr. Expert Validator",
      role: "expert",
      active: true
    });
    console.log("Created expert user:", expert);
  }

  private initializeDemoData() {
    // Initialize hospitals
    this.initializeHospitals();
    
    // Initialize doctors
    this.initializeDoctors();
    
    // Create a demo patient for testing
    const demoPatient = this.createPatient({
      pid: "DEMO001",
      name: "Demo Patient",
      userId: null,
      age: 35,
      gender: "female",
      email: "demo@example.com",
      phone: "+1234567890",
      address: "123 Demo Street",
      allergies: "None known",
      lastVisitDate: "2025-05-15",
      nextVisitDate: "2025-07-15",
      profileImage: null
    });

    // Create a demo skin analysis for testing expert validation
    this.createSkinAnalysis({
      patientId: demoPatient.id,
      imageUrl: "/demo-skin-image.jpg",
      imageType: "skin",
      bodyPart: "face",
      results: JSON.stringify([{
        condition: "Acne Vulgaris",
        confidence: 0.85,
        severity: "moderate",
        description: "Moderate inflammatory acne with comedones and papules primarily on the forehead and cheek areas."
      }]),
      notes: "Patient reports recent breakouts, requests treatment options"
    });
  }

  private initializeMedications() {
    const medications = [
      {
        name: "Hydrocortisone Cream",
        category: "Corticosteroid",
        description: "For treating skin inflammation and allergic reactions",
        dosageForm: "Cream",
        price: 1250, // $12.50
        inStock: true,
        image: "/images/hydrocortisone.jpg"
      },
      {
        name: "Tretinoin",
        category: "Retinoid",
        description: "For treating acne and reducing fine wrinkles",
        dosageForm: "Gel",
        price: 3500, // $35.00
        inStock: true,
        image: "/images/tretinoin.jpg"
      },
      {
        name: "Clobetasol Propionate",
        category: "Corticosteroid",
        description: "For treating severe skin conditions like eczema and psoriasis",
        dosageForm: "Ointment",
        price: 2800, // $28.00
        inStock: true,
        image: "/images/clobetasol.jpg"
      },
      {
        name: "Benzoyl Peroxide",
        category: "Antimicrobial",
        description: "For treating mild to moderate acne by reducing bacteria",
        dosageForm: "Gel",
        price: 1500, // $15.00
        inStock: true,
        image: "/images/benzoyl.jpg"
      },
      {
        name: "Clotrimazole",
        category: "Antifungal",
        description: "For treating fungal skin infections like athlete's foot and ringworm",
        dosageForm: "Cream",
        price: 1800, // $18.00
        inStock: true,
        image: "/images/clotrimazole.jpg"
      },
      {
        name: "Adapalene",
        category: "Retinoid",
        description: "For treating acne, particularly effective for blackheads and whiteheads",
        dosageForm: "Gel",
        price: 2500, // $25.00
        inStock: true,
        image: "/images/adapalene.jpg"
      },
      {
        name: "Tacrolimus",
        category: "Immunomodulator",
        description: "For treating atopic dermatitis (eczema), particularly for sensitive areas",
        dosageForm: "Ointment",
        price: 4200, // $42.00
        inStock: true,
        image: "/images/tacrolimus.jpg"
      },
      {
        name: "Azelaic Acid",
        category: "Dicarboxylic Acid",
        description: "For treating rosacea and acne, also helps with hyperpigmentation",
        dosageForm: "Cream",
        price: 2100, // $21.00
        inStock: true,
        image: "/images/azelaic.jpg"
      }
    ];

    medications.forEach(med => {
      // Add medication to map directly to avoid type errors
      const id = this.medicationId++;
      const newMedication = { ...med, id };
      this.medications.set(id, newMedication);
    });
  }

  private initializeHospitals() {
    const hospitals = [
      {
        name: "MV Skin Clinic",
        address: "123 Medical Center Dr, Chennai",
        email: "info@mvskin.com",
        phone: "+91-44-12345678"
      },
      {
        name: "Bhuvana Hospital",
        address: "456 Healthcare Ave, Chennai", 
        email: "contact@bhuvanahospital.com",
        phone: "+91-44-87654321"
      },
      {
        name: "Chandu Hospital",
        address: "789 Wellness Blvd, Chennai",
        email: "admin@chanduhospital.com", 
        phone: "+91-44-11223344"
      }
    ];

    hospitals.forEach(hospital => {
      const id = this.hospitalId++;
      const newHospital = { ...hospital, id, createdAt: new Date() };
      this.hospitals.set(id, newHospital);
    });
  }

  private initializeDoctors() {
    const doctors = [
      {
        name: "Dr. Rajesh Kumar",
        hospitalId: 1, // MV Skin Clinic
        specialization: "Dermatology",
        email: "rajesh@mvskin.com",
        phone: "+91-44-12345679",
        experience: "15 years"
      },
      {
        name: "Dr. Priya Sharma", 
        hospitalId: 1, // MV Skin Clinic
        specialization: "Cosmetic Dermatology",
        email: "priya@mvskin.com",
        phone: "+91-44-12345680",
        experience: "12 years"
      },
      {
        name: "Dr. Arjun Reddy",
        hospitalId: 2, // Bhuvana Hospital
        specialization: "Dermatology",
        email: "arjun@bhuvanahospital.com", 
        phone: "+91-44-87654322",
        experience: "20 years"
      },
      {
        name: "Dr. Kavitha Nair",
        hospitalId: 2, // Bhuvana Hospital
        specialization: "Pediatric Dermatology",
        email: "kavitha@bhuvanahospital.com",
        phone: "+91-44-87654323", 
        experience: "18 years"
      },
      {
        name: "Dr. Vikram Singh",
        hospitalId: 3, // Chandu Hospital
        specialization: "Dermatology",
        email: "vikram@chanduhospital.com",
        phone: "+91-44-11223345",
        experience: "10 years"
      },
      {
        name: "Dr. Meera Patel",
        hospitalId: 3, // Chandu Hospital
        specialization: "Dermatopathology", 
        email: "meera@chanduhospital.com",
        phone: "+91-44-11223346",
        experience: "14 years"
      }
    ];

    doctors.forEach(doctor => {
      const id = this.doctorId++;
      const newDoctor = { ...doctor, id, createdAt: new Date() };
      this.doctors.set(id, newDoctor);
    });
  }

  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByPid(pid: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.pid === pid
    );
  }
  
  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.userId === userId
    );
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = this.patientId++;
    const newPatient = { ...patient, id, createdAt: new Date() };
    this.patients.set(id, newPatient);
    return newPatient;
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) return undefined;

    const updatedPatient = { ...existingPatient, ...patient };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  // Hospital operations
  async getHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  async getHospital(id: number): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const id = this.hospitalId++;
    const newHospital = { ...hospital, id, createdAt: new Date() };
    this.hospitals.set(id, newHospital);
    return newHospital;
  }

  // Doctor operations
  async getDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async getDoctorsByHospitalId(hospitalId: number): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter(
      (doctor) => doctor.hospitalId === hospitalId
    );
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const id = this.doctorId++;
    const newDoctor = { ...doctor, id, createdAt: new Date() };
    this.doctors.set(id, newDoctor);
    return newDoctor;
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.patientId === patientId
    );
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.appointments.values()).filter(
      (appointment) => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate.toISOString().split('T')[0] === dateString;
      }
    );
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentId++;
    const newAppointment = { ...appointment, id, createdAt: new Date() };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;

    const updatedAppointment = { ...existingAppointment, ...appointment };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Medication operations
  async getMedications(): Promise<Medication[]> {
    return Array.from(this.medications.values());
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    return this.medications.get(id);
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const id = this.medicationId++;
    const newMedication = { ...medication, id };
    this.medications.set(id, newMedication);
    return newMedication;
  }

  async updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined> {
    const existingMedication = this.medications.get(id);
    if (!existingMedication) return undefined;

    const updatedMedication = { ...existingMedication, ...medication };
    this.medications.set(id, updatedMedication);
    return updatedMedication;
  }

  async deleteMedication(id: number): Promise<boolean> {
    return this.medications.delete(id);
  }

  // Prescription operations
  async getPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values());
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async getPrescriptionsByPatientId(patientId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.patientId === patientId
    );
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionId++;
    const newPrescription = { ...prescription, id, createdAt: new Date() };
    this.prescriptions.set(id, newPrescription);
    return newPrescription;
  }

  async updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const existingPrescription = this.prescriptions.get(id);
    if (!existingPrescription) return undefined;

    const updatedPrescription = { ...existingPrescription, ...prescription };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }

  async deletePrescription(id: number): Promise<boolean> {
    return this.prescriptions.delete(id);
  }

  // Skin Analysis operations
  async getSkinAnalyses(): Promise<SkinAnalysis[]> {
    return Array.from(this.skinAnalyses.values());
  }

  async getSkinAnalysis(id: number): Promise<SkinAnalysis | undefined> {
    return this.skinAnalyses.get(id);
  }

  async getSkinAnalysesByPatientId(patientId: number): Promise<SkinAnalysis[]> {
    return Array.from(this.skinAnalyses.values()).filter(
      (analysis) => analysis.patientId === patientId
    );
  }

  async createSkinAnalysis(analysis: InsertSkinAnalysis): Promise<SkinAnalysis> {
    const id = this.skinAnalysisId++;
    const newAnalysis = { ...analysis, id, createdAt: new Date() };
    this.skinAnalyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async updateSkinAnalysis(id: number, analysis: Partial<InsertSkinAnalysis>): Promise<SkinAnalysis | undefined> {
    const existingAnalysis = this.skinAnalyses.get(id);
    if (!existingAnalysis) return undefined;

    const updatedAnalysis = { ...existingAnalysis, ...analysis };
    this.skinAnalyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async deleteSkinAnalysis(id: number): Promise<boolean> {
    return this.skinAnalyses.delete(id);
  }
  
  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.emailVerificationToken === token
    );
  }

  async verifyUserEmail(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { 
        ...user, 
        emailVerified: true, 
        emailVerificationToken: null 
      };
      this.users.set(id, updatedUser);
    }
  }

  async updateUserVerificationToken(id: number, token: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, emailVerificationToken: token };
      this.users.set(id, updatedUser);
    }
  }

  // Analysis Validation operations
  async getAnalysisValidations(): Promise<AnalysisValidation[]> {
    return Array.from(this.analysisValidations.values());
  }

  async getAnalysisValidation(id: number): Promise<AnalysisValidation | undefined> {
    return this.analysisValidations.get(id);
  }

  async getPendingValidationsByExpert(expertId: number): Promise<AnalysisValidation[]> {
    return Array.from(this.analysisValidations.values()).filter(
      validation => validation.expertId === expertId && validation.status === "pending"
    );
  }

  async createAnalysisValidation(validation: InsertAnalysisValidation): Promise<AnalysisValidation> {
    const newValidation = {
      id: this.analysisValidationId++,
      createdAt: new Date(),
      ...validation
    };
    this.analysisValidations.set(newValidation.id, newValidation);
    return newValidation;
  }

  async updateAnalysisValidation(id: number, validation: Partial<InsertAnalysisValidation>): Promise<AnalysisValidation | undefined> {
    const existing = this.analysisValidations.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...validation };
    this.analysisValidations.set(id, updated);
    return updated;
  }

  // Medical Questionnaire operations
  async getMedicalQuestionnaires(): Promise<MedicalQuestionnaire[]> {
    return Array.from(this.medicalQuestionnaires.values());
  }

  async getMedicalQuestionnaire(id: number): Promise<MedicalQuestionnaire | undefined> {
    return this.medicalQuestionnaires.get(id);
  }

  async getMedicalQuestionnaireByAnalysisId(analysisId: number): Promise<MedicalQuestionnaire | undefined> {
    return Array.from(this.medicalQuestionnaires.values()).find(
      questionnaire => questionnaire.skinAnalysisId === analysisId
    );
  }

  async createMedicalQuestionnaire(questionnaire: InsertMedicalQuestionnaire): Promise<MedicalQuestionnaire> {
    const newQuestionnaire = {
      id: this.medicalQuestionnaireId++,
      createdAt: new Date(),
      ...questionnaire
    };
    this.medicalQuestionnaires.set(newQuestionnaire.id, newQuestionnaire);
    return newQuestionnaire;
  }

  // Expert Notification operations
  async getExpertNotifications(expertId: number): Promise<ExpertNotification[]> {
    return Array.from(this.expertNotifications.values()).filter(
      notification => notification.expertId === expertId
    );
  }

  async createExpertNotification(notification: InsertExpertNotification): Promise<ExpertNotification> {
    const newNotification = {
      id: this.expertNotificationId++,
      createdAt: new Date(),
      isRead: false,
      ...notification
    };
    this.expertNotifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.expertNotifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    this.expertNotifications.set(id, notification);
    return true;
  }
}

// Database storage implementation
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Use the DATABASE_URL from environment
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }
  // Patient operations
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async getPatientByPid(pid: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.pid, pid));
    return patient;
  }
  
  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [updatedPatient] = await db
      .update(patients)
      .set(patient)
      .where(eq(patients.id, id))
      .returning();
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return true; // In PostgreSQL with Drizzle, we don't get a count of deleted rows easily
  }

  // Hospital operations
  async getHospitals(): Promise<Hospital[]> {
    return await db.select().from(hospitals).orderBy(hospitals.name);
  }

  async getHospital(id: number): Promise<Hospital | undefined> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.id, id));
    return hospital;
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const [newHospital] = await db.insert(hospitals).values(hospital).returning();
    return newHospital;
  }

  // Doctor operations
  async getDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors).orderBy(doctors.name);
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async getDoctorsByHospitalId(hospitalId: number): Promise<Doctor[]> {
    return await db
      .select()
      .from(doctors)
      .where(eq(doctors.hospitalId, hospitalId))
      .orderBy(doctors.name);
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db.insert(doctors).values(doctor).returning();
    return newDoctor;
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.date));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentsByPatientId(patientId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.date));
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const dateStr = date.toISOString().split('T')[0];
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.date, dateStr))
      .orderBy(appointments.time);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    await db.delete(appointments).where(eq(appointments.id, id));
    return true;
  }

  // Medication operations
  async getMedications(): Promise<Medication[]> {
    return await db.select().from(medications).orderBy(medications.name);
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication;
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMedication] = await db
      .insert(medications)
      .values(medication)
      .returning();
    return newMedication;
  }

  async updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updatedMedication] = await db
      .update(medications)
      .set(medication)
      .where(eq(medications.id, id))
      .returning();
    return updatedMedication;
  }

  async deleteMedication(id: number): Promise<boolean> {
    await db.delete(medications).where(eq(medications.id, id));
    return true;
  }

  // Prescription operations
  async getPrescriptions(): Promise<Prescription[]> {
    return await db.select().from(prescriptions).orderBy(desc(prescriptions.date));
  }

  async getPrescription(id: number): Promise<Prescription | undefined> {
    const [prescription] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, id));
    return prescription;
  }

  async getPrescriptionsByPatientId(patientId: number): Promise<Prescription[]> {
    return await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.date));
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [newPrescription] = await db
      .insert(prescriptions)
      .values(prescription)
      .returning();
    return newPrescription;
  }

  async updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set(prescription)
      .where(eq(prescriptions.id, id))
      .returning();
    return updatedPrescription;
  }

  async deletePrescription(id: number): Promise<boolean> {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
    return true;
  }

  // Skin Analysis operations
  async getSkinAnalyses(): Promise<SkinAnalysis[]> {
    return await db
      .select()
      .from(skinAnalyses)
      .orderBy(desc(skinAnalyses.createdAt));
  }

  async getSkinAnalysis(id: number): Promise<SkinAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(skinAnalyses)
      .where(eq(skinAnalyses.id, id));
    return analysis;
  }

  async getSkinAnalysesByPatientId(patientId: number): Promise<SkinAnalysis[]> {
    return await db
      .select()
      .from(skinAnalyses)
      .where(eq(skinAnalyses.patientId, patientId))
      .orderBy(desc(skinAnalyses.createdAt));
  }

  async createSkinAnalysis(analysis: InsertSkinAnalysis): Promise<SkinAnalysis> {
    const [newAnalysis] = await db
      .insert(skinAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async updateSkinAnalysis(id: number, analysis: Partial<InsertSkinAnalysis>): Promise<SkinAnalysis | undefined> {
    const [updatedAnalysis] = await db
      .update(skinAnalyses)
      .set(analysis)
      .where(eq(skinAnalyses.id, id))
      .returning();
    return updatedAnalysis;
  }

  async deleteSkinAnalysis(id: number): Promise<boolean> {
    await db.delete(skinAnalyses).where(eq(skinAnalyses.id, id));
    return true;
  }
  
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return user;
  }

  async verifyUserEmail(id: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null 
      })
      .where(eq(users.id, id));
  }

  async updateUserVerificationToken(id: number, token: string): Promise<void> {
    await db
      .update(users)
      .set({ emailVerificationToken: token })
      .where(eq(users.id, id));
  }

  // Analysis Validation operations
  async getAnalysisValidations(): Promise<AnalysisValidation[]> {
    return await db
      .select()
      .from(analysisValidations)
      .orderBy(desc(analysisValidations.createdAt));
  }

  async getAnalysisValidation(id: number): Promise<AnalysisValidation | undefined> {
    const [validation] = await db
      .select()
      .from(analysisValidations)
      .where(eq(analysisValidations.id, id));
    return validation;
  }

  async getPendingValidationsByExpert(expertId: number): Promise<AnalysisValidation[]> {
    return await db
      .select()
      .from(analysisValidations)
      .where(and(
        eq(analysisValidations.expertId, expertId),
        eq(analysisValidations.status, "pending")
      ))
      .orderBy(desc(analysisValidations.createdAt));
  }

  async createAnalysisValidation(validation: InsertAnalysisValidation): Promise<AnalysisValidation> {
    const [newValidation] = await db
      .insert(analysisValidations)
      .values(validation)
      .returning();
    return newValidation;
  }

  async updateAnalysisValidation(id: number, validation: Partial<InsertAnalysisValidation>): Promise<AnalysisValidation | undefined> {
    const [updatedValidation] = await db
      .update(analysisValidations)
      .set(validation)
      .where(eq(analysisValidations.id, id))
      .returning();
    return updatedValidation;
  }

  // Medical Questionnaire operations
  async getMedicalQuestionnaires(): Promise<MedicalQuestionnaire[]> {
    return await db
      .select()
      .from(medicalQuestionnaires)
      .orderBy(desc(medicalQuestionnaires.createdAt));
  }

  async getMedicalQuestionnaire(id: number): Promise<MedicalQuestionnaire | undefined> {
    const [questionnaire] = await db
      .select()
      .from(medicalQuestionnaires)
      .where(eq(medicalQuestionnaires.id, id));
    return questionnaire;
  }

  async getMedicalQuestionnaireByAnalysisId(analysisId: number): Promise<MedicalQuestionnaire | undefined> {
    const [questionnaire] = await db
      .select()
      .from(medicalQuestionnaires)
      .where(eq(medicalQuestionnaires.skinAnalysisId, analysisId));
    return questionnaire;
  }

  async createMedicalQuestionnaire(questionnaire: InsertMedicalQuestionnaire): Promise<MedicalQuestionnaire> {
    const [newQuestionnaire] = await db
      .insert(medicalQuestionnaires)
      .values(questionnaire)
      .returning();
    return newQuestionnaire;
  }

  // Expert Notification operations
  async getExpertNotifications(expertId: number): Promise<ExpertNotification[]> {
    return await db
      .select()
      .from(expertNotifications)
      .where(eq(expertNotifications.expertId, expertId))
      .orderBy(desc(expertNotifications.createdAt));
  }

  async createExpertNotification(notification: InsertExpertNotification): Promise<ExpertNotification> {
    const [newNotification] = await db
      .insert(expertNotifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const [updated] = await db
      .update(expertNotifications)
      .set({ isRead: true })
      .where(eq(expertNotifications.id, id))
      .returning();
    return !!updated;
  }

  // Video call operations
  async getVideoCalls(): Promise<VideoCall[]> {
    return await db.select().from(videoCalls).orderBy(desc(videoCalls.scheduledTime));
  }

  async getVideoCall(id: number): Promise<VideoCall | undefined> {
    const [call] = await db.select().from(videoCalls).where(eq(videoCalls.id, id));
    return call;
  }

  async getVideoCallByRoomId(roomId: string): Promise<VideoCall | undefined> {
    const [call] = await db.select().from(videoCalls).where(eq(videoCalls.roomId, roomId));
    return call;
  }

  async getVideoCallsForUser(userId: number, role: string): Promise<VideoCall[]> {
    if (role === "patient") {
      const patient = await this.getPatientByUserId(userId);
      if (!patient) return [];
      return await db
        .select()
        .from(videoCalls)
        .where(eq(videoCalls.patientId, patient.id))
        .orderBy(desc(videoCalls.scheduledTime));
    } else if (role === "doctor") {
      return await db
        .select()
        .from(videoCalls)
        .where(eq(videoCalls.doctorId, userId))
        .orderBy(desc(videoCalls.scheduledTime));
    }
    return [];
  }

  async createVideoCall(call: InsertVideoCall): Promise<VideoCall> {
    const [newCall] = await db.insert(videoCalls).values(call).returning();
    return newCall;
  }

  async updateVideoCallStatus(
    id: number, 
    status: string, 
    startTime?: Date, 
    endTime?: Date, 
    duration?: number
  ): Promise<VideoCall | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (duration) updateData.duration = duration;

    const [updatedCall] = await db
      .update(videoCalls)
      .set(updateData)
      .where(eq(videoCalls.id, id))
      .returning();
    return updatedCall;
  }

  // Call participant operations
  async createCallParticipant(participant: InsertCallParticipant): Promise<CallParticipant> {
    const [newParticipant] = await db.insert(callParticipants).values(participant).returning();
    return newParticipant;
  }

  async updateCallParticipantLeftAt(callId: number, userId: number, leftAt: Date): Promise<boolean> {
    await db
      .update(callParticipants)
      .set({ leftAt, connectionStatus: "offline" })
      .where(and(eq(callParticipants.callId, callId), eq(callParticipants.userId, userId)));
    return true;
  }

  async updateCallParticipantAudio(callId: number, userId: number, audioEnabled: boolean): Promise<boolean> {
    await db
      .update(callParticipants)
      .set({ audioEnabled })
      .where(and(eq(callParticipants.callId, callId), eq(callParticipants.userId, userId)));
    return true;
  }

  async updateCallParticipantVideo(callId: number, userId: number, videoEnabled: boolean): Promise<boolean> {
    await db
      .update(callParticipants)
      .set({ videoEnabled })
      .where(and(eq(callParticipants.callId, callId), eq(callParticipants.userId, userId)));
    return true;
  }

  // Call message operations
  async createCallMessage(message: InsertCallMessage): Promise<CallMessage> {
    const [newMessage] = await db.insert(callMessages).values(message).returning();
    return newMessage;
  }

  async getCallMessages(callId: number): Promise<CallMessage[]> {
    return await db
      .select()
      .from(callMessages)
      .where(eq(callMessages.callId, callId))
      .orderBy(callMessages.timestamp);
  }

  // Session management operations
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async invalidateUserSessions(userId: number, excludeSessionId?: string): Promise<boolean> {
    try {
      if (excludeSessionId) {
        // Invalidate all sessions except the current one
        const result = await db
          .update(userSessions)
          .set({ 
            isActive: false, 
            logoutTime: new Date() 
          })
          .where(and(
            eq(userSessions.userId, userId),
            sql`${userSessions.sessionId} != ${excludeSessionId}`
          ))
          .returning();
        
      } else {
        // Invalidate all sessions for user
        await db
          .update(userSessions)
          .set({ 
            isActive: false, 
            logoutTime: new Date() 
          })
          .where(eq(userSessions.userId, userId));
      }
      return true;
    } catch (error) {
      console.error("Error invalidating user sessions:", error);
      return false;
    }
  }

  async updateUserCurrentSession(userId: number, sessionId: string): Promise<boolean> {
    await db
      .update(users)
      .set({ currentSessionId: sessionId })
      .where(eq(users.id, userId));
    return true;
  }

  async updateSessionActivity(sessionId: string): Promise<boolean> {
    await db
      .update(userSessions)
      .set({ lastActivity: new Date() })
      .where(eq(userSessions.sessionId, sessionId));
    return true;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.sessionId, sessionId), eq(userSessions.isActive, true)));
    return session;
  }

  async logoutUserSession(sessionId: string): Promise<boolean> {
    await db
      .update(userSessions)
      .set({ 
        isActive: false, 
        logoutTime: new Date() 
      })
      .where(eq(userSessions.sessionId, sessionId));
    return true;
  }

  async validateUserSession(userId: number, sessionId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user || user.currentSessionId !== sessionId) {
        return false;
      }

      const session = await this.getUserSession(sessionId);
      return session !== undefined && session.userId === userId && session.isActive;
    } catch (error) {
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
