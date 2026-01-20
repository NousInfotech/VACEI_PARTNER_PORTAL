import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleEnum } from "../../data/mockUserData";
import AdminDashboard from "../org-admin/AdminDashboard";
import EmployeeDashboard from "../org-employee/EmployeeDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (!userRole) {
      navigate("/login");
    } else {
      setRole(userRole);
    }
  }, [navigate]);

  if (!role) return null;

  if (role === RoleEnum.ORG_ADMIN) {
    return <AdminDashboard />;
  }

  if (role === RoleEnum.ORG_EMPLOYEE) {
    return <EmployeeDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Unknown Role. Please contact support.</p>
    </div>
  );
}
