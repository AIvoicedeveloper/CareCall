import ProtectedRoute from "../components/ProtectedRoute";

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-2xl font-bold mb-4">Alerts</h1>
        <p>This is the Alerts page. High-risk and escalated cases will be shown here.</p>
      </div>
    </ProtectedRoute>
  );
} 