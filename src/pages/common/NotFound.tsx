import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "../../ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <div className="p-12 max-w-md w-full flex flex-col items-center">
        <div className="w-24 h-24rounded-3xl flex items-center justify-center mb-8 animate-pulse">
          <FileQuestion className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Link to="/dashboard">
            <Button className="w-full py-6 text-base font-semibold">
              Back to Dashboard
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="w-full py-3 text-sm text-gray-500">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
