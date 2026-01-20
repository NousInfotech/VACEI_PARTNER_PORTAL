import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-dark">Welcome Employee</h1>
        <p className="text-gray-500 text-lg">Have a productive day at work.</p>
        <Button 
          onClick={handleLogout}
          variant="secondary"
          className="mt-4"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
