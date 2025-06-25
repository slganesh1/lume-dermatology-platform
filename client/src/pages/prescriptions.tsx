import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Prescription, Patient } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { Plus, FileText, Calendar, Pill, SearchIcon, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "date-fns";
import PageHeader from "@/components/ui/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Prescriptions() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<number | null>(null);

  // Get the current user
  const { user } = useAuth();
  
  // Determine if the user is a doctor (role-based fetching)
  const isDoctor = user?.role === "doctor";
  
  // Fetch patient data for the current user if they're a patient
  const { data: patientData, isLoading: isLoadingPatientData } = useQuery({
    queryKey: ['/api/patients/user', user?.id],
    queryFn: async () => {
      if (!user || isDoctor) return null;
      const res = await fetch(`/api/patients/user/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch patient data');
      return res.json();
    },
    enabled: !!(user && !isDoctor), // Only run for non-doctor authenticated users
    staleTime: 10000,
  });
  
  // Fetch prescriptions based on role
  const { data: prescriptions = [], isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: isDoctor 
      ? ['/api/prescriptions'] 
      : ['/api/prescriptions/patient', patientData?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let url = '/api/prescriptions';
      if (!isDoctor && patientData?.id) {
        url = `/api/prescriptions/patient/${patientData.id}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      return res.json();
    },
    staleTime: 10000,
    enabled: !!user && (isDoctor || !!patientData?.id), // Only run when we know the user role and patient ID
  });

  // Fetch patients for name mapping
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    staleTime: 10000,
  });

  // Filter prescriptions based on search term
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const patient = patients.find(p => p.id === prescription.patientId);
    const patientName = patient?.name.toLowerCase() || "";
    const patientId = patient?.pid.toLowerCase() || "";
    
    return (
      patientName.includes(searchTerm.toLowerCase()) ||
      patientId.includes(searchTerm.toLowerCase()) ||
      prescription.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get patient name from ID
  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : "Unknown Patient";
  };

  // Get patient PID from ID
  const getPatientPid = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.pid : "Unknown ID";
  };

  // Table columns
  const prescriptionColumns = [
    {
      header: "Patient",
      accessorFn: (row: Prescription) => getPatientName(row.patientId),
      cell: ({ row }: { row: { original: Prescription } }) => (
        <div>
          <div className="font-medium">{getPatientName(row.original.patientId)}</div>
          <div className="text-xs text-gray-500">{getPatientPid(row.original.patientId)}</div>
        </div>
      ),
    },
    {
      header: "Created Date",
      accessorFn: (row: Prescription) => row.createdAt ? formatRelative(new Date(row.createdAt), new Date()) : 'Unknown',
      cell: ({ row }: { row: { original: Prescription } }) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          {row.original.createdAt ? formatRelative(new Date(row.original.createdAt), new Date()) : 'Unknown'}
        </div>
      ),
    },
    {
      header: "Medications",
      accessorFn: (row: Prescription) => {
        const items = row.items as any[];
        return items?.length || 0;
      },
      cell: ({ row }: { row: { original: Prescription } }) => {
        const items = row.original.items as any[];
        const count = items?.length || 0;
        
        return (
          <div className="flex items-center">
            <Pill className="h-4 w-4 mr-2 text-blue-500" />
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {count} medication{count !== 1 ? 's' : ''}
            </Badge>
          </div>
        );
      },
    },
    {
      header: "Notes",
      accessorKey: "remarks",
      cell: ({ row }: { row: { original: Prescription } }) => (
        <div className="max-w-xs truncate">{row.original.remarks || "No notes"}</div>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }: { row: { original: Prescription } }) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/prescriptions/${row.original.id}`);
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setPrescriptionToDelete(row.original.id);
              setShowDeleteDialog(true);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDeletePrescription = async () => {
    if (!prescriptionToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/prescriptions/${prescriptionToDelete}`);
      
      // Invalidate prescriptions cache to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      
      // Also invalidate patient-specific prescriptions if user is a patient
      if (!isDoctor && patientData?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/prescriptions/patient/${patientData.id}`] });
      }
      
      toast({
        title: "Prescription deleted",
        description: "The prescription has been successfully deleted.",
      });
      
      setShowDeleteDialog(false);
      setPrescriptionToDelete(null);
    } catch (error) {
      console.error("Error deleting prescription:", error);
      toast({
        title: "Error",
        description: "Failed to delete prescription. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Prescriptions"
        description="Manage patient prescriptions and medication orders"
        actionButton={
          <Button onClick={() => setLocation("/prescriptions/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Prescription
          </Button>
        }
      />

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Prescriptions</CardTitle>
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search prescriptions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            View and manage all patient prescriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPrescriptions}
            columns={prescriptionColumns}
            keyField="id"
            onRowClick={(row) => setLocation(`/prescriptions/${row.id}`)}
            isLoading={isLoadingPrescriptions || isLoadingPatients}
            emptyState={
              <div className="text-center py-10">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No prescriptions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new prescription for a patient.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setLocation("/prescriptions/new")}>
                    <Plus className="mr-2 h-4 w-4" /> New Prescription
                  </Button>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prescription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePrescription}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}