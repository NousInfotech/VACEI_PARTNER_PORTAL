import EmployeeManagement from "./employee-management/EmployeeManagement";
import Messages from "../messages/Messages";

interface AdminDashboardProps {
  activeSection?: string;
}

export default function AdminDashboard({ activeSection }: AdminDashboardProps) {

  if (activeSection === "Employees") {
    return <EmployeeManagement />;
  }

  if (activeSection === "Messages") {
    return <Messages />;
  }

  // Default Admin Dashboard (or redirect to Employees if it's the main view)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary">Welcome Admin</h1>
        <p className="text-gray-500 text-xl">Manage your organization efficiently.</p>
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          Select "Employees" from the sidebar to manage your team.
        </div>
      </div>
    </div>
  );
}
