"use client";

import UsersModule from "@/components/Users/UsersModule";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function UsersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.rol !== "administrador") {
      router.push("/tasks");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) return null;

  return (
    <main>
      <UsersModule />
    </main>
  );
}
