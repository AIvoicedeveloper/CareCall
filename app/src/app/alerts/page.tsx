"use client";
import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "../supabaseClient";
import { useAuth } from "../authProvider";

interface EscalatedReport {
  id: string;
  call_id: string;
  risk_level: string;
  escalate: boolean;
  patients?: { full_name: string };
  patient_id?: string;
}

export default function AlertsPage() {
  const [reports, setReports] = useState<EscalatedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // Reset states when user changes
  const resetStates = useCallback(() => {
    setReports([]);
    setLoading(false);
    setError("");
  }, []);

  // Fetch escalated reports
  const fetchEscalated = useCallback(async () => {
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      // Join calls to get patient name
      const { data, error } = await supabase
        .from("symptom_reports")
        .select("id, call_id, risk_level, escalate, calls(patient_id, patients(full_name))")
        .eq("escalate", true)
        .order("id", { ascending: false });
      
      if (error) {
        setError(error.message);
        setReports([]);
      } else {
        // Flatten patient name
        setReports(
          (data as any[]).map((r) => ({
            ...r,
            patients: r.calls?.patients || undefined,
            patient_id: r.calls?.patient_id || undefined,
          }))
        );
      }
    } catch (err) {
      setError("Failed to fetch escalated reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      resetStates();
      return;
    }
    
    // Only fetch if we don't have data yet
    if (reports.length === 0) {
      fetchEscalated();
    }
  }, [user?.id]); // Only depend on user ID

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-2xl font-bold mb-4">Alerts</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : reports.length === 0 ? (
          <div>No escalated cases found.</div>
        ) : (
          <table className="min-w-full text-sm bg-white rounded shadow">
            <thead>
              <tr>
                <th className="text-left p-2">Patient</th>
                <th className="text-left p-2">Risk Level</th>
                <th className="text-left p-2">Escalated</th>
                <th className="text-left p-2">Profile</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.patients?.full_name || "Unknown"}</td>
                  <td className="p-2">{r.risk_level}</td>
                  <td className="p-2">{r.escalate ? "Yes" : "No"}</td>
                  <td className="p-2">{r.patient_id ? <a href={`/patients/${r.patient_id}`} className="text-blue-600 hover:underline">View Profile</a> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedRoute>
  );
} 