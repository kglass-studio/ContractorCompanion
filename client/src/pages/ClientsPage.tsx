import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ClientList from "@/components/clients/ClientList";
import ClientCreationModal from "@/components/clients/ClientCreationModal";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientsPage() {
  const [location, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    // Parse status from URL query params
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [location]);

  return (
    <div className="relative">
      <ClientList statusFilter={statusFilter} />
      
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setShowModal(true)}
        >
          <PlusIcon className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Client Creation Modal */}
      <ClientCreationModal 
        open={showModal} 
        onOpenChange={setShowModal} 
      />
    </div>
  );
}
