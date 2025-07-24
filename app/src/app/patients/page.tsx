"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "../supabaseClient";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText, Box, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { user } = require("../authProvider").useAuth();

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

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
    const { error } = await supabase.from("patients").insert([
      { full_name, phone_number: fullPhone, last_visit, condition_type, doctor_id }
    ]);
    if (!error) {
      // Refresh patients
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id");
      setLoading(false);
      if (!fetchError) {
        setPatients(data as Patient[]);
        handleClose();
      } else {
        setError(fetchError.message);
      }
    } else {
      setError(error.message);
    }
    setCreating(false); // Always reset creating state
  };

  const handleEditOpen = (patient: Patient) => {
    setEditPatient(patient);
    // Split phone number into country code and number if possible
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
  };
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
    if (!validateEdit()) return;
    const { id, full_name, country_code, phone_number, last_visit, condition_type, doctor_id } = editForm;
    const fullPhone = `${country_code}${phone_number}`;
    const { error } = await supabase.from("patients").update({
      full_name, phone_number: fullPhone, last_visit, condition_type, doctor_id
    }).eq("id", id);
    if (!error) {
      setLoading(true);
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id");
      setPatients(data as Patient[]);
      setLoading(false);
      handleEditClose(); // Only close after successful fetch
    } else {
      setError(error.message);
    }
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
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError("");
    const { error } = await supabase.from("patients").delete().eq("id", deleteId);
    if (!error) {
      const { data, error: fetchError } = await supabase
        .from("patients")
        .select("id, full_name, phone_number, last_visit, condition_type, doctor_id");
      if (!fetchError) {
        setPatients(data as Patient[]);
        setDeleteId(null); // Only close after successful fetch
      } else {
        setDeleteError(fetchError.message);
      }
    } else {
      setDeleteError(error.message);
    }
    setDeleteLoading(false);
  };

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-2xl font-bold mb-4">Patients</h1>
        {(user?.role === "doctor" || user?.role === "staff" || user?.role === "admin") && (
          <Button variant="contained" color="primary" onClick={handleOpen} className="mb-4">
            Add New Patient
          </Button>
        )}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Full Name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.full_name}
              helperText={errors.full_name}
            />
            {/* Phone Number Row */}
            <Box display="flex" gap={1} alignItems="flex-start">
              <FormControl sx={{ width: 90 }} required error={!!errors.country_code} variant="outlined" size="small">
                <Select
                  name="country_code"
                  value={form.country_code}
                  onChange={handleSelectChange("country_code")}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Country Code' }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{c.code}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                placeholder="Phone Number *"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                error={!!errors.phone_number}
                helperText={errors.phone_number}
                size="small"
                sx={{ mt: 0 }}
              />
            </Box>
            <TextField
              margin="dense"
              name="last_visit"
              type="date"
              value={form.last_visit}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.last_visit}
              helperText={errors.last_visit}
              label=""
              placeholder=""
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Condition Type"
              name="condition_type"
              value={form.condition_type}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.condition_type}
              helperText={errors.condition_type}
            />
            <FormControl fullWidth margin="dense" required error={!!errors.doctor_id}>
              <InputLabel id="doctor-label">Doctor</InputLabel>
              <Select
                labelId="doctor-label"
                name="doctor_id"
                value={form.doctor_id}
                onChange={handleSelectChange("doctor_id")}
                label="Doctor"
              >
                {doctors.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>{doc.name || doc.email}</MenuItem>
                ))}
              </Select>
              {errors.doctor_id && <FormHelperText>{errors.doctor_id}</FormHelperText>}
            </FormControl>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={creating && !error}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} variant="contained" color="primary">
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Patient Dialog */}
        <Dialog open={editOpen} onClose={handleEditClose}>
          <DialogTitle>Edit Patient</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              placeholder="Full Name *"
              name="full_name"
              value={editForm.full_name || ""}
              onChange={handleEditChange}
              fullWidth
              required
              error={!!errors.full_name}
              helperText={errors.full_name}
              size="small"
            />
            <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
              <FormControl sx={{ width: 90 }} required error={!!errors.country_code} variant="outlined" size="small">
                <Select
                  name="country_code"
                  value={editForm.country_code || COUNTRY_CODES[0].code}
                  onChange={handleEditSelectChange("country_code")}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Country Code' }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>{c.code}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                placeholder="Phone Number *"
                name="phone_number"
                value={editForm.phone_number || ""}
                onChange={handleEditChange}
                fullWidth
                required
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                error={!!errors.phone_number}
                helperText={errors.phone_number}
                size="small"
                margin="dense"
              />
            </Box>
            <TextField
              margin="dense"
              name="last_visit"
              type="date"
              value={editForm.last_visit || ""}
              onChange={handleEditChange}
              fullWidth
              required
              error={!!errors.last_visit}
              helperText={errors.last_visit}
              label=""
              placeholder=""
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              placeholder="Condition Type *"
              name="condition_type"
              value={editForm.condition_type || ""}
              onChange={handleEditChange}
              fullWidth
              required
              error={!!errors.condition_type}
              helperText={errors.condition_type}
              size="small"
            />
            <FormControl fullWidth margin="dense" required error={!!errors.doctor_id}>
              <InputLabel id="edit-doctor-label">Doctor</InputLabel>
              <Select
                labelId="edit-doctor-label"
                name="doctor_id"
                value={editForm.doctor_id || ""}
                onChange={handleEditSelectChange("doctor_id")}
                label="Doctor"
              >
                {doctors.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>{doc.name || doc.email}</MenuItem>
                ))}
              </Select>
              {errors.doctor_id && <FormHelperText>{errors.doctor_id}</FormHelperText>}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained" color="primary" disabled={loading}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
          <DialogTitle>Delete Patient</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this patient?
            {deleteError && <div style={{ color: 'red', marginTop: 8 }}>{deleteError}</div>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)} disabled={deleteLoading && !deleteError}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
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
                  <th className="text-left p-2">Edit</th>
                  <th className="text-left p-2">Delete</th>
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
                    <td className="p-2">
                      <IconButton aria-label="edit" onClick={() => handleEditOpen(p)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </td>
                    <td className="p-2">
                      <IconButton aria-label="delete" onClick={() => setDeleteId(p.id)} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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