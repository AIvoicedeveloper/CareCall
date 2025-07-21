"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabase } from "../../supabaseClient";

interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
  last_visit: string;
  condition_type: string;
  doctor_id: string;
}

interface Call {
  id: string;
  call_time: string;
  call_status: string;
  transcript: string;
}

export default function PatientProfilePage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [errorSymptoms, setErrorSymptoms] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      setError("");
      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id")
        .eq("id", id)
        .single();
      if (patientError) {
        setError(patientError.message);
        setLoading(false);
        return;
      }
      setPatient(patientData as Patient);
      // Fetch call history
      const { data: callData, error: callError } = await supabase
        .from("calls")
        .select("id, call_time, call_status, transcript")
        .eq("patient_id", id)
        .order("call_time", { ascending: false });
      if (callError) {
        setError(callError.message);
        setLoading(false);
        return;
      }
      setCalls(callData as Call[]);
      setLoading(false);
    };
    const fetchSymptoms = async () => {
      setLoadingSymptoms(true);
      setErrorSymptoms("");
      // Fetch symptom_reports for this patient, joining calls for call_time
      const { data, error } = await supabase
        .from("symptom_reports")
        .select("id, symptoms, created_at, call_id, calls(call_time)")
        .eq("patient_id", id)
        .order("created_at", { ascending: false });
      if (error) {
        setErrorSymptoms(error.message);
        setSymptoms([]);
      } else {
        setSymptoms(data as any[]);
      }
      setLoadingSymptoms(false);
    };
    if (id) {
      fetchPatient();
      fetchSymptoms();
    }
  }, [id]);

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-2xl font-bold mb-4">Patient Profile</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : !patient ? (
          <div>Patient not found.</div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-white rounded shadow">
              <h2 className="text-xl font-semibold mb-2">{patient.full_name}</h2>
              <div><b>Phone:</b> {patient.phone_number}</div>
              <div><b>Last Visit:</b> {patient.last_visit}</div>
              <div><b>Condition:</b> {patient.condition_type}</div>
              <div><b>Doctor ID:</b> {patient.doctor_id}</div>
            </div>
            <div className="mb-6 p-4 bg-white rounded shadow">
              <h2 className="text-xl font-semibold mb-2">Call History</h2>
              {calls.length === 0 ? (
                <div>No calls found for this patient.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Call Time</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => (
                      <tr key={call.id} className="border-t">
                        <td className="p-2">{new Date(call.call_time).toLocaleString()}</td>
                        <td className="p-2">{call.call_status}</td>
                        <td className="p-2">{call.transcript}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mb-6 p-4 bg-white rounded shadow">
              <h2 className="text-xl font-semibold mb-2">Symptom History</h2>
              {loadingSymptoms ? (
                <div>Loading...</div>
              ) : errorSymptoms ? (
                <div className="text-red-600">{errorSymptoms}</div>
              ) : symptoms.length === 0 ? (
                <div>No symptom reports found for this patient.</div>
              ) : (
                <ul className="space-y-4">
                  {symptoms.map((s) => (
                    <li key={s.id} className="border-l-4 border-blue-400 pl-4">
                      <div className="text-sm text-gray-500 mb-1">
                        {s.calls?.call_time ? new Date(s.calls.call_time).toLocaleString() : new Date(s.created_at).toLocaleString()}
                      </div>
                      <div className="font-semibold">Symptoms: {typeof s.symptoms === "object" ? Object.entries(s.symptoms).map(([k, v]) => v ? k : null).filter(Boolean).join(", ") : String(s.symptoms)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
} 