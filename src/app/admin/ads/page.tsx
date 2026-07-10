import { Navbar } from "@/components/Navbar";
import { AdminAdsClient } from "./AdminAdsClient";

export default function AdminAdsPage() {
  return (
    <div className="page-root">
      <Navbar />
      <AdminAdsClient />
    </div>
  );
}
