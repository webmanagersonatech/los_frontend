
import DashboardLayout from "../layouts/DashboardLayout";

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold capitalize">reports</h1>
        <p className="text-slate-500 mt-3">
          Enterprise-grade reports management page.
        </p>
      </div>
    </DashboardLayout>
  );
}
