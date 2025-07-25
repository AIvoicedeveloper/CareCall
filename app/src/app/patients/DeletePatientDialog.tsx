import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

interface DeletePatientDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  loading: boolean;
  error: string;
}

const DeletePatientDialog: React.FC<DeletePatientDialogProps> = React.memo(({ open, onClose, onDelete, loading, error }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Patient</DialogTitle>
    <DialogContent>
      Are you sure you want to delete this patient?
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading && !error}>Cancel</Button>
      <Button onClick={onDelete} color="error" variant="contained" disabled={loading}>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
));

export default DeletePatientDialog; 