import Dashboard from "@/components/dashboard/Dashboard";
import { TestNotification } from "@/components/TestNotification";

export default function DashboardPage() {
  return (
    <div>
      <Dashboard />
      <div className="container mx-auto mt-8 pb-20">
        <h2 className="text-xl font-bold mb-4">Test Notification System</h2>
        <TestNotification />
      </div>
    </div>
  );
}
