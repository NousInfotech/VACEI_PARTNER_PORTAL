import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { useAuth } from "../../context/auth-context-core";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary">Welcome Admin</h1>
        <p className="text-gray-500 text-xl">Manage your organization efficiently.</p>
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="mt-4"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
