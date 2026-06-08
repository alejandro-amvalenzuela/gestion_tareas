"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  FileText,
  Users,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Download
} from "lucide-react";
import dashboardStyles from "../Tasks/TasksModule.module.css";
import reportStyles from "./ReportsModule.module.css";
import { tareasService } from "@/services/tareasService";
import { usersService } from "@/services/usersService";
import { categoriasService } from "@/services/categoriasService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsModule() {
  const [tareas, setTareas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("estados");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tareasData, usuariosData, categoriasData] = await Promise.all([
        tareasService.getTareas(),
        usersService.getUsers(),
        categoriasService.getAll()
      ]);
      setTareas(tareasData || []);
      setUsuarios(usuariosData || []);
      setCategorias(categoriasData || []);
    } catch (error) {
      console.error("Error cargando datos para reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- PROCESAMIENTO DE DATOS ---

  const parseLocalDate = (dateVal) => {
    if (!dateVal) return null;

    const d = new Date(dateVal);

    if (
      d.getUTCHours() === 0 &&
      d.getUTCMinutes() === 0 &&
      d.getUTCSeconds() === 0 &&
      d.getUTCMilliseconds() === 0
    ) {
      return new Date(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate()
      );
    }

    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    );
  };

  // 1. Reporte por Estado
  const getReporteEstados = () => {
    const counts = {
      pending: 0,
      in_progress: 0,
      completed: 0
    };

    tareas.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });

    const total = tareas.length;

    return [
      {
        id: "pending",
        nombre: "Pendiente",
        cantidad: counts.pending,
        porcentaje: total ? ((counts.pending / total) * 100).toFixed(1) : 0,
        color: "#f59e0b"
      },
      {
        id: "in_progress",
        nombre: "En Progreso",
        cantidad: counts.in_progress,
        porcentaje: total ? ((counts.in_progress / total) * 100).toFixed(1) : 0,
        color: "#3b82f6"
      },
      {
        id: "completed",
        nombre: "Completada",
        cantidad: counts.completed,
        porcentaje: total ? ((counts.completed / total) * 100).toFixed(1) : 0,
        color: "rgba(36, 184, 32, 1)"
      }
    ];
  };

  // 2. Reporte por Usuario
  const getReporteUsuarios = () => {
    const reportMap = {};

    usuarios.forEach((u) => {
      reportMap[u._id] = {
        nombre: `${u.nombre || ""} ${u.apellido || ""}`.trim() || u.username,
        username: u.username,
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0
      };
    });

    tareas.forEach((t) => {
      const assignedId = t.assignedTo?._id || t.assignedTo;
      if (assignedId && reportMap[assignedId]) {
        reportMap[assignedId].total++;
        if (t.status === "pending") reportMap[assignedId].pending++;
        if (t.status === "in_progress") reportMap[assignedId].in_progress++;
        if (t.status === "completed") reportMap[assignedId].completed++;
      }
    });

    return Object.values(reportMap);
  };

  // 3. Reporte por Categoría
  const getReporteCategorias = () => {
    const reportMap = {};

    categorias.forEach((c) => {
      reportMap[c._id] = {
        nombre: c.nombre,
        descripcion: c.descripcion || "-",
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0
      };
    });

    reportMap["sin_categoria"] = {
      nombre: "Sin Categoría",
      descripcion: "Tareas sin una categoría asignada",
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0
    };

    tareas.forEach((t) => {
      const catId = t.categoria?._id || t.categoria || "sin_categoria";
      if (reportMap[catId]) {
        reportMap[catId].total++;
        if (t.status === "pending") reportMap[catId].pending++;
        if (t.status === "in_progress") reportMap[catId].in_progress++;
        if (t.status === "completed") reportMap[catId].completed++;
      }
    });

    return Object.values(reportMap).filter(
      (c) => c.total > 0 || c.nombre !== "Sin Categoría"
    );
  };

  // 4. Reporte de tareas vencidas
  const getReporteTareasVencidas = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tareas.filter((t) => {
      const localDueDate = parseLocalDate(t.dueDate);

      return (
        localDueDate &&
        localDueDate < today &&
        t.status === "pending"
      );
    });
  };

  // 5. Reporte de tareas próximas a vencer (3 días)
  const getReporteProximasVencer = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    return tareas.filter((t) => {
      const localDueDate = parseLocalDate(t.dueDate);

      return (
        localDueDate &&
        localDueDate >= today &&
        localDueDate <= threeDaysLater &&
        t.status === "pending"
      );
    });
  };

