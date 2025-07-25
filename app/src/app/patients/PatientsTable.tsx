import React from "react";
import Link from "next/link";
import { IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
  last_visit: string;
  condition_type: string;
  doctor_id?: string;
}

interface PatientsTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

const TableRow = React.memo(({ patient, onEdit, onDelete }: { patient: Patient; onEdit: (p: Patient) => void; onDelete: (id: string) => void }) => (
  <tr className="border-t">
    <td className="p-2">{patient.full_name}</td>
    <td className="p-2">{patient.phone_number}</td>
    <td className="p-2">{patient.last_visit}</td>
    <td className="p-2">{patient.condition_type}</td>
    <td className="p-2">
      <Link href={`/patients/${patient.id}`} className="text-blue-600 hover:underline">
        View Profile
      </Link>
    </td>
    <td className="p-2">
      <IconButton aria-label="edit" onClick={() => onEdit(patient)} size="small">
        <EditIcon fontSize="small" />
      </IconButton>
    </td>
    <td className="p-2">
      <IconButton aria-label="delete" onClick={() => onDelete(patient.id)} size="small" color="error">
        <DeleteIcon fontSize="small" />
      </IconButton>
    </td>
  </tr>
));

const PatientsTable: React.FC<PatientsTableProps> = React.memo(({ patients, onEdit, onDelete }) => (
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
        <TableRow key={p.id} patient={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </tbody>
  </table>
));

export default PatientsTable; 