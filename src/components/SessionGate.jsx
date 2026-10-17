import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext.jsx";
import { isPublicPolicyPath } from "../data/policyRoutes.js";

export default function SessionGate({ children }) {
  const { loading } = useContext(AuthContext);
  const { pathname } = useLocation();
  // Public policies stay readable even when the session service is offline.
  if (loading && !isPublicPolicyPath(pathname)) return <div>Loading...</div>;
  return children;
}
