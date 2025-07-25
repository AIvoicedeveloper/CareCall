"use client";
import React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "../supabaseClient";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText, Box, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PatientsTable from "./PatientsTable";
import AddPatientDialog from "./AddPatientDialog";
import EditPatientDialog from "./EditPatientDialog";
import DeletePatientDialog from "./DeletePatientDialog";
import { useAuth } from "../authProvider";

const COUNTRY_CODES = [
  { code: "+1", label: "USA/Canada" },
  { code: "+44", label: "UK" },
  { code: "+36", label: "Hungary" },
  { code: "+49", label: "Germany" },
  { code: "+33", label: "France" },
  { code: "+39", label: "Italy" },
  { code: "+34", label: "Spain" },
  { code: "+91", label: "India" },
  { code: "+81", label: "Japan" },
  { code: "+61", label: "Australia" },
  // Add more as needed
];

interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
  last_visit: string;
  condition_type: string;
  doctor_id?: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    country_code: COUNTRY_CODES[0].code,
    phone_number: "",
    last_visit: "",
    condition_type: "",
    doctor_id: ""
  });
  const [errors, setErrors] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  // Get user role from authProvider
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setPatients([]);
      setLoading(false);
      return;
    }
    const fetchPatients = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id");
      if (error) {
        setError(error.message);
        setPatients([]);
      } else {
        setPatients(data as Patient[]);
      }
      setLoading(false);
    };
    fetchPatients();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setDoctors([]);
      return;
    }
    // Fetch doctors for dropdown
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("role", "doctor");
      if (!error && data) {
        setDoctors(data as Doctor[]);
      }
    };
    fetchDoctors();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setDeleteId(null);
      setDeleteLoading(false);
      setDeleteError("");
    }
  }, [user]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({ full_name: "", country_code: COUNTRY_CODES[0].code, phone_number: "", last_visit: "", condition_type: "", doctor_id: "" });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
    setErrors((prev: any) => ({ ...prev, [name as string]: undefined }));
  };

  // Add this handler for Select components
  const handleSelectChange = (name: string) => (event: any) => {
    setForm((prev) => ({ ...prev, [name]: event.target.value }));
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!form.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!/^[0-9]+$/.test(form.phone_number)) newErrors.phone_number = "Phone number must be digits only";
    if (!form.country_code) newErrors.country_code = "Country code is required";
    if (!form.last_visit) newErrors.last_visit = "Last visit date is required";
    if (!form.condition_type.trim()) newErrors.condition_type = "Condition type is required";
    if (!form.doctor_id) newErrors.doctor_id = "Doctor is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setCreating(true);
    setError(""); // Clear previous errors
    const { full_name, country_code, phone_number, last_visit, condition_type, doctor_id } = form;
    const fullPhone = `${country_code}${phone_number}`;
    try {
      const { error } = await supabase.from("patients").insert([
        { full_name, phone_number: fullPhone, last_visit, condition_type, doctor_id }
      ]);
      if (error) {
        setError(error.message);
        console.log("Create error:", error);
        setCreating(false);
        return;
      }
      // Refresh patients
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id");
      setLoading(false);
      if (fetchError) {
        setError(fetchError.message);
        console.log("Fetch after create error:", fetchError);
        setCreating(false);
        return;
      }
      setPatients(data as Patient[]);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Unknown error");
      console.log("Unexpected create error:", err);
    }
    setCreating(false); // Always reset creating state
  };

  // Memoized handlers
  const handleEditOpen = React.useCallback((patient: Patient) => {
    setEditPatient(patient);
    let country_code = COUNTRY_CODES[0].code;
    let phone_number = patient.phone_number;
    for (const c of COUNTRY_CODES) {
      if (phone_number.startsWith(c.code)) {
        country_code = c.code;
        phone_number = phone_number.slice(c.code.length);
        break;
      }
    }
    setEditForm({
      id: patient.id,
      full_name: patient.full_name,
      country_code,
      phone_number,
      last_visit: patient.last_visit,
      condition_type: patient.condition_type,
      doctor_id: (patient as any).doctor_id || ""
    });
    setEditOpen(true);
  }, []);

  const handleEditClose = () => {
    setEditOpen(false);
    setEditPatient(null);
    setEditForm({});
    setErrors({});
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name as string]: value }));
    setErrors((prev: any) => ({ ...prev, [name as string]: undefined }));
  };
  const handleEditSelectChange = (name: string) => (event: any) => {
    setEditForm((prev: any) => ({ ...prev, [name]: event.target.value }));
    setErrors((prev: any) => ({ ...prev, [name]: undefined }));
  };
  const handleEditSave = async () => {
    if (!validateEdit()) {
      setError("Validation failed. Please check the form fields.");
      return;
    }
    setLoading(true);
    setError("");
    const { id, full_name, country_code, phone_number, last_visit, condition_type, doctor_id } = editForm;
    const fullPhone = `${country_code}${phone_number}`;
    try {
      console.log("Updating patient:", editForm);
      const { error } = await supabase.from("patients").update({
        full_name, phone_number: fullPhone, last_visit, condition_type, doctor_id
      }).eq("id", id);
      if (error) {
        setError(error.message);
        console.log("Edit error:", error);
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id");
      if (fetchError) {
        setError(fetchError.message);
        console.log("Fetch after edit error:", fetchError);
        setLoading(false);
        return;
      }
      setPatients(data as Patient[]);
      handleEditClose();
    } catch (err: any) {
      setError(err.message || "Unknown error");
      console.log("Unexpected edit error:", err);
    }
    setLoading(false);
  };
  const validateEdit = () => {
    const newErrors: any = {};
    if (!editForm.full_name?.trim()) newErrors.full_name = "Full name is required";
    if (!editForm.phone_number?.trim()) newErrors.phone_number = "Phone number is required";
    if (!/^[0-9]+$/.test(editForm.phone_number)) newErrors.phone_number = "Phone number must be digits only";
    if (!editForm.country_code) newErrors.country_code = "Country code is required";
    if (!editForm.last_visit) newErrors.last_visit = "Last visit date is required";
    if (!editForm.condition_type?.trim()) newErrors.condition_type = "Condition type is required";
    if (!editForm.doctor_id) newErrors.doctor_id = "Doctor is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleDelete = async () => {
    if (!deleteId) {
      setDeleteLoading(false);
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const { error } = await supabase.from("patients").delete().eq("id", deleteId);
      if (error) {
        setDeleteError(error.message);
        console.log("Delete error:", error);
        setDeleteLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id");
      if (fetchError) {
        setDeleteError(fetchError.message);
        console.log("Fetch after delete error:", fetchError);
        setDeleteLoading(false);
        return;
      }
      setPatients(data as Patient[]);
      setDeleteId(null); // Only close after successful fetch
    } catch (err: any) {
      setDeleteError(err.message || "Unknown error");
      console.log("Unexpected delete error:", err);
    }
    setDeleteLoading(false);
  };

  const handleDeleteOpen = React.useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-2xl font-bold mb-4">Patients</h1>
        {(user?.role === "doctor" || user?.role === "staff" || user?.role === "admin") && (
          <Button variant="contained" color="primary" onClick={handleOpen} className="mb-4">
            Add New Patient
          </Button>
        )}
        <AddPatientDialog
          open={open}
          onClose={handleClose}
          onCreate={handleCreate}
          form={form}
          errors={errors}
          creating={creating}
          error={error}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          doctors={doctors}
        />
        <EditPatientDialog
          open={editOpen}
          onClose={handleEditClose}
          onSave={handleEditSave}
          editForm={editForm}
          errors={errors}
          loading={loading}
          error={error}
          handleEditChange={handleEditChange}
          handleEditSelectChange={handleEditSelectChange}
          doctors={doctors}
        />
        <DeletePatientDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onDelete={handleDelete}
          loading={deleteLoading}
          error={deleteError}
        />
        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : patients.length === 0 ? (
            <div>No patients found.</div>
          ) : (
            <PatientsTable
              patients={patients}
              onEdit={handleEditOpen}
              onDelete={handleDeleteOpen}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 