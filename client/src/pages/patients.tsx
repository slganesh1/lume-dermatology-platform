import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AvatarProfile } from "@/components/ui/avatar-profile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { formatDate } from "@/lib/utils";
import { type Patient } from "@shared/schema";
import PatientForm from "@/components/patient-form";
import PatientDetails from "@/components/patient-details";
import PatientRecords from "@/components/patient-records";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Patients() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check for different route patterns
  const [matchesPidRoute, pidParams] = useRoute("/patients/pid/:pid");
  const [matchesEditRoute, editParams] = useRoute("/patients/:id/edit");
  const [matchesRecordsRoute, recordParams] = useRoute("/patients/:id/records");
  
  const pidFromUrl = pidParams?.pid;
  const editPatientId = matchesEditRoute ? parseInt(editParams?.id || "0") : null;
  const recordsPatientId = matchesRecordsRoute ? parseInt(recordParams?.id || "0") : null;

  // Fetch patients
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  
  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: number) => {
      const response = await apiRequest("DELETE", `/api/patients/${patientId}`);
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete patient");
      }
      return true;
    },
    onSuccess: () => {
      // Invalidate patients query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      toast({
        title: "Patient deleted",
        description: `${patientToDelete?.name} has been removed from the system`,
        variant: "default",
      });
      
      // Reset delete state
      setPatientToDelete(null);
      setShowDeleteConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was a problem deleting the patient",
        variant: "destructive",
      });
    }
  });

  // Handle delete confirmation
  const handleDeletePatient = () => {
    if (patientToDelete) {
      deletePatientMutation.mutate(patientToDelete.id);
    }
  };
  
  // Watch for changes to patientToDelete
  useEffect(() => {
    if (patientToDelete) {
      setShowDeleteConfirm(true);
    }
  }, [patientToDelete]);

  // Look up patient by PID when we have one
  useEffect(() => {
    if (pidFromUrl && patients) {
      const foundPatient = patients.find(
        patient => patient.pid.toLowerCase() === pidFromUrl.toLowerCase()
      );
      
      if (foundPatient) {
        setSelectedPatient(foundPatient);
      } else {
        // If patient not found, redirect to patients page
        setLocation("/patients");
      }
    }
  }, [pidFromUrl, patients, setLocation]);
  
  // Handle edit mode when accessing /patients/:id/edit
  const [showEditPatient, setShowEditPatient] = useState<boolean>(false);
  const [patientToEdit, setPatientToEdit] = useState<number | null>(null);
  
  useEffect(() => {
    if (editPatientId && patients) {
      // Find the patient to edit
      const foundPatient = patients.find(patient => patient.id === editPatientId);
      
      if (foundPatient) {
        setPatientToEdit(editPatientId);
        setShowEditPatient(true);
      } else {
        // If patient not found, redirect to patients page
        setLocation("/patients");
      }
    }
  }, [editPatientId, patients, setLocation]);

  // Filter patients based on search term
  const filteredPatients = Array.isArray(patients)
    ? patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.pid.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.includes(searchTerm)
      )
    : [];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle row click to view patient details
  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setSelectedPatient(null);
    
    // If we came from a PID URL, redirect back to patients main page
    if (pidFromUrl) {
      setLocation("/patients");
    }
  };

  // Table columns
  const columns = [
    {
      header: "Patient ID",
      accessor: "pid" as keyof Patient,
      className: "font-medium"
    },
    {
      header: "Name",
      accessor: (row: Patient) => (
        <div className="flex items-center">
          <AvatarProfile 
            src={row.profileImage === null ? undefined : row.profileImage} 
            name={row.name} 
            size="md"
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Age/Gender",
      accessor: (row: Patient) => (
        <div className="text-sm text-gray-900">
          {row.age} / {row.gender}
        </div>
      ),
    },
    {
      header: "Contact",
      accessor: (row: Patient) => (
        <div>
          <div className="text-sm text-gray-900">{row.phone}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Last Visit",
      accessor: (row: Patient) => (
        <div className="text-sm text-gray-900">
          {row.lastVisitDate ? formatDate(row.lastVisitDate) : "No visits yet"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Patient) => (
        <div className="flex space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/patients/${row.id}/records`);
            }}
          >
            <svg
              className="w-5 h-5 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/appointments/new?patientId=${row.id}`);
            }}
          >
            <svg
              className="w-5 h-5 text-teal-600"
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
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/patients/${row.id}/edit`);
            }}
          >
            <svg
              className="w-5 h-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setPatientToDelete(row);
            }}
          >
            <svg
              className="w-5 h-5 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </Button>
        </div>
      ),
    },
  ];

  // If we're on the patient records route, show the records component
  if (matchesRecordsRoute && recordsPatientId) {
    return (
      <div className="py-6 mt-16 md:mt-6">
        <PatientRecords 
          patientId={recordsPatientId} 
          onClose={() => setLocation("/patients")}
        />
      </div>
    );
  }

  return (
    <div className="py-6 mt-16 md:mt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patient Management</h1>
          <p className="text-gray-600">View and manage patient records</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search patients..."
              className="pl-10 pr-4 py-2"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <Button 
            className="w-full md:w-auto"
            onClick={() => setShowAddPatient(true)}
          >
            <svg
              className="w-5 h-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            New Patient
          </Button>
        </div>
      </div>

      {/* Patient List */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Patient Records</h2>
        </div>
        <CardContent className="p-6">
          <DataTable
            data={filteredPatients}
            columns={columns}
            keyField="id"
            onRowClick={(row, event) => {
              // Only handle row click if the click is on the row itself, not on a button
              // Check if event exists and has target
              if (event && event.target && !(event.target as Element).closest('button')) {
                handlePatientClick(row);
              } else if (!event) {
                // If no event is provided, just handle the click
                handlePatientClick(row);
              }
            }}
            isLoading={isLoading}
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "Try a different search term" : "Get started by adding a new patient"}
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowAddPatient(true)}>
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
                    Add Patient
                  </Button>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Add Patient Dialog */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm onSuccess={() => setShowAddPatient(false)} />
        </DialogContent>
      </Dialog>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedPatient && <PatientDetails patient={selectedPatient} onClose={handleDialogClose} />}
        </DialogContent>
      </Dialog>
      
      {/* Edit Patient Dialog */}
      <Dialog 
        open={showEditPatient} 
        onOpenChange={(open) => {
          setShowEditPatient(open);
          if (!open) {
            setLocation("/patients");
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          {patientToEdit && (
            <PatientForm 
              patientId={patientToEdit} 
              onSuccess={() => {
                setShowEditPatient(false);
                setLocation("/patients");
              }} 
              onCancel={() => {
                setShowEditPatient(false);
                setLocation("/patients");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Patient Confirmation */}
      <AlertDialog 
        open={showDeleteConfirm} 
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) {
            setPatientToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
            <AlertDialogDescription>
              {patientToDelete && (
                <>
                  Are you sure you want to delete <span className="font-medium">{patientToDelete.name}</span>?
                  <div className="mt-2">
                    This will permanently remove all their information including medical history, 
                    appointments, prescriptions, and skin analyses from the system.
                  </div>
                  <div className="mt-2 text-red-500 font-semibold">
                    This action cannot be undone.
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletePatientMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={deletePatientMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePatientMutation.isPending ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </>
              ) : "Delete Patient"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
