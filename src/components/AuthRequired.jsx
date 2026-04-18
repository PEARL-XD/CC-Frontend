import { useNavigate, useLocation } from "react-router-dom";

export default function AuthRequired() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">

      {/* 🐔 Illustration (replace later if you want custom SVG) */}
      <div className="text-6xl mb-4">🐔</div>

      <h2 className="text-2xl font-bold mb-2">
        Oops! This chicken needs you to log in 🪶
      </h2>

      <p className="text-gray-600 mb-6 max-w-md">
        Looks like you're not signed in yet. Log in to access this page and continue your order.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 border rounded-lg"
        >
          Back to Home
        </button>

        <button
          onClick={() =>
            navigate("/login", {
              state: { from: location.pathname },
            })
          }
          className="px-6 py-2 bg-orange-500 text-white rounded-lg"
        >
          Login
        </button>
      </div>
    </div>
  );
}