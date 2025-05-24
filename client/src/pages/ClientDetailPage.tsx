import { useParams } from "wouter";
import ClientDetail from "@/components/clients/ClientDetail";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = parseInt(params.id || "0");

  if (!clientId) {
    return <div>Invalid client ID</div>;
  }

  return <ClientDetail clientId={clientId} />;
}