// --- EXPORTAR A PDF ---
const exportPDF = (type) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Verde característico del sistema: rgb(36, 184, 32)
  const systemGreenColor = [36, 184, 32];

  // Encabezado del Documento
  doc.setFillColor(36, 184, 32);
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MyTasks - Sistema de Gestión", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Reportes y Estadísticas de Administración", 15, 25);

  // Información del Reporte
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);

  let reportTitle = "";
  let headers = [];
  let data = [];

  const nowStr = new Date().toLocaleString("es-ES", {
    dateStyle: "long",
    timeStyle: "short"
  });

  if (type === "estados") {
    reportTitle = "Reporte de Tareas por Estado";
    headers = [["Estado", "Cantidad de Tareas", "Porcentaje"]];
    data = getReporteEstados().map((item) => [
      item.nombre,
      item.cantidad.toString(),
      `${item.porcentaje}%`
    ]);
  } else if (type === "usuarios") {
    reportTitle = "Reporte de Tareas por Usuario";
    headers = [["Usuario", "Nombre de Usuario", "Total Asignadas", "Pendientes", "En Progreso", "Completadas"]];
    data = getReporteUsuarios().map((item) => [
      item.nombre,
      `@${item.username}`,
      item.total.toString(),
      item.pending.toString(),
      item.in_progress.toString(),
      item.completed.toString()
    ]);
  } else if (type === "categorias") {
    reportTitle = "Reporte de Tareas por Categoría";
    headers = [["Categoría", "Descripción", "Total Tareas", "Pendientes", "En Progreso", "Completadas"]];
    data = getReporteCategorias().map((item) => [
      item.nombre,
      item.descripcion,
      item.total.toString(),
      item.pending.toString(),
      item.in_progress.toString(),
      item.completed.toString()
    ]);
  } else if (type === "tareasVencidas") {
    reportTitle = "Reporte de Tareas Vencidas";

    headers = [[
      "Título",
      "Responsable",
      "Categoría",
      "Fecha Límite"
    ]];

    data = getReporteTareasVencidas().map((item) => [
      item.title || item.titulo || "-",
      item.assignedTo? `${item.assignedTo.nombre || ""} ${item.assignedTo.apellido || ""}`.trim(): "-",
      item.categoria?.nombre || "-",
      parseLocalDate(item.dueDate)?.toLocaleDateString("es-ES") || "-"
    ]);
  }

  else if (type === "proximasVencer") {
    reportTitle = "Reporte de Tareas Próximas a Vencer";

    headers = [[
      "Título",
      "Responsable",
      "Categoría",
      "Fecha Límite"
    ]];

    data = getReporteProximasVencer().map((item) => [
      item.title || item.titulo || "-",
      item.assignedTo? `${item.assignedTo.nombre || ""} ${item.assignedTo.apellido || ""}`.trim(): "-",
      item.categoria?.nombre || "-",
      parseLocalDate(item.dueDate)?.toLocaleDateString("es-ES") || "-"
    ]);
  }

  doc.text(reportTitle, 15, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha de generación: ${nowStr}`, 15, 54);

  // Línea divisoria
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 58, 195, 58);

  // Generar Tabla utilizando autoTable con el color verde del sistema
  autoTable(doc, {
    startY: 63,
    head: headers,
    body: data,
    theme: "striped",
    headStyles: {
      fillColor: systemGreenColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold"
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 15, right: 15 }
  });

  // Pie de Página
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Pág. ${i} de ${totalPages} - Documento generado por Administrador`,
      15,
      287
    );
    doc.text("MyTasks © 2026", 180, 287);
  }

  // Guardar el documento
  const filename = `reporte_${type}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
};

if (loading) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
      <Loader2 size={40} className="animate-spin" style={{ color: "rgba(36, 184, 32, 1)" }} />
      <p style={{ color: "#64748b", fontWeight: 500 }}>Cargando datos y generando agregaciones...</p>
    </div>
  );
}

// Métricas generales rápidas
const totalTareas = tareas.length;
const completadas = tareas.filter((t) => t.status === "completed").length;
const enProgreso = tareas.filter((t) => t.status === "in_progress").length;
const pendientes = tareas.filter((t) => t.status === "pending").length;
const tareasVencidas = getReporteTareasVencidas().length;
const proximasVencer = getReporteProximasVencer().length;

return (
  <div className={reportStyles.reportsContainer}>
    {/* CABECERA SIMPLIFICADA Y LIMPIA */}
    <section className={dashboardStyles.header} style={{ marginBottom: "2rem" }}>
      <div className={dashboardStyles.titleSection}>
        <h1>Reportes Administrativos</h1>
        <p>Análisis en tiempo real sobre el estado del proyecto, tareas y responsables</p>
      </div>

      <div className={dashboardStyles.actionsSection}>
        <button className={dashboardStyles.btnPrimary} onClick={() => exportPDF(activeTab)}>
          <Download size={18} />
          <span>Descargar Reporte PDF</span>
        </button>
      </div>
    </section>

    {/* TARJETAS DE KPIs (USANDO EL MISMO DISEÑO QUE DASHBOARD PRINCIPAL) */}
    <div className={dashboardStyles.summaryGrid} style={{ marginBottom: "2rem" }}>
      <div className={dashboardStyles.summaryCard}>
        <div className={dashboardStyles.iconCircle} style={{ background: "#f1f5f9", color: "#64748b" }}>
          <FileText size={20} />
        </div>
        <div className={dashboardStyles.cardInfo}>
          <span className={dashboardStyles.cardNumber}>{totalTareas}</span>
          <span className={dashboardStyles.cardLabel}>Total Tareas</span>
        </div>
      </div>

      <div className={dashboardStyles.summaryCard}>
        <div className={dashboardStyles.iconCircle} style={{ background: "rgba(36, 184, 32, 0.1)", color: "rgba(36, 184, 32, 1)" }}>
          <CheckCircle size={20} />
        </div>
        <div className={dashboardStyles.cardInfo}>
          <span className={dashboardStyles.cardNumber}>{completadas}</span>
          <span className={dashboardStyles.cardLabel}>Completadas</span>
        </div>
      </div>

      <div className={dashboardStyles.summaryCard}>
        <div className={dashboardStyles.iconCircle} style={{ background: "#eff6ff", color: "#2563eb" }}>
          <Clock size={20} />
        </div>
        <div className={dashboardStyles.cardInfo}>
          <span className={dashboardStyles.cardNumber}>{enProgreso}</span>
          <span className={dashboardStyles.cardLabel}>En Progreso</span>
        </div>
      </div>

      <div className={dashboardStyles.summaryCard}>
        <div className={dashboardStyles.iconCircle} style={{ background: "#fffbeb", color: "#d97706" }}>
          <AlertCircle size={20} />
        </div>
        <div className={dashboardStyles.cardInfo}>
          <span className={dashboardStyles.cardNumber}>{pendientes}</span>
          <span className={dashboardStyles.cardLabel}>Pendientes</span>
        </div>
      </div>

      <div className={dashboardStyles.summaryCard}>
        <div className={dashboardStyles.iconCircle} style={{ background: "#fffbeb", color: "#d97706" }}>
          <AlertCircle size={20} />
        </div>
        <div className={dashboardStyles.cardInfo}>
          <span className={dashboardStyles.cardNumber}>{tareasVencidas}</span>
          <span className={dashboardStyles.cardLabel}>Tareas Vencidas</span>
        </div>
      </div>

      <div className={dashboardStyles.summaryCard}>
        <div className={dashboardStyles.iconCircle} style={{ background: "#fffbeb", color: "#d97706" }}>
          <AlertCircle size={20} />
        </div>
        <div className={dashboardStyles.cardInfo}>
          <span className={dashboardStyles.cardNumber}>{proximasVencer}</span>
          <span className={dashboardStyles.cardLabel}>Tareas Proximas a Vencer</span>
        </div>
      </div>
    </div>

    {/* PESTAÑAS DE SELECCIÓN */}
    <div className={reportStyles.tabContainer}>
      <button
        onClick={() => setActiveTab("estados")}
        className={`${reportStyles.tabButton} ${activeTab === "estados" ? reportStyles.active : ""}`}
      >
        <Clock size={16} />
        Por Estado
      </button>
      <button
        onClick={() => setActiveTab("usuarios")}
        className={`${reportStyles.tabButton} ${activeTab === "usuarios" ? reportStyles.active : ""}`}
      >
        <Users size={16} />
        Por Usuario
      </button>
      <button
        onClick={() => setActiveTab("categorias")}
        className={`${reportStyles.tabButton} ${activeTab === "categorias" ? reportStyles.active : ""}`}
      >
        <Tag size={16} />
        Por Categoría
      </button>
      <button
        onClick={() => setActiveTab("tareasVencidas")}
        className={`${reportStyles.tabButton} ${activeTab === "tareasVencidas" ? reportStyles.active : ""}`}
      >
        <Tag size={16} />
        Por Tareas Vencidas
      </button>
      <button
        onClick={() => setActiveTab("proximasVencer")}
        className={`${reportStyles.tabButton} ${activeTab === "proximasVencer" ? reportStyles.active : ""}`}
      >
        <Tag size={16} />
        Por Tareas proximas a Vencer
      </button>
    </div>

    {/* CONTENEDOR DE TABLAS ELEGANTES */}
    <section className={reportStyles.tableCard}>
      {activeTab === "estados" && (
        <table className={reportStyles.premiumTable}>
          <thead>
            <tr>
              <th>Estado</th>
              <th style={{ textAlign: "center" }}>Cantidad</th>
              <th style={{ textAlign: "right" }}>Proporción</th>
            </tr>
          </thead>
          <tbody>
            {getReporteEstados().map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}`
                      }}
                    />
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.nombre}</span>
                  </div>
                </td>
                <td style={{ textAlign: "center", fontWeight: 800, color: "#334155", fontSize: "1.05rem" }}>{item.cantidad}</td>
                <td style={{ textAlign: "right" }}>
                  <div className={reportStyles.percentageWrapper}>
                    <span className={reportStyles.percentageText}>{item.porcentaje}%</span>
                    <div className={reportStyles.percentageTrack}>
                      <div
                        className={reportStyles.percentageFill}
                        style={{ width: `${item.porcentaje}%`, background: item.color }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "usuarios" && (
        <table className={reportStyles.premiumTable}>
          <thead>
            <tr>
              <th>Usuario / Responsable</th>
              <th style={{ textAlign: "center" }}>Asignaciones</th>
              <th>Desglose de Estados</th>
            </tr>
          </thead>
          <tbody>
            {getReporteUsuarios().length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  No hay usuarios registrados en el sistema.
                </td>
              </tr>
            ) : (
              getReporteUsuarios().map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className={reportStyles.userInfo}>
                      <span className={reportStyles.userName}>{item.nombre}</span>
                      <span className={reportStyles.userHandle}>@{item.username}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: "#334155", fontSize: "1.05rem" }}>{item.total}</td>
                  <td>
                    <div className={reportStyles.badgeGroup}>
                      <span className={`${reportStyles.statusBadge} ${reportStyles.pending}`}>
                        <AlertCircle size={12} />
                        {item.pending} pendientes
                      </span>
                      <span className={`${reportStyles.statusBadge} ${reportStyles.progress}`}>
                        <Clock size={12} />
                        {item.in_progress} en progreso
                      </span>
                      <span className={`${reportStyles.statusBadge} ${reportStyles.completed}`}>
                        <CheckCircle size={12} />
                        {item.completed} completadas
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {activeTab === "categorias" && (
        <table className={reportStyles.premiumTable}>
          <thead>
            <tr>
              <th>Categoría / Proyecto</th>
              <th>Descripción</th>
              <th style={{ textAlign: "center" }}>Total Tareas</th>
              <th>Desglose de Estados</th>
            </tr>
          </thead>
          <tbody>
            {getReporteCategorias().length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                  No hay categorías creadas con tareas asignadas.
                </td>
              </tr>
            ) : (
              getReporteCategorias().map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.nombre}</span>
                  </td>
                  <td>
                    <span style={{ color: "#64748b", fontSize: "0.85rem", maxWidth: "240px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.descripcion}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: "#334155", fontSize: "1.05rem" }}>{item.total}</td>
                  <td>
                    <div className={reportStyles.badgeGroup}>
                      <span className={`${reportStyles.statusBadge} ${reportStyles.pending}`}>
                        <AlertCircle size={12} />
                        {item.pending} pendientes
                      </span>
                      <span className={`${reportStyles.statusBadge} ${reportStyles.progress}`}>
                        <Clock size={12} />
                        {item.in_progress} en progreso
                      </span>
                      <span className={`${reportStyles.statusBadge} ${reportStyles.completed}`}>
                        <CheckCircle size={12} />
                        {item.completed} completadas
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {activeTab === "tareasVencidas" && (
        <table className={reportStyles.premiumTable}>
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Responsable</th>
              <th>Categoría</th>
              <th>Fecha Límite</th>
            </tr>
          </thead>

          <tbody>
            {getReporteTareasVencidas().length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#64748b"
                  }}
                >
                  No existen tareas vencidas pendientes.
                </td>
              </tr>
            ) : (
              getReporteTareasVencidas().map((tarea) => (
                <tr key={tarea._id}>
                  <td style={{ color: "#1e293b", fontWeight: 700 }}>
                    {tarea.title}</td>
                  <td style={{ color: "#1e293b", fontWeight: 700 }}>
                    {tarea.assignedTo?.nombre
                      ? `${tarea.assignedTo.nombre} ${tarea.assignedTo.apellido || ""}`
                      : tarea.assignedTo?.username || "-"}
                  </td>

                  <td style={{ color: "#1e293b", fontWeight: 700 }}>
                    {tarea.categoria?.nombre || "-"}</td>

                  <td style={{ color: "#dc2626", fontWeight: 700 }}>
                    {parseLocalDate(tarea.dueDate)?.toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {activeTab === "proximasVencer" && (
        <table className={reportStyles.premiumTable}>
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Responsable</th>
              <th>Categoría</th>
              <th>Fecha Límite</th>
            </tr>
          </thead>

          <tbody>
            {getReporteProximasVencer().length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#64748b"
                  }}
                >
                  No existen tareas próximas a vencer.
                </td>
              </tr>
            ) : (
              getReporteProximasVencer().map((tarea) => (
                <tr key={tarea._id}>
                  <td style={{ color: "#1e293b", fontWeight: 700 }}>
                    {tarea.title}</td>

                  <td style={{ color: "#1e293b", fontWeight: 700 }}>
                    {tarea.assignedTo?.nombre
                      ? `${tarea.assignedTo.nombre} ${tarea.assignedTo.apellido || ""}`
                      : tarea.assignedTo?.username || "-"}
                  </td>

                  <td style={{ color: "#1e293b", fontWeight: 700 }}>
                    {tarea.categoria?.nombre || "-"}</td>

                  <td style={{ color: "#f59e0b", fontWeight: 700 }}>
                    {parseLocalDate(tarea.dueDate)?.toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </section>
  </div>
);
}
