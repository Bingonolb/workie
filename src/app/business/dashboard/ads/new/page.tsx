import { Navbar } from "@/components/Navbar";
import { NewCampaignForm } from "./NewCampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="page-root">
      <Navbar />
      <NewCampaignForm />
    </div>
  );
}
