import { NavbarClient } from "@/components/NavbarClient";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarClient />
      {children}
    </>
  );
}
