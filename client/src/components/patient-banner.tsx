import { AvatarProfile } from "@/components/ui/avatar-profile";
import { Patient } from "@shared/schema";
import { FileText, Calendar, Mail, Phone } from "lucide-react";

interface PatientBannerProps {
  patient: Patient;
}

export function PatientBanner({ patient }: PatientBannerProps) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarProfile
            src={patient.profileImage || ""}
            name={patient.name}
            size="lg"
          />
          <div>
            <h2 className="text-xl font-semibold">{patient.name}</h2>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <FileText className="h-4 w-4 mr-1" />
              <span>Patient ID: {patient.pid}</span>
              <span className="mx-2">•</span>
              <span>Age: {patient.age}</span>
              <span className="mx-2">•</span>
              <span>{patient.gender}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-sm">
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-500 mr-2" />
            <span>{patient.email}</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-gray-500 mr-2" />
            <span>{patient.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}