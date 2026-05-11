"use client";

import Sidebar from "@/components/Navigation/Sidebar";
import Topbar from "@/components/Navigation/Topbar";
import { usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { useEffect, useState } from "react";

export default function DashboardWrapper({ children }) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    setIsLoggedIn(authService.isLoggedIn());
  }, [pathname]);

  if (isLoginPage || !isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px' }}>
        <Topbar />
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
