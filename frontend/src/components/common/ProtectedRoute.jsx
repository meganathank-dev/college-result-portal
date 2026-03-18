import { Navigate } from "react-router-dom";
import { getStoredToken } from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}