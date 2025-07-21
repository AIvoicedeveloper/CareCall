"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "../supabaseClient";

interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
  last_visit: string;
  condition_type: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type");
      if (error) {
        setError(error.message);
        setPatients([]);
      } else {
        setPatients(data as Patient[]);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-2xl font-bold mb-4">Patients</h1>
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : patients.length === 0 ? (
            <div>No patients found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Last Visit</th>
                  <th className="text-left p-2">Condition</th>
                  <th className="text-left p-2">Profile</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.full_name}</td>
                    <td className="p-2">{p.phone_number}</td>
                    <td className="p-2">{p.last_visit}</td>
                    <td className="p-2">{p.condition_type}</td>
                    <td className="p-2">
                      <Link href={`/patients/${p.id}`} className="text-blue-600 hover:underline">
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 