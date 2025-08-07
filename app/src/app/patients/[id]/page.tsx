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
  doctor_name?: string;
}

interface Call {
  id: string;
  call_time: string;
  call_status: string;
}

export default function PatientProfilePage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const lastFetchTime = useRef<number>(0);

  // Reset states when user changes
  const resetStates = useCallback(() => {
    setPatient(null);
    setCalls([]);
    setLoading(false);
    setError("");
  }, []);

  // Fetch patient data with abort signal support
  const fetchPatient = useCallback(async () => {
    if (!id || !supabase) return;
    
    setLoading(true);
    setError("");
    try {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select(`
          id, 
          full_name, 
          phone_number, 
          last_visit, 
          condition_type, 
          doctor_id,
          users!patients_doctor_id_fkey(name)
        `)
        .eq("id", id)
        .single();
      
      if (patientError) {
        setError(patientError.message);
        setLoading(false);
        return;
      }
      
      // Transform the data to include doctor name
      const patientWithDoctorName = {
        ...patientData,
        doctor_name: patientData.users?.name || 'Unassigned'
      };
      setPatient(patientWithDoctorName as Patient);
      
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

  // Function to fetch all data with abort signal
  const fetchAllData = useCallback(() => {
    if (!user || !id) return;
    
    fetchPatient();
  }, [user, id, fetchPatient]);

  // Handle visibility/focus events for refetching
  const handleRefetchOnVisibility = useCallback(() => {
    if (!user || !id) return;
    
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    // Only refetch if it's been more than 30 seconds since last fetch
    if (timeSinceLastFetch > 30000) {
      fetchAllData();
    }
  }, [user, id, fetchAllData]);

  // Use the visibility/focus hook
  useVisibilityFocus({
    onVisibilityChange: handleRefetchOnVisibility,
    onFocusChange: handleRefetchOnVisibility
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
              <div><b>Condition:</b> 
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {patient.condition_type}
                </span>
              </div>
              <div><b>Doctor:</b> 
                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  {patient.doctor_name}
                </span>
              </div>
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
                    {calls.map((call) => {
                      // Only show call time if it's a valid date (not null/empty)
                      const callTime = call.call_time ? new Date(call.call_time) : null;
                      const isValidCallTime = callTime && callTime.getTime() > 0 && callTime.getFullYear() > 1970;
                      
                      // Calculate scheduled call time: one day after last visit at 8:00 AM
                      const lastVisitDate = patient.last_visit ? new Date(patient.last_visit) : null;
                      let scheduledCallTime = null;
                      
                      if (lastVisitDate && !isValidCallTime) {
                        // Add one day to the last visit date and set time to 8:00 AM
                        scheduledCallTime = new Date(lastVisitDate);
                        scheduledCallTime.setDate(scheduledCallTime.getDate() + 1);
                        scheduledCallTime.setHours(8, 0, 0, 0);
                      }
                      
                      return (
                        <tr key={call.id} className="border-t">
                          <td className="p-2">
                            {isValidCallTime 
                              ? callTime.toLocaleString() 
                              : scheduledCallTime 
                                ? `Scheduled: ${scheduledCallTime.toLocaleDateString()} ${scheduledCallTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                : 'Not scheduled'
                            }
                          </td>
                          <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            call.call_status === 'success' ? 'bg-green-100 text-green-800' :
                            call.call_status === 'failed' ? 'bg-red-100 text-red-800' :
                            call.call_status === 'to be called' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {call.call_status}
                          </span>
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
} 