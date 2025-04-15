
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ArrowUpRight, Users, Loader2, XCircle, Banknote, CircleDollarSign, BadgeDollarSign } from "lucide-react";

// Mock data for analytics
const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 67000 },
];

const jobStatusData = [
  { name: "Lead", value: 5, color: "#9333ea" },  // Purple
  { name: "Contacted", value: 8, color: "#3b82f6" }, // Blue
  { name: "Confirmed", value: 12, color: "#06b6d4" }, // Cyan
  { name: "In Production", value: 15, color: "#facc15" }, // Yellow
  { name: "Completed", value: 30, color: "#22c55e" }, // Green
  { name: "Cancelled", value: 5, color: "#ef4444" },  // Red
];

const materialUsageData = [
  { name: "Steel Sheet", value: 45, color: "#475569" },
  { name: "Aluminum", value: 30, color: "#64748b" },
  { name: "Copper", value: 15, color: "#94a3b8" },
  { name: "Other", value: 10, color: "#cbd5e1" },
];

const staffUtilizationData = [
  { name: "Rahul", tasks: 24 },
  { name: "Priya", tasks: 18 },
  { name: "Ankit", tasks: 29 },
  { name: "Meera", tasks: 15 },
];

const AnalyticsPage = () => {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculated summary metrics
  const totalCustomers = 42;
  const pendingWork = 35;
  const cancelledOrders = 5;
  const totalRevenue = 425000;
  const receivedRevenue = 350000;
  const pendingRevenue = 75000;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor your business performance.</p>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label htmlFor="startDate" className="mb-2 block">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="mb-2 block">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button className="bg-industrial-blue hover:bg-industrial-lightblue">Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Total Customers"
          value={totalCustomers}
          icon={<Users className="h-5 w-5" />}
          trend="+12% from last month"
          trendUp={true}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Work Pending"
          value={pendingWork}
          icon={<Loader2 className="h-5 w-5" />}
          trend="+5% from last month"
          trendUp={true}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <SummaryCard
          title="Cancelled Orders"
          value={cancelledOrders}
          icon={<XCircle className="h-5 w-5" />}
          trend="-2% from last month"
          trendUp={false}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <SummaryCard
          title="Total Revenue"
          value={`₹ ${totalRevenue.toLocaleString()}`}
          icon={<Banknote className="h-5 w-5" />}
          trend="+18% from last month"
          trendUp={true}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <SummaryCard
          title="Received Revenue"
          value={`₹ ${receivedRevenue.toLocaleString()}`}
          icon={<CircleDollarSign className="h-5 w-5" />}
          trend="+15% from last month"
          trendUp={true}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <SummaryCard
          title="Pending Revenue"
          value={`₹ ${pendingRevenue.toLocaleString()}`}
          icon={<BadgeDollarSign className="h-5 w-5" />}
          trend="+8% from last month"
          trendUp={true}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="job-status">Job Status</TabsTrigger>
          <TabsTrigger value="materials">Material Usage</TabsTrigger>
          <TabsTrigger value="staff">Staff Utilization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue for the selected period</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹ ${value}`, "Revenue"]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#195B8C" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job-status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
              <CardDescription>Current distribution of job statuses</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jobStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {jobStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Usage</CardTitle>
              <CardDescription>Distribution of materials used in production</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {materialUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Utilization</CardTitle>
              <CardDescription>Number of tasks completed by each staff member</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={staffUtilizationData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="#3D87C4" name="Completed Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component for summary cards
const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  iconBg, 
  iconColor 
}: { 
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  iconBg: string;
  iconColor: string;
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-md ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className={trendUp ? "text-green-600" : "text-red-600"}>
            {trend}
          </span>
          <ArrowUpRight className={`ml-1 h-4 w-4 ${trendUp ? "text-green-600" : "text-red-600 rotate-180"}`} />
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsPage;
