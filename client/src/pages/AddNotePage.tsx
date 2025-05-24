import { useParams } from "wouter";
import AddNoteForm from "@/components/clients/AddNoteForm";

export default function AddNotePage() {
  const params = useParams();
  const clientId = parseInt(params.id || "0");

  if (!clientId) {
    return <div>Invalid client ID</div>;
  }

  return <AddNoteForm clientId={clientId} />;
}
