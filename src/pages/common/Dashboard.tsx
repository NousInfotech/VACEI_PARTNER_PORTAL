import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../org-admin/AdminDashboard";
import EmployeeDashboard from "../org-employee/EmployeeDashboard";

export const RoleEnum = {
  ORG_ADMIN: 'ORG_ADMIN',
  ORG_EMPLOYEE: 'ORG_EMPLOYEE',
} as const;

export type RoleEnum = typeof RoleEnum[keyof typeof RoleEnum];
interface DashboardProps {
  activeSection?: string;
}

export default function Dashboard({ activeSection = "Dashboard" }: DashboardProps) {
  const navigate = useNavigate();
  const [role] = useState<string | null>(() => localStorage.getItem("userRole"));

  useEffect(() => {
    if (!role) {
      navigate("/login");
    }
  }, [role, navigate]);

  if (!role) return null;

  if (role === RoleEnum.ORG_ADMIN) {
    return <AdminDashboard />;
  }

  if (role === RoleEnum.ORG_EMPLOYEE) {
    return <EmployeeDashboard activeSection={activeSection} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Unknown Role. Please contact support.</p>
    </div>
  );
}
