import ProtectedRoute from "../components/ProtectedRoute";

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p>This is the Settings page. Admins can manage templates and rules here.</p>
      </div>
    </ProtectedRoute>
  );
} 