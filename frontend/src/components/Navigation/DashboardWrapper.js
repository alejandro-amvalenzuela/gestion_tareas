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
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
