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

interface EditPatientDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editForm: any;
  errors: any;
  loading: boolean;
  error: string;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  handleEditSelectChange: (name: string) => (event: any) => void;
  doctors: { id: string; name: string; email: string }[];
}

const EditPatientDialog: React.FC<EditPatientDialogProps> = React.memo(({ open, onClose, onSave, editForm, errors, loading, error, handleEditChange, handleEditSelectChange, doctors }) => (
  <Dialog open={open} onClose={onClose}>
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
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading && !error}>Cancel</Button>
      <Button onClick={onSave} variant="contained" color="primary" disabled={loading}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
));

export default EditPatientDialog; 