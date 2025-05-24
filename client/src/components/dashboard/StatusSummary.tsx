import { JobStatus } from "@shared/schema";
import { useLocation } from "wouter";

interface StatusCounts {
  leads?: number;
  quoted?: number;
  scheduled?: number;
  completed?: number;
  paid?: number;
}

interface StatusSummaryProps {
  counts: StatusCounts;
}

export default function StatusSummary({ counts }: StatusSummaryProps) {
  const [, navigate] = useLocation();

  const handleClick = (status: string) => {
    navigate(`/clients?status=${status}`);
  };

  const statusItems = [
    { key: "leads", label: "Leads", count: counts.leads || 0, colorClass: "border-gray-400", status: JobStatus.LEAD },
    { key: "quoted", label: "Quoted", count: counts.quoted || 0, colorClass: "border-amber-400", status: JobStatus.QUOTED },
    { key: "scheduled", label: "Scheduled", count: counts.scheduled || 0, colorClass: "border-primary", status: JobStatus.SCHEDULED },
    { key: "completed", label: "Completed", count: counts.completed || 0, colorClass: "border-green-500", status: JobStatus.COMPLETED },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {statusItems.map((item) => (
        <button 
          key={item.key}
          className={`flex flex-col items-center justify-center rounded-lg bg-white shadow p-3 border-t-4 ${item.colorClass} hover:bg-gray-50`}
          onClick={() => handleClick(item.status)}
        >
          <span className="text-xl font-bold">{item.count}</span>
          <span className="text-sm text-gray-600">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
