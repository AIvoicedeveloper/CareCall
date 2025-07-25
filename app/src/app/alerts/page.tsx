"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "../supabaseClient";
import { useAuth } from "../authProvider";

interface EscalatedReport {
  id: string;
  call_id: string;
  risk_level: string;
  escalate: boolean;
  notes: string;
  patients?: { full_name: string };
}

export default function AlertsPage() {
  const [reports, setReports] = useState<EscalatedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }
    const fetchEscalated = async () => {
      setLoading(true);
      setError("");
      // Join calls to get patient name
      const { data, error } = await supabase
        .from("symptom_reports")
        .select("id, call_id, risk_level, escalate, notes, calls(patients(full_name))")
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
          }))
        );
      }
      setLoading(false);
    };
    fetchEscalated();
  }, [user]);

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
                <th className="text-left p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.patients?.full_name || "Unknown"}</td>
                  <td className="p-2">{r.risk_level}</td>
                  <td className="p-2">{r.escalate ? "Yes" : "No"}</td>
                  <td className="p-2">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedRoute>
  );
} 