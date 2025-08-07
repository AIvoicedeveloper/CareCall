"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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
import { useAuth } from "../authProvider";
import { useVisibilityFocus } from "../../lib/useVisibilityFocus";
import { useLoadingTimeout } from "../../lib/useLoadingTimeout";
import { useTabSwitchRecovery } from "../../lib/useTabSwitchRecovery";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

interface Call {
  id: string;
  patient_id: string;
  call_time: string;
  call_status: string;
  patients?: { full_name: string };
}

interface Patient {
  id: string;
  full_name: string;
  last_visit: string;
  condition_type: string;
  call_status?: string; // Added for upcoming follow-ups logic
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

  const { user } = useAuth();
  const isInitialized = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);
  const fetchAllDataRef = useRef<(() => void) | null>(null);
  const stopLoadingTimeoutRef = useRef<(() => void) | null>(null);

  // Force reset all loading states (for timeout handling)
  const forceResetLoadingStates = useCallback(() => {
    setLoading(false);
    setLoadingUpcoming(false);
    setLoadingStats(false);
    setLoadingVolume(false);
  }, []);

  // Use loading timeout monitoring - MOVED TO TOP to avoid temporal dead zone
  const { startLoadingTimeout, stopLoadingTimeout } = useLoadingTimeout({
    timeout: 12000, // Increased from 8s to 12s to be more lenient
    onTimeout: () => {
      // Try to refetch data after timeout
      setTimeout(() => {
        if (user && fetchAllDataRef.current) {
          fetchAllDataRef.current();
        }
      }, 1000);
    },
    forceResetLoadingStates,
    resetOnVisibilityChange: true
  });

  // Store stopLoadingTimeout in ref to break circular dependency
  stopLoadingTimeoutRef.current = stopLoadingTimeout;


  // Function to create test data with different call times (for demonstration)
  const createTestData = useCallback(async () => {
    if (!supabase) return;
    
    try {
      // Create test patients if they don't exist
      const { data: existingPatients } = await supabase
        .from("patients")
        .select("id, full_name")
        .in("full_name", ["John Doe", "Kelly Smith", "Détár Imre", "Kelly Sparks"]);
      
      if (!existingPatients || existingPatients.length === 0) {
        console.log("No test patients found, creating them...");
        const { data: newPatients, error: patientError } = await supabase
          .from("patients")
          .insert([
            { 
              full_name: "John Doe", 
              phone_number: "+1234567890", 
              condition_type: "Hypertension",
              last_visit: "2025-08-04",
              doctor_id: null // Will be set by admin later
            },
            { 
              full_name: "Kelly Smith", 
              phone_number: "+1234567891", 
              condition_type: "Diabetes",
              last_visit: "2025-08-04",
              doctor_id: null
            },
            { 
              full_name: "Détár Imre", 
              phone_number: "+1234567892", 
              condition_type: "Cardiac",
              last_visit: "2025-08-04",
              doctor_id: null
            },
            { 
              full_name: "Kelly Sparks", 
              phone_number: "+1234567893", 
              condition_type: "Respiratory",
              last_visit: "2025-08-05",
              doctor_id: null
            }
          ])
          .select();
        
        if (patientError) {
          console.error("Error creating test patients:", patientError);
          return;
        }
        
        console.log("Created test patients (without call_time):", newPatients);
      }
      
      // Only create calls if we have patients
      const patientsToUse = existingPatients || [];
      if (patientsToUse.length === 0) {
        console.log("No patients available to create calls for");
        return;
      }
      
      // Create test calls with different timestamps (separate from patient creation)
      const now = new Date();
      const testCalls = [
        {
          patient_id: patientsToUse[0]?.id,
          call_time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          call_status: "success",
          notes: "Patient reported feeling better"
        },
        {
          patient_id: patientsToUse[1]?.id, 
          call_time: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          call_status: "success",
          notes: "Follow-up scheduled"
        },
        {
          patient_id: patientsToUse[2]?.id,
          call_time: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          call_status: "success", 
          notes: "Medication adjusted"
        },
        {
          patient_id: patientsToUse[3]?.id,
          call_time: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          call_status: "success",
          notes: "Symptoms improved"
        }
      ].filter(call => call.patient_id); // Only include calls with valid patient IDs
      
      if (testCalls.length > 0) {
        const { data: newCalls, error: callError } = await supabase
          .from("calls")
          .insert(testCalls)
          .select();
        
        if (callError) {
          console.error("Error creating test calls:", callError);
          return;
        }
        
        console.log("Created test calls with different timestamps:", newCalls);
      }
    } catch (error) {
      console.error("Error creating test data:", error);
    }
  }, [supabase]);

  // Reset all states when user changes
  const resetStates = useCallback(() => {
    setCalls([]);
    setUpcoming([]);
    setStats(null);
    setVolumeData(null);
    setError("");
    setErrorUpcoming("");
    setErrorStats("");
    setErrorVolume("");
    forceResetLoadingStates();
  }, []); // Empty dependency array to make it stable

  // Fetch recent calls
  const fetchCalls = useCallback(async () => {
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Calls fetch timeout')), 10000);
      });
      
      const fetchPromise = supabase
        .from("calls")
        .select("id, patient_id, call_time, call_status, patients(full_name)")
        .order("call_time", { ascending: false })
        .limit(10);
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        setError(error.message);
        setCalls([]);
      } else {
        console.log('Fetched calls data:', data); // Debug log
        
        // Also fetch all calls to see what's in the database
        const { data: allCalls } = await supabase
          .from("calls")
          .select("id, call_time, call_status")
          .order("call_time", { ascending: false });
        console.log('All calls in database:', allCalls);
        
        const processedCalls = (data as any[]).map((call) => {
          console.log('Processing call:', call); // Debug individual call
          return {
            ...call,
            patients: Array.isArray(call.patients) ? call.patients[0] : call.patients,
          };
        });
        console.log('Processed calls:', processedCalls); // Debug processed calls
        setCalls(processedCalls);
      }
    } catch (err: any) {
      console.error('Calls fetch error:', err);
      setError("Failed to fetch calls");
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch upcoming follow-ups
  const fetchUpcoming = useCallback(async () => {
    if (!supabase) {
      setErrorUpcoming("Supabase not configured");
      setLoadingUpcoming(false);
      return;
    }
    
    setLoadingUpcoming(true);
    setErrorUpcoming("");
    try {
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, last_visit, condition_type");
      
      if (patientsError) {
        setErrorUpcoming(patientsError.message);
        setUpcoming([]);
        return;
      }
      
      const { data: calls, error: callsError } = await supabase
        .from("calls")
        .select("patient_id, call_status, call_time")
        .in("call_status", ["success", "failed", "to be called"]);
      
      if (callsError) {
        setErrorUpcoming(callsError.message);
        setUpcoming([]);
        return;
      }
      
      const callMap = new Map();
      (calls as any[]).forEach((c) => {
        if (!callMap.has(c.patient_id) || new Date(c.call_time) > new Date(callMap.get(c.patient_id).call_time)) {
          callMap.set(c.patient_id, c);
        }
      });
      
      setUpcoming((patients as Patient[])
        .map((p) => ({
          ...p,
          call_status: callMap.has(p.id) ? callMap.get(p.id).call_status : "not called yet"
        }))
        .filter((p) => p.call_status === "to be called")
      );
    } catch (err: any) {
      setErrorUpcoming("Failed to fetch upcoming follow-ups");
      setUpcoming([]);
    } finally {
      setLoadingUpcoming(false);
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!supabase) {
      setErrorStats("Supabase not configured");
      setLoadingStats(false);
      return;
    }
    
    setLoadingStats(true);
    setErrorStats("");
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: numCalls, error: callsError } = await supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .gte("call_time", sevenDaysAgo.toISOString());
      
      if (callsError) {
        setErrorStats(callsError.message);
        setStats(null);
        return;
      }
      
      const { data: reports, error: reportsError } = await supabase
        .from("symptom_reports")
        .select("risk_level, escalate")
        .gte("created_at", sevenDaysAgo.toISOString());
      
      if (reportsError) {
        setErrorStats(reportsError.message);
        setStats(null);
        return;
      }
      
      const numEscalated = (reports as any[]).filter((r) => r.escalate).length;
      const riskMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
      const riskVals = (reports as any[]).map((r) => riskMap[r.risk_level] || 0).filter((v) => v > 0);
      const avgRiskNum = riskVals.length ? riskVals.reduce((a, b) => a + b, 0) / riskVals.length : 0;
      const avgRisk = avgRiskNum >= 2.5 ? "high" : avgRiskNum >= 1.5 ? "medium" : avgRiskNum > 0 ? "low" : "N/A";
      
      setStats({ numCalls: numCalls || 0, numEscalated, avgRisk });
    } catch (err: any) {
      setErrorStats("Failed to fetch statistics");
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch volume data
  const fetchVolume = useCallback(async () => {
    if (!supabase) {
      setErrorVolume("Supabase not configured");
      setLoadingVolume(false);
      return;
    }
    
    setLoadingVolume(true);
    setErrorVolume("");
    try {
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
        return;
      }
      
      (calls as any[]).forEach((call) => {
        const date = call.call_time.slice(0, 10);
        const idx = days.indexOf(date);
        if (idx !== -1) counts[idx]++;
      });
      
      setVolumeData({ labels: days, data: counts });
    } catch (err: any) {
      setErrorVolume("Failed to fetch volume data");
      setVolumeData(null);
    } finally {
      setLoadingVolume(false);
    }
  }, []);

  // Function to fetch all data with proper abort signal handling
  const fetchAllData = useCallback(() => {
    if (!user) return;
    
    lastFetchTime.current = Date.now();
    
    // Start loading timeout monitoring
    startLoadingTimeout();
    
    // Start all fetches
    fetchCalls();
    fetchUpcoming();
    fetchStats();
    fetchVolume();
    
    // Check loading completion after a delay
    setTimeout(() => {
      stopLoadingTimeoutRef.current?.();
    }, 2000); // Give enough time for all fetches to complete
  }, [user, fetchCalls, fetchUpcoming, fetchStats, fetchVolume, startLoadingTimeout]);

  // Store fetchAllData in ref for timeout handler access
  fetchAllDataRef.current = fetchAllData;

  // Handle visibility change and focus events with improved state management
  const handleRefetchOnVisibility = useCallback(() => {
    if (!isInitialized.current || !user) return;
    
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    // Only refetch if it's been more than 30 seconds since last fetch
    if (timeSinceLastFetch > 30000) {
      fetchAllData();
    }
  }, [user, fetchAllData]);



  // Use the visibility/focus hook for proper event handling
  useVisibilityFocus({
    onVisibilityChange: (isVisible) => {
      if (isVisible) {
        handleRefetchOnVisibility();
      }
    },
    onFocusChange: (isFocused) => {
      if (isFocused) {
        handleRefetchOnVisibility();
      }
    },
    enableRecovery: isInitialized.current && !!user
  });

  // Nuclear option: tab switch recovery with page reload as last resort
  const { triggerRecovery } = useTabSwitchRecovery({
    enabled: true,
    maxStuckTime: 12000, // 12 seconds before nuclear option
    reloadAsLastResort: true, // Enable the nuclear option
    onRecoveryAttempt: (method) => {
      // Recovery attempted
    }
  });

  useEffect(() => {
    if (!user) {
      resetStates();
      return;
    }
    
    // Clear any existing timeout
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }
    
    // Set a small delay to avoid race conditions
    fetchTimeout.current = setTimeout(() => {
      fetchAllData();
      isInitialized.current = true;
    }, 100);

    return () => {
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, [user?.id]); // Only depend on user ID, not the functions



  return (
    <ProtectedRoute>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
                  <div className="flex gap-2">
          <button
            onClick={fetchAllData}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Data
          </button>
          <button
            onClick={createTestData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            title="Creates test patients (without call_time) and sample calls with different timestamps"
          >
            Create Test Data
          </button>
        </div>
        </div>
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
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => {
                    console.log('Rendering call:', call); // Debug render
                    const callTime = new Date(call.call_time);
                    console.log('Call time object:', callTime); // Debug date object
                    
                    // Format the time more clearly
                    const timeAgo = getTimeAgo(callTime);
                    const formattedTime = callTime.toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                    
                    return (
                      <tr key={call.id} className="border-t">
                        <td className="p-2">{call.patients?.full_name || ""}</td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{formattedTime}</div>
                            <div className="text-sm text-gray-500">{timeAgo}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            call.call_status === 'success' ? 'bg-green-100 text-green-800' :
                            call.call_status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
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
                    <th className="text-left p-2">Call Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.full_name}</td>
                      <td className="p-2">{p.last_visit}</td>
                      <td className="p-2">{p.condition_type}</td>
                      <td className="p-2">{p.call_status}</td>
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