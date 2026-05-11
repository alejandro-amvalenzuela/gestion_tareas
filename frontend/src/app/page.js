"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authService.isLoggedIn()) {
      router.push("/tasks");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f8fafc',
      color: '#64748b'
    }}>
      <Loader2 size={48} className="animate-spin" />
    </div>
  );
}
