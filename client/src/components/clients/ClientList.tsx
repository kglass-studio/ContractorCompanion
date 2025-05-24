import { useState } from "react";
import { useLocation } from "wouter";
import { useClients } from "@/hooks/useClients";
import ClientCard from "@/components/dashboard/ClientCard";
import { PlusIcon, ArrowLeftIcon, SearchIcon, FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientListProps {
  statusFilter?: string;
}

export default function ClientList({ statusFilter }: ClientListProps) {
  const [, navigate] = useLocation();
  const [activeFilter, setActiveFilter] = useState(statusFilter || "all");
  const { data: clients, isLoading } = useClients({ status: activeFilter !== "all" ? activeFilter : undefined });

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "all") {
      navigate("/clients");
    } else {
      navigate(`/clients?status=${filter}`);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header with back button */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button className="p-1" onClick={() => navigate("/")}>
              <ArrowLeftIcon size={20} />
            </button>
            <h1 className="text-xl font-bold">All Clients</h1>
          </div>
          <div>
            <button className="p-2 rounded-full hover:bg-blue-600 transition" aria-label="Search">
              <SearchIcon size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-blue-600 transition" aria-label="Filter">
              <FilterIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Filter Options */}
      <div className="px-4 py-2 bg-white border-b flex gap-2 overflow-x-auto">
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "all" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("all")}
        >
          All Clients
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "lead" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("lead")}
        >
          Leads
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "quoted" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("quoted")}
        >
          Quoted
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "scheduled" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("scheduled")}
        >
          Scheduled
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "completed" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("completed")}
        >
          Completed
        </button>
        <button 
          className={`px-3 py-1 rounded-full ${activeFilter === "paid" ? "bg-primary text-white" : "bg-gray-100 text-gray-700"} text-sm whitespace-nowrap`}
          onClick={() => handleFilterChange("paid")}
        >
          Paid
        </button>
      </div>

      {/* Client List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-3 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-100 rounded w-8"></div>
                <div className="h-8 bg-gray-100 rounded w-8"></div>
                <div className="h-8 bg-gray-100 rounded w-8"></div>
              </div>
            </div>
          ))
        ) : clients && clients.length > 0 ? (
          clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-3 text-center text-gray-500">
            No clients found. Add your first client!
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button 
        size="icon"
        className="fixed bottom-20 right-4 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-10 text-2xl"
        onClick={() => navigate("/clients/add")}
      >
        <PlusIcon size={24} />
      </Button>
    </div>
  );
}
