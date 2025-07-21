"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "../supabaseClient";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Call {
  id: string;
  patient_id: string;
  call_time: string;
  call_status: string;
  transcript: string;
  patients?: { full_name: string };
}

interface Patient {
  id: string;
  full_name: string;
  last_visit: string;
  condition_type: string;
}

export default function DashboardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upcoming, setUpcoming] = useState<Patient[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [errorUpcoming, setErrorUpcoming] = useState("");
  const [stats, setStats] = useState<{ numCalls: number; numEscalated: number; avgRisk: string } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState("");
  const [volumeData, setVolumeData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [loadingVolume, setLoadingVolume] = useState(true);
  const [errorVolume, setErrorVolume] = useState("");

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      setError("");
      // Fetch the 10 most recent calls, joining patient name correctly
      const { data, error } = await supabase
        .from("calls")
        .select("id, patient_id, call_time, call_status, transcript, patients(full_name)")
        .order("call_time", { ascending: false })
        .limit(10);
      if (error) {
        setError(error.message);
        setCalls([]);
      } else {
        setCalls(
          (data as any[]).map((call) => ({
            ...call,
            patients: Array.isArray(call.patients) ? call.patients[0] : call.patients,
          }))
        );
      }
      setLoading(false);
    };
    fetchCalls();

    // Fetch patients with no call in the last 7 days
    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      setErrorUpcoming("");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // Get all patients
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, last_visit, condition_type");
      if (patientsError) {
        setErrorUpcoming(patientsError.message);
        setUpcoming([]);
        setLoadingUpcoming(false);
        return;
      }
      // Get all calls in last 7 days
      const { data: recentCalls, error: callsError } = await supabase
        .from("calls")
        .select("patient_id, call_time")
        .gte("call_time", sevenDaysAgo.toISOString());
      if (callsError) {
        setErrorUpcoming(callsError.message);
        setUpcoming([]);
        setLoadingUpcoming(false);
        return;
      }
      const recentPatientIds = new Set((recentCalls as any[]).map((c) => c.patient_id));
      // Patients with no recent call
      setUpcoming((patients as Patient[]).filter((p) => !recentPatientIds.has(p.id)));
      setLoadingUpcoming(false);
    };
    fetchUpcoming();

    // Fetch statistics summary
    const fetchStats = async () => {
      setLoadingStats(true);
      setErrorStats("");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // Number of calls in last 7 days
      const { count: numCalls, error: callsError } = await supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .gte("call_time", sevenDaysAgo.toISOString());
      if (callsError) {
        setErrorStats(callsError.message);
        setStats(null);
        setLoadingStats(false);
        return;
      }
      // Number escalated and average risk level from symptom_reports
      const { data: reports, error: reportsError } = await supabase
        .from("symptom_reports")
        .select("risk_level, escalate")
        .gte("created_at", sevenDaysAgo.toISOString());
      if (reportsError) {
        setErrorStats(reportsError.message);
        setStats(null);
        setLoadingStats(false);
        return;
      }
      const numEscalated = (reports as any[]).filter((r) => r.escalate).length;
      // Calculate average risk level (high=3, medium=2, low=1)
      const riskMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
      const riskVals = (reports as any[]).map((r) => riskMap[r.risk_level] || 0).filter((v) => v > 0);
      const avgRiskNum = riskVals.length ? riskVals.reduce((a, b) => a + b, 0) / riskVals.length : 0;
      const avgRisk = avgRiskNum >= 2.5 ? "high" : avgRiskNum >= 1.5 ? "medium" : avgRiskNum > 0 ? "low" : "N/A";
      setStats({ numCalls: numCalls || 0, numEscalated, avgRisk });
      setLoadingStats(false);
    };
    fetchStats();

    // Fetch call volume for last 7 days
    const fetchVolume = async () => {
      setLoadingVolume(true);
      setErrorVolume("");
      const today = new Date();
      const days: string[] = [];
      const counts: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
        counts.push(0);
      }
      const { data: calls, error } = await supabase
        .from("calls")
        .select("call_time")
        .gte("call_time", days[0] + "T00:00:00.000Z");
      if (error) {
        setErrorVolume(error.message);
        setVolumeData(null);
        setLoadingVolume(false);
        return;
      }
      (calls as any[]).forEach((call) => {
        const date = call.call_time.slice(0, 10);
        const idx = days.indexOf(date);
        if (idx !== -1) counts[idx]++;
      });
      setVolumeData({ labels: days, data: counts });
      setLoadingVolume(false);
    };
    fetchVolume();
  }, []);

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Recent Calls</h2>
          <div className="bg-white rounded shadow p-4">
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : calls.length === 0 ? (
              <div>No recent calls found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Patient</th>
                    <th className="text-left p-2">Call Time</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Transcript</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id} className="border-t">
                      <td className="p-2">{call.patients?.full_name || ""}</td>
                      <td className="p-2">{new Date(call.call_time).toLocaleString()}</td>
                      <td className="p-2">{call.call_status}</td>
                      <td className="p-2">{call.transcript}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Upcoming Follow-ups</h2>
          <div className="bg-white rounded shadow p-4">
            {loadingUpcoming ? (
              <div>Loading...</div>
            ) : errorUpcoming ? (
              <div className="text-red-600">{errorUpcoming}</div>
            ) : upcoming.length === 0 ? (
              <div>No upcoming follow-ups.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Patient</th>
                    <th className="text-left p-2">Last Visit</th>
                    <th className="text-left p-2">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.full_name}</td>
                      <td className="p-2">{p.last_visit}</td>
                      <td className="p-2">{p.condition_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Statistics Summary</h2>
          <div className="bg-white rounded shadow p-4">
            {loadingStats ? (
              <div>Loading...</div>
            ) : errorStats ? (
              <div className="text-red-600">{errorStats}</div>
            ) : !stats ? (
              <div>No statistics available.</div>
            ) : (
              <ul className="list-disc pl-6">
                <li>Number of calls (last 7 days): <b>{stats.numCalls}</b></li>
                <li>Number escalated (last 7 days): <b>{stats.numEscalated}</b></li>
                <li>Average risk level (last 7 days): <b>{stats.avgRisk}</b></li>
              </ul>
            )}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Call Volume Chart (Optional)</h2>
          <div className="bg-white rounded shadow p-4">
            {loadingVolume ? (
              <div>Loading...</div>
            ) : errorVolume ? (
              <div className="text-red-600">{errorVolume}</div>
            ) : !volumeData ? (
              <div>No chart data available.</div>
            ) : (
              <Bar
                data={{
                  labels: volumeData.labels,
                  datasets: [
                    {
                      label: "Calls per Day",
                      data: volumeData.data,
                      backgroundColor: "#2563eb",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: true, text: "Calls per Day (Last 7 Days)" },
                  },
                }}
              />
            )}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
} 