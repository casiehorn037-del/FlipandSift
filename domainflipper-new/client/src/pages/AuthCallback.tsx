import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your login...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      setStatus("error");
      setMessage("Login failed. Please try again.");
      toast.error("Authentication failed");
      setTimeout(() => setLocation("/login"), 3000);
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("No authentication token found.");
      toast.error("Invalid login link");
      setTimeout(() => setLocation("/login"), 3000);
      return;
    }

    // Store token
    localStorage.setItem("token", token);
    
    // Fetch user info
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("user", JSON.stringify(data.user));
        setStatus("success");
        setMessage("Login successful! Redirecting...");
        toast.success("Welcome back!");
        setTimeout(() => setLocation("/dashboard"), 1500);
      })
      .catch((err) => {
        console.error("Auth error:", err);
        localStorage.removeItem("token");
        setStatus("error");
        setMessage("Session expired. Please log in again.");
        toast.error("Session expired");
        setTimeout(() => setLocation("/login"), 3000);
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900">{message}</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900">{message}</h2>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900">{message}</h2>
            <p className="text-gray-600 mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
