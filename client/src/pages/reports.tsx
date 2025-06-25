import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { type Patient, type Appointment, type SkinAnalysis } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { AvatarProfile } from "@/components/ui/avatar-profile";
import { CalendarIcon } from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

export default function Reports() {
  const [timeRange, setTimeRange] = useState<string>("month");
  const [reportTab, setReportTab] = useState<string>("overview");

  // Fetch all data needed for reports
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: skinAnalyses, isLoading: isLoadingSkinAnalyses } = useQuery<SkinAnalysis[]>({
    queryKey: ["/api/skin-analyses"],
  });

  // Calculate date range based on selected time range
  const calculateDateRange = (range: string): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "quarter":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "year":
        startDate.setDate(endDate.getDate() - 365);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  };

  const dateRange = calculateDateRange(timeRange);

  // Filter data by date range
  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= dateRange.startDate && appointmentDate <= dateRange.endDate;
      })
    : [];

  const filteredSkinAnalyses = Array.isArray(skinAnalyses)
    ? skinAnalyses.filter((analysis) => {
        const analysisDate = new Date(analysis.date);
        return analysisDate >= dateRange.startDate && analysisDate <= dateRange.endDate;
      })
    : [];

  // Calculate stats
  const totalPatients = Array.isArray(patients) ? patients.length : 0;
  const totalAppointments = filteredAppointments.length;
  const totalAnalyses = filteredSkinAnalyses.length;
  
  const completedAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === "Completed"
  ).length;
  
  const cancelledAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === "Cancelled"
  ).length;

  // Prepare chart data
  const getAppointmentsByDate = () => {
    const appointmentCounts: Record<string, number> = {};
    
    filteredAppointments.forEach((appointment) => {
      const dateStr = formatDate(appointment.date);
      appointmentCounts[dateStr] = (appointmentCounts[dateStr] || 0) + 1;
    });
    
    return Object.keys(appointmentCounts).map((date) => ({
      date,
      count: appointmentCounts[date],
    }));
  };

  const getAnalysesByCondition = () => {
    const conditionCounts: Record<string, number> = {};
    
    filteredSkinAnalyses.forEach((analysis) => {
      if (Array.isArray(analysis.results)) {
        analysis.results.forEach((result) => {
          conditionCounts[result.condition] = (conditionCounts[result.condition] || 0) + 1;
        });
      }
    });
    
    return Object.keys(conditionCounts).map((condition) => ({
      condition,
      count: conditionCounts[condition],
    }));
  };

  // Prepare data for tables
  const recentPatients = Array.isArray(patients) 
    ? [...patients].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 5)
    : [];

  const colors = ['#2563eb', '#7c3aed', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b'];

  // Prepare appointment status chart data
  const appointmentStatusData = [
    { name: "Completed", value: completedAppointments },
    { name: "Cancelled", value: cancelledAppointments },
    { name: "Pending", value: filteredAppointments.filter(a => a.status === "Pending").length },
    { name: "Confirmed", value: filteredAppointments.filter(a => a.status === "Confirmed").length },
  ].filter(item => item.value > 0);

  // Patient table columns
  const patientColumns = [
    {
      header: "Patient",
      accessor: (row: Patient) => (
        <div className="flex items-center">
          <AvatarProfile src={row.profileImage || undefined} name={row.name} size="md" />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">PID: {row.pid}</div>
          </div>
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
      header: "Added On",
      accessor: (row: Patient) => (
        <div className="text-sm text-gray-900">
          {row.createdAt ? formatDate(row.createdAt) : "N/A"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Patient) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = `/patients/${row.id}`}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="py-6 mt-16 md:mt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-600">View insights and statistics</p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="mb-8"
        value={reportTab}
        onValueChange={setReportTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="analyses">Skin Analyses</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 p-3">
                    <svg
                      className="text-xl text-primary-600 w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Total Patients</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingPatients ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        totalPatients
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="rounded-full bg-purple-100 p-3">
                    <svg
                      className="text-xl text-accent-500 w-5 h-5"
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
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Appointments</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingAppointments ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        totalAppointments
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="rounded-full bg-teal-100 p-3">
                    <svg
                      className="text-xl text-teal-600 w-5 h-5"
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
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Skin Analyses</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingSkinAnalyses ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        totalAnalyses
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Appointments Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Appointments Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={getAppointmentsByDate()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Appointments"
                        stroke="#2563eb"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Appointment Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : appointmentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={appointmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No appointment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentPatients}
                columns={patientColumns}
                keyField="id"
                isLoading={isLoadingPatients}
                emptyState={
                  <div className="text-center py-8">
                    <p className="text-gray-500">No patient data available</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPatients ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
              ) : Array.isArray(patients) && patients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Gender Distribution */}
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-3">Gender Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Male', value: patients.filter(p => p.gender === 'Male').length },
                            { name: 'Female', value: patients.filter(p => p.gender === 'Female').length },
                            { name: 'Other', value: patients.filter(p => p.gender !== 'Male' && p.gender !== 'Female').length }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#2563eb" />
                          <Cell fill="#db2777" />
                          <Cell fill="#0ea5e9" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Age Distribution */}
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-3">Age Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { age: "0-18", count: patients.filter(p => p.age >= 0 && p.age <= 18).length },
                          { age: "19-30", count: patients.filter(p => p.age >= 19 && p.age <= 30).length },
                          { age: "31-45", count: patients.filter(p => p.age >= 31 && p.age <= 45).length },
                          { age: "46-60", count: patients.filter(p => p.age >= 46 && p.age <= 60).length },
                          { age: "61+", count: patients.filter(p => p.age >= 61).length }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Patients" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No patient data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Appointments by Day of Week */}
            <Card>
              <CardHeader>
                <CardTitle>Appointments by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredAppointments.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { day: "Sunday", count: filteredAppointments.filter(a => new Date(a.date).getDay() === 0).length },
                        { day: "Monday", count: filteredAppointments.filter(a => new Date(a.date).getDay() === 1).length },
                        { day: "Tuesday", count: filteredAppointments.filter(a => new Date(a.date).getDay() === 2).length },
                        { day: "Wednesday", count: filteredAppointments.filter(a => new Date(a.date).getDay() === 3).length },
                        { day: "Thursday", count: filteredAppointments.filter(a => new Date(a.date).getDay() === 4).length },
                        { day: "Friday", count: filteredAppointments.filter(a => new Date(a.date).getDay() === 5).length },
                        { day: "Saturday", count: filteredAppointments.filter(a => new Date(a.date).getDay() === 6).length }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Appointments" fill="#7c3aed" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No appointment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointment Purpose Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Common Appointment Purposes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredAppointments.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      layout="vertical"
                      data={
                        // Get top 5 purposes
                        Object.entries(
                          filteredAppointments.reduce((acc, appointment) => {
                            acc[appointment.purpose] = (acc[appointment.purpose] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([purpose, count]) => ({ purpose, count }))
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="purpose" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Appointments" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No appointment data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skin Analyses Tab */}
        <TabsContent value="analyses">
          <Card>
            <CardHeader>
              <CardTitle>Skin Condition Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSkinAnalyses ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
              ) : filteredSkinAnalyses.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getAnalysesByCondition()}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="condition" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Occurrences" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No skin analysis data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
