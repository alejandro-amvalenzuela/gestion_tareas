"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, CheckSquare, Users, Settings, Tag } from "lucide-react";
import styles from "./Navigation.module.css";
import { authService } from "@/services/authService";

export default function Sidebar() {
  const pathname = usePathname();
  const user = authService.getCurrentUser();
  const isAdmin = user?.rol === "administrador";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <img src="/icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span className={styles.logoText}>MyTasks</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>Principal</div>
        
        <Link 
          href="/tasks" 
          className={`${styles.navItem} ${pathname === "/tasks" ? styles.active : ""}`}
        >
          <CheckSquare size={20} />
          <span>Tareas</span>
        </Link>

        {isAdmin && (
          <>
            <div className={styles.navSection}>Administración</div>
            <Link 
              href="/users" 
              className={`${styles.navItem} ${pathname === "/users" ? styles.active : ""}`}
            >
              <Users size={20} />
              <span>Usuarios</span>
            </Link>
            <Link 
              href="/categories" 
              className={`${styles.navItem} ${pathname === "/categories" ? styles.active : ""}`}
            >
              <Tag size={20} />
              <span>Categorías</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
