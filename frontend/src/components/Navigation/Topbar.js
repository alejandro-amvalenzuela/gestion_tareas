"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import styles from "./Navigation.module.css";
import { authService } from "@/services/authService";
import { useRouter, usePathname } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const getPageTitle = () => {
    if (pathname === "/tasks") return "Mis Tareas";
    if (pathname === "/users") return "Gestión de Usuarios";
    if (pathname === "/categories") return "Gestión de Categorías";
    return "Panel de Control";
  };

  return (
    <header className={styles.topbar}>
      <h2 className={styles.pageTitle}>{getPageTitle()}</h2>

      <div className={styles.userMenu}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.nombre} {user?.apellido}</span>
            <span className={styles.userRole}>{user?.rol}</span>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
