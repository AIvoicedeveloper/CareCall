import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText, Box } from "@mui/material";

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
];

interface AddPatientDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  form: any;
  errors: any;
  creating: boolean;
  error: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  handleSelectChange: (name: string) => (event: any) => void;
  doctors: { id: string; name: string; email: string }[];
}

const AddPatientDialog: React.FC<AddPatientDialogProps> = React.memo(({ open, onClose, onCreate, form, errors, creating, error, handleChange, handleSelectChange, doctors }) => (
  <Dialog open={open} onClose={onClose}>
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
      <Button onClick={onClose} disabled={creating && !error}>Cancel</Button>
      <Button onClick={onCreate} disabled={creating} variant="contained" color="primary">
        {creating ? "Creating..." : "Create"}
      </Button>
    </DialogActions>
  </Dialog>
));

export default AddPatientDialog; 