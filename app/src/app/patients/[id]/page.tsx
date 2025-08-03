"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../authProvider";
import { useVisibilityFocus } from "../../../lib/useVisibilityFocus";

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
}

export default function PatientProfilePage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSymptoms, setLoadingSymptoms] = useState(false);
  const [error, setError] = useState("");
  const [errorSymptoms, setErrorSymptoms] = useState("");

  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const lastFetchTime = useRef<number>(0);

  // Reset states when user changes
  const resetStates = useCallback(() => {
    setPatient(null);
    setCalls([]);
    setSymptoms([]);
    setLoading(false);
    setLoadingSymptoms(false);
    setError("");
    setErrorSymptoms("");
  }, []);

  // Fetch patient data with abort signal support
  const fetchPatient = useCallback(async () => {
    if (!id || !supabase) return;
    
    setLoading(true);
    setError("");
    try {
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
        .select("id, call_time, call_status")
        .eq("patient_id", id)
        .order("call_time", { ascending: false });
      
      if (callError) {
        setError(callError.message);
        setLoading(false);
        return;
      }
      
      setCalls(callData as Call[]);
      lastFetchTime.current = Date.now();
    } catch (err: any) {
      setError("Failed to fetch patient data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch symptoms with abort signal support
  const fetchSymptoms = useCallback(async () => {
    if (!id || !supabase) return;
    
    setLoadingSymptoms(true);
    setErrorSymptoms("");
    try {
      // Fetch symptom_reports for this patient using the RPC
      const { data, error } = await supabase
        .rpc('get_symptom_reports_for_patient', { pid: id });
      
      if (error) {
        setErrorSymptoms(error.message);
        setSymptoms([]);
      } else {
        setSymptoms(data as any[]);
      }
    } catch (err: any) {
      setErrorSymptoms("Failed to fetch symptoms");
      setSymptoms([]);
    } finally {
      setLoadingSymptoms(false);
    }
  }, [id]);

  // Function to fetch all data with abort signal
  const fetchAllData = useCallback(() => {
    if (!user || !id) return;
    
    console.log('Fetching patient profile data...');
    fetchPatient();
    fetchSymptoms();
  }, [user, id, fetchPatient, fetchSymptoms]);

  // Handle visibility/focus events for refetching
  const handleRefetchOnVisibility = useCallback(() => {
    if (!user || !id) return;
    
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    // Only refetch if it's been more than 30 seconds since last fetch
    if (timeSinceLastFetch > 30000) {
      console.log('Tab regained focus/visibility, refetching patient profile data...');
      fetchAllData();
    }
  }, [user, id, fetchAllData]);

  // Use the visibility/focus hook
  useVisibilityFocus({
    onVisibilityChange: handleRefetchOnVisibility,
    onFocus: handleRefetchOnVisibility,
    debounceMs: 300,
    enabled: !!user && !!id
  });

  useEffect(() => {
    if (!user) {
      resetStates();
      return;
    }
    
    if (id) {
      fetchAllData();
    }
    
    return () => {
      // Cleanup on unmount
    };
  }, [user?.id, id, fetchAllData, resetStates]); // Only depend on user ID and patient ID

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
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => (
                      <tr key={call.id} className="border-t">
                        <td className="p-2">{new Date(call.call_time).toLocaleString()}</td>
                        <td className="p-2">{call.call_status}</td>
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
                      <div className="font-semibold">
                        Symptoms: {
                          s.symptoms
                            ? (typeof s.symptoms === "object"
                                ? Object.entries(s.symptoms).map(([k, v]) => v ? k : null).filter(Boolean).join(", ")
                                : String(s.symptoms))
                            : (patient?.condition_type || "N/A")
                        }
                      </div>
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