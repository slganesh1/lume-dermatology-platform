import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Patient, Medication } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface PatientDetailProps {
  patientId: number;
  onClose: () => void;
}

export function PatientDetail({ patientId, onClose }: PatientDetailProps) {
  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
  });
  
  const { data: medications, isLoading: isLoadingMedications } = useQuery<Medication[]>({
    queryKey: [`/api/medications/patient/${patientId}`],
  });
  
  if (isLoadingPatient) {
    return (
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="text-center py-4">Loading patient details...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (!patient) {
    return (
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="text-center py-4 text-red-500">Patient not found</div>
          <div className="flex justify-center">
            <Button onClick={onClose}>Back to List</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{patient.firstName} {patient.lastName}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">PID: {patient.pid}</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Back to List
            </Button>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.firstName} {patient.lastName}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Age / Gender</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.age} / {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contact</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.contact}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last visit date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.lastVisitDate ? formatDate(new Date(patient.lastVisitDate)) : 'No previous visits'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Next visit date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.nextVisitDate ? formatDate(new Date(patient.nextVisitDate)) : 'No scheduled visits'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Allergic to medicine</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.allergies || 'None reported'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Issue summary</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.issueSummary || 'No issues recorded'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Medication details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isLoadingMedications ? (
                  <div>Loading medications...</div>
                ) : medications && medications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                          <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {medications.map((medication, index) => (
                          <tr key={medication.id}>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{medication.name}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{medication.dosage}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{medication.schedule}</td>
                            <td className="px-2 py-2 text-sm text-gray-500">{medication.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div>No medications prescribed</div>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
