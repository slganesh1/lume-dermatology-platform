import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { type Patient, type Appointment, type Prescription, type SkinAnalysis } from "@shared/schema";
import { useState } from "react";
import { useLocation } from "wouter";

interface PatientRecordsProps {
  patientId: number;
  onClose?: () => void;
}

export default function PatientRecords({ patientId, onClose }: PatientRecordsProps) {
  const [location, setLocation] = useLocation();
  
  // Fetch patient data
  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
  });
  
  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: [`/api/appointments/patient/${patientId}`],
  });
  
  // Fetch prescriptions
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/prescriptions/patient/${patientId}`],
  });
  
  // Fetch skin analyses
  const { data: skinAnalyses, isLoading: isLoadingSkinAnalyses } = useQuery<SkinAnalysis[]>({
    queryKey: [`/api/skin-analyses/patient/${patientId}`],
  });
  
  const isLoading = isLoadingPatient || isLoadingAppointments || isLoadingPrescriptions || isLoadingSkinAnalyses;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-red-600">Patient not found</h3>
        <Button 
          className="mt-4"
          onClick={() => setLocation("/patients")}
        >
          Back to Patients
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Medical Records: {patient.name}
          </h2>
          <p className="text-gray-600">PID: {patient.pid}</p>
        </div>
        <Button 
          variant="outline"
          onClick={onClose || (() => setLocation("/patients"))}
        >
          Back to Patients
        </Button>
      </div>
      
      {/* Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation(`/appointments/new?patientId=${patientId}`)}
            >
              Schedule New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments && appointments.length > 0 ? (
            <div className="divide-y">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{formatDate(appointment.date)}</div>
                      <div className="text-sm text-gray-500">
                        {appointment.time} - {appointment.purpose || "General checkup"}
                      </div>
                    </div>
                    <div className="text-sm">
                      {appointment.status === "completed" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          Completed
                        </span>
                      ) : appointment.status === "cancelled" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No appointments found
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Prescriptions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Prescriptions</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation(`/prescriptions/new?patientId=${patientId}`)}
            >
              New Prescription
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {prescriptions && prescriptions.length > 0 ? (
            <div className="divide-y">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Prescription #{prescription.id}</div>
                      <div className="text-sm text-gray-500">
                        Issued: {formatDate(prescription.date)}
                      </div>
                    </div>
                    <Button variant="link" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No prescriptions found
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Skin Analyses */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Skin Analyses</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation(`/skin-analysis?patientId=${patientId}`)}
            >
              New Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {skinAnalyses && skinAnalyses.length > 0 ? (
            <div className="divide-y">
              {skinAnalyses.map((analysis) => (
                <div key={analysis.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Analysis #{analysis.id}</div>
                      <div className="text-sm text-gray-500">
                        Date: {formatDate(analysis.createdAt || new Date().toString())}
                      </div>
                    </div>
                    <Button variant="link" size="sm">
                      View Results
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No skin analyses found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}