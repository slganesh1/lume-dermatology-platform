import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AvatarProfile } from "@/components/ui/avatar-profile";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { useLocation } from "wouter";
import { type Patient, type Appointment, type Prescription, type SkinAnalysis } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";

interface PatientDetailsProps {
  patient: Patient;
  onClose?: () => void;
}

export default function PatientDetails({ patient, onClose }: PatientDetailsProps) {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("medical-history");

  // Fetch patient appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: [`/api/appointments/patient/${patient.id}`],
  });

  // Fetch patient prescriptions
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: [`/api/prescriptions/patient/${patient.id}`],
  });

  // Fetch patient skin analyses
  const { data: skinAnalyses, isLoading: isLoadingSkinAnalyses } = useQuery({
    queryKey: [`/api/skin-analyses/patient/${patient.id}`],
  });

  // Table columns for appointments
  const appointmentColumns = [
    {
      header: "Date",
      accessor: (row: Appointment) => (
        <div className="text-sm">
          <div className="font-medium">{formatDate(row.date)}</div>
          <div className="text-gray-500">{row.time}</div>
        </div>
      ),
    },
    {
      header: "Purpose",
      accessor: (row: Appointment) => (
        <div className="text-sm">{row.purpose}</div>
      ),
    },
    {
      header: "Status",
      accessor: (row: Appointment) => {
        let badgeVariant = "secondary";
        if (row.status === "Confirmed") badgeVariant = "success";
        if (row.status === "Checked In") badgeVariant = "default";
        if (row.status === "Cancelled") badgeVariant = "destructive";
        if (row.status === "Pending") badgeVariant = "warning";
        
        return (
          <Badge variant={badgeVariant as any}>{row.status}</Badge>
        );
      },
    },
    {
      header: "Notes",
      accessor: (row: Appointment) => (
        <div className="text-sm text-gray-500 max-w-[200px] truncate">
          {row.notes || "No notes"}
        </div>
      ),
    },
  ];

  // Table columns for analyses
  const analysisColumns = [
    {
      header: "Date",
      accessor: (row: SkinAnalysis) => (
        <div className="text-sm font-medium">{formatDate(row.date)}</div>
      ),
    },
    {
      header: "Image",
      accessor: (row: SkinAnalysis) => (
        <div className="h-12 w-16 rounded overflow-hidden">
          <img
            src={row.imageUrl}
            alt="Skin condition"
            className="h-full w-full object-cover"
          />
        </div>
      ),
    },
    {
      header: "Conditions",
      accessor: (row: SkinAnalysis) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(row.results) && row.results.map((result, index) => (
            <Badge key={index} variant="outline">
              {result.condition}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: SkinAnalysis) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/skin-analysis/${row.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  // Table columns for prescriptions
  const prescriptionColumns = [
    {
      header: "Date",
      accessor: (row: Prescription) => (
        <div className="text-sm font-medium">{formatDate(row.date)}</div>
      ),
    },
    {
      header: "Medications",
      accessor: (row: Prescription) => (
        <div className="text-sm">
          {Array.isArray(row.items) ? (
            <div className="flex flex-col gap-1">
              {row.items.slice(0, 2).map((item, index) => (
                <div key={index} className="text-sm">
                  {item.medicationName} - {item.dosage}
                </div>
              ))}
              {row.items.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{row.items.length - 2} more
                </div>
              )}
            </div>
          ) : (
            "No medications"
          )}
        </div>
      ),
    },
    {
      header: "Remarks",
      accessor: (row: Prescription) => (
        <div className="text-sm text-gray-500 max-w-[200px] truncate">
          {row.remarks || "No remarks"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Prescription) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/prescriptions/${row.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Patient Profile Header */}
      <div className="flex items-center mb-6">
        <AvatarProfile
          src={patient.profileImage}
          name={patient.name}
          size="xl"
        />
        <div className="ml-4">
          <h4 className="text-xl font-bold text-gray-900">{patient.name}</h4>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <Badge variant="outline" className="mr-2">
              PID: {patient.pid}
            </Badge>
            <span>
              {patient.age} years • {patient.gender}
            </span>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h5 className="text-sm font-medium text-gray-500 mb-2">
            Contact Information
          </h5>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm mb-2">
              <svg
                className="inline-block w-4 h-4 mr-2 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>{patient.phone}</span>
            </p>
            <p className="text-sm mb-2">
              <svg
                className="inline-block w-4 h-4 mr-2 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>{patient.email}</span>
            </p>
            <p className="text-sm">
              <svg
                className="inline-block w-4 h-4 mr-2 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{patient.address || "No address provided"}</span>
            </p>
          </div>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-500 mb-2">
            Medical Information
          </h5>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm mb-2">
              <span className="text-gray-500 mr-2">Last Visit:</span>
              <span className="font-medium">
                {patient.lastVisitDate
                  ? formatDate(patient.lastVisitDate)
                  : "No previous visits"}
              </span>
            </p>
            <p className="text-sm mb-2">
              <span className="text-gray-500 mr-2">Next Visit:</span>
              <span className="font-medium">
                {patient.nextVisitDate
                  ? formatDate(patient.nextVisitDate)
                  : "Not scheduled"}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500 mr-2">Allergies:</span>
              <span className="font-medium">
                {patient.allergies || "No known allergies"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Medical History Tabs */}
      <Tabs
        defaultValue="medical-history"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="border-b border-gray-200 w-full justify-start space-x-8">
          <TabsTrigger value="medical-history" className="relative">
            Medical History
          </TabsTrigger>
          <TabsTrigger value="medications" className="relative">
            Medications
          </TabsTrigger>
          <TabsTrigger value="appointments" className="relative">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="analyses" className="relative">
            Analyses
          </TabsTrigger>
        </TabsList>

        {/* Medical History Content */}
        <TabsContent value="medical-history" className="mt-4">
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <div className="flex justify-between">
                <h5 className="text-sm font-medium text-gray-900">
                  Chronic Eczema
                </h5>
                <span className="text-xs text-gray-500">
                  First diagnosed: 12 Jan 2022
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Patient has recurring eczema on inner elbows and behind knees.
                Responds well to topical corticosteroids. Flare-ups associated
                with seasonal allergies and stress.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">Chronic</Badge>
                <Badge variant="outline">Moderate</Badge>
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div className="flex justify-between">
                <h5 className="text-sm font-medium text-gray-900">
                  Contact Dermatitis
                </h5>
                <span className="text-xs text-gray-500">
                  Episode: 18 Jul 2023
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Developed skin irritation after using new laundry detergent.
                Symptoms include redness, itching, and small blisters on hands
                and forearms.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">Acute</Badge>
                <Badge variant="outline">Moderate</Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Medications Content */}
        <TabsContent value="medications" className="mt-4">
          <DataTable
            data={Array.isArray(prescriptions) ? prescriptions : []}
            columns={prescriptionColumns}
            keyField="id"
            isLoading={isLoadingPrescriptions}
            emptyState={
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 2h18v4H3z"></path>
                  <path d="M7 6v16"></path>
                  <path d="M17 6v16"></path>
                  <path d="M3 10h18"></path>
                  <path d="M3 14h18"></path>
                  <path d="M3 18h18"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No prescriptions
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This patient doesn't have any prescriptions yet
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      setLocation(`/prescriptions/new?patientId=${patient.id}`)
                    }
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create Prescription
                  </Button>
                </div>
              </div>
            }
          />
        </TabsContent>

        {/* Appointments Content */}
        <TabsContent value="appointments" className="mt-4">
          <DataTable
            data={Array.isArray(appointments) ? appointments : []}
            columns={appointmentColumns}
            keyField="id"
            isLoading={isLoadingAppointments}
            emptyState={
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No appointments
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This patient doesn't have any appointments yet
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      setLocation(`/appointments/new?patientId=${patient.id}`)
                    }
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Schedule Appointment
                  </Button>
                </div>
              </div>
            }
          />
        </TabsContent>

        {/* Analyses Content */}
        <TabsContent value="analyses" className="mt-4">
          <DataTable
            data={Array.isArray(skinAnalyses) ? skinAnalyses : []}
            columns={analysisColumns}
            keyField="id"
            isLoading={isLoadingSkinAnalyses}
            emptyState={
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24"></path>
                  <path d="M21 8V3h-5"></path>
                  <path d="M15 7c-1.07-.71-2.25-1-4-1a9 9 0 1 0 9 9"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No skin analyses
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This patient doesn't have any skin analyses yet
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() =>
                      setLocation(`/skin-analysis?patientId=${patient.id}`)
                    }
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New Skin Analysis
                  </Button>
                </div>
              </div>
            }
          />
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          onClick={() => setLocation(`/appointments/new?patientId=${patient.id}`)}
        >
          Schedule Appointment
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocation(`/patients/${patient.id}/edit`)}
        >
          Edit Patient
        </Button>
      </div>
    </div>
  );
}
