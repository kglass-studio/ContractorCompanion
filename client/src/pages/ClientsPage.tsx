import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ClientList from "@/components/clients/ClientList";

export default function ClientsPage() {
  const [location, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Parse status from URL query params
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [location]);

  return <ClientList statusFilter={statusFilter} />;
}
