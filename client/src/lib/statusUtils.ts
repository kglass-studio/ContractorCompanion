import { JobStatus } from "@shared/schema";

export function getStatusClass(status: string): string {
  switch (status) {
    case JobStatus.LEAD:
      return "status-lead";
    case JobStatus.QUOTED:
      return "status-quoted";
    case JobStatus.SCHEDULED:
      return "status-scheduled";
    case JobStatus.COMPLETED:
      return "status-completed";
    case JobStatus.PAID:
      return "status-paid";
    default:
      return "bg-gray-500";
  }
}
