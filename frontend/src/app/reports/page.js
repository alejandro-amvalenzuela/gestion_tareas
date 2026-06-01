"use client";

import ReportsModule from "@/components/Reports/ReportsModule";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function ReportsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      router.push("/login");
      return;
    }
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.rol !== "administrador") {
      router.push("/tasks");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) return null;

  return (
    <main>
      <ReportsModule />
    </main>
  );
}
