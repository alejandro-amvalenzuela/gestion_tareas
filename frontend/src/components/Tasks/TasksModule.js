"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Pencil,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layout,
  X,
  Loader2,
  Pen,
  LogOut,
  Eye, MessageCircle
} from "lucide-react";
import styles from "./TasksModule.module.css";
import { tareasService } from "@/services/tareasService";
import { authService } from "@/services/authService";
import { usersService } from "@/services/usersService";
import { categoriaService } from "@/services/categoriaService";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/Shared/CustomSelect";
import CustomDatePicker from "@/components/Shared/CustomDatePicker";

// Función auxiliar para parsear fechas evitando desajustes de zona horaria (UTC vs Local)
const parseLocalDate = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  // Para fechas guardadas en UTC medianoche en la DB, extraemos componentes UTC para evitar desajustes locales
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export default function TasksModule() {
  const router = useRouter();
  const user = authService.getCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Estado del formulario
  const initialFormData = {
    title: "",
    description: "",
    categoria: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
    dueDate: ""
  };

  const openCommentsModal = async (task) => {
    setActiveTask(task);
    setIsCommentsModalOpen(true);
    setNuevoComentario("");
    setCommentsLoading(true);

    try {
      const data = await tareasService.getComentarios(task._id);
      setComentarios(data);
    } catch (err) {
      console.error("Error cargando comentarios", err);
      setComentarios([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!nuevoComentario.trim() || !activeTask) return;

    try {
      await tareasService.addComentario(activeTask._id, nuevoComentario);

      setNuevoComentario("");

      const data = await tareasService.getComentarios(activeTask._id);
      setComentarios(data);
    } catch (err) {
      console.error("Error agregando comentario", err);
    }
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleCreateClick = () => {
    setFormData(initialFormData);
    setEditingTask(null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchTasks();
    fetchAuxData();
  }, []);

  const fetchAuxData = async () => {
    try {
      const [cats, users] = await Promise.all([
        categoriaService.getCategorias(),
        usersService.getUsers()
      ]);
      setCategorias(cats);
      // Filtrar solo usuarios de tipo "usuario"
      setAvailableUsers(users.filter(u => u.rol === "usuario"));
    } catch (err) {
      console.error("Error al cargar datos auxiliares", err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tareasService.getTareas();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar las tareas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.categoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoria) {
      setErrorMsg("La categoría es obligatoria");
      return;
    }
    if (!formData.assignedTo) {
      setErrorMsg("El responsable es obligatorio");
      return;
    }
    try {
      const taskToSave = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : []
      };

      await tareasService.createTarea(taskToSave);
      await fetchTasks();
      setIsModalOpen(false);
      setFormData(initialFormData);
      setErrorMsg("");
    } catch (err) {
      const errMsg = err.response && err.response.data && err.response.data.mensaje
        ? err.response.data.mensaje
        : (err.message || "Error al crear la tarea");
      setErrorMsg(errMsg);
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await tareasService.deleteTarea(taskToDelete._id);
      setTasks(tasks.filter(t => t._id !== taskToDelete._id));
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      alert("Error al eliminar la tarea");
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);

    let formattedDate = "";

    if (task.dueDate) {
      const date = new Date(task.dueDate);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      formattedDate = `${year}-${month}-${day}`;
    }

    setFormData({
      title: task.title || "",
      description: task.description || "",
      categoria: task.categoria?._id || "",
      assignedTo: task.assignedTo?._id || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      dueDate: formattedDate
    });

    setErrorMsg("");
    setIsEditModalOpen(true);
  };

  const handleViewClick = (task) => {
    setSelectedTaskDetails(task);
    setIsDetailModalOpen(true);
  };

  const validateAlphaNumeric = (value) => {
    // Permite letras (incluyendo acentos y ñ/Ñ), números, espacios y comas
    // No permite caracteres especiales como @, #, $, %, etc.
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s,]*$/;
    return regex.test(value);
  };

  const handleInputValidation = (field, value) => {
    if (value === "" || validateAlphaNumeric(value)) {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingTask) return;

    if (!formData.categoria) {
      setErrorMsg("La categoría es obligatoria");
      return;
    }
    if (!formData.assignedTo) {
      setErrorMsg("El responsable es obligatorio");
      return;
    }

    try {
      const taskToUpdate = {
        ...formData
      };

      await tareasService.updateTarea(editingTask._id, taskToUpdate);

      await fetchTasks();

      setIsEditModalOpen(false);
      setEditingTask(null);
      setErrorMsg("");
      setFormData(initialFormData);
    } catch (err) {
      console.error(err);
      const errMsg = err.response && err.response.data && err.response.data.mensaje
        ? err.response.data.mensaje
        : (err.message || "Error al actualizar la tarea");
      setErrorMsg(errMsg);
    }
  };

  const toggleStatus = async (task) => {
    if (task.status === "completed" && user?.rol !== "administrador") {
      alert("No tienes permiso para reabrir esta tarea");
      return;
    }
    try {
      const nextStatus = {
        "pending": "in_progress",
        "in_progress": "completed",
        "completed": "pending"
      };
      const newStatus = nextStatus[task.status];
      await tareasService.updateTarea(task._id, { status: newStatus });
      fetchTasks();
    } catch (err) {
      const errMsg = err.response && err.response.data && err.response.data.mensaje
        ? err.response.data.mensaje
        : "Error al actualizar el estado";
      alert(errMsg);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high": return <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}>Alta</span>;
      case "medium": return <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>Media</span>;
      case "low": return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Baja</span>;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Pendiente</span>;
      case "in_progress": return <span style={{ color: 'var(--color-blue)', fontWeight: 500 }}>En progreso</span>;
      case "completed": return <span style={{ color: 'var(--color-green)', fontWeight: 500 }}>Completada</span>;
      default: return null;
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    pending: tasks.filter(t => t.status === "pending").length,
  };

  const handleDateValidation = (value) => {
    if (!value) {
      setFormData({
        ...formData,
        dueDate: ""
      });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = value.split("-");
    const selectedDate = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );

    if (selectedDate >= today) {
      setFormData({
        ...formData,
        dueDate: value
      });
    } else {
      alert("La fecha límite no puede ser anterior a la fecha actual.");
    }
  };

  return (
    <div className={styles.moduleContainer}>
      {/* TARJETAS DE RESUMEN */}
      <section className={styles.summaryGrid} style={{ marginBottom: '2rem' }}>
        <div className={styles.summaryCard}>
          <div className={`${styles.iconCircle}`} style={{ background: 'var(--color-blue-soft)', color: 'var(--color-blue)' }}>
            <Layout size={24} />
          </div>
          <div className={styles.cardInfo}>
            <span className={styles.cardNumber}>{stats.total}</span>
            <span className={styles.cardLabel}>Total tareas</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.iconCircle}`} style={{ background: 'var(--color-green-soft)', color: 'var(--color-green)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.cardInfo}>
            <span className={styles.cardNumber}>{stats.completed}</span>
            <span className={styles.cardLabel}>Completadas</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.iconCircle}`} style={{ background: 'var(--color-orange-soft)', color: 'var(--color-orange)' }}>
            <Clock size={24} />
          </div>
          <div className={styles.cardInfo}>
            <span className={styles.cardNumber}>{stats.inProgress}</span>
            <span className={styles.cardLabel}>En progreso</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.iconCircle}`} style={{ background: 'var(--color-purple-soft)', color: 'var(--color-purple)' }}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.cardInfo}>
            <span className={styles.cardNumber}>{stats.pending}</span>
            <span className={styles.cardLabel}>Pendientes</span>
          </div>
        </div>
      </section>

      {/* BUSCADOR Y ACCIONES INTEGRADOS */}
      <section className={styles.tableHeader}>
        <div className={styles.tableTitle}>
          <h3>Listado de Tareas</h3>
          <p>{filteredTasks.length} tareas encontradas</p>
        </div>

        <div className={styles.tableActions}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {user?.rol === "administrador" && (
            <button className={styles.btnPrimary} onClick={handleCreateClick}>
              <Plus size={18} />
              <span>Nueva Tarea</span>
            </button>
          )}
        </div>
      </section>

      {/* TABLA DE TAREAS */}
      <section className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p>Cargando tareas...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'red' }}>
            <p>{error}</p>
            <button onClick={fetchTasks} style={{ marginTop: '1rem', textDecoration: 'underline' }}>Reintentar</button>
          </div>
        ) : (
          <table className={styles.taskTable}>
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Categoría / Proyecto</th>
                {user?.rol === "administrador" ? <th>Asignado</th> : <th>Asignado por</th>}
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha límite</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {searchTerm ? "No se encontraron tareas que coincidan con la búsqueda." : "No hay tareas registradas. Empieza creando una nueva."}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const localDueDate = parseLocalDate(task.dueDate);
                  const isOverdue = localDueDate && localDueDate < today && task.status !== "completed";

                  return (
                    <tr key={task._id} className={`${styles.rowHover} ${isOverdue ? styles.rowOverdue : ''}`}>
                      <td>
                        <div className={styles.taskCell}>
                          <span className={styles.taskTitle} style={{ textDecoration: task.status === "completed" ? "line-through" : "none", color: task.status === "completed" ? "var(--text-muted)" : "inherit" }}>
                            {task.title}
                          </span>
                          <span className={styles.taskDesc}>{task.description}</span>
                        </div>
                      </td>
                    <td>
                      <span style={{ color: task.categoria?.color || 'inherit', fontWeight: 600, fontSize: '0.85rem' }}>
                        {task.categoria?.nombre || "Sin categoría"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.avatarWrapper}>
                        {user?.rol === "administrador" ? (
                          <span>{task.assignedTo ? `${task.assignedTo.nombre} ${task.assignedTo.apellido}` : "Sin asignar"}</span>
                        ) : (
                          <span>{task.user ? `${task.user.nombre} ${task.user.apellido}` : "Sistema"}</span>
                        )}
                      </div>
                    </td>
                    <td>{getPriorityBadge(task.priority)}</td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{
                          color: isOverdue ? '#ef4444' : 'var(--text-secondary)',
                          fontWeight: isOverdue ? 600 : 'normal'
                        }}>
                          {task.dueDate ? parseLocalDate(task.dueDate).toLocaleDateString() : "S/F"}
                        </span>
                        {isOverdue && <AlertCircle size={14} color="#ef4444" title="Plazo excedido" />}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {task.status === "pending" && (
                          <button
                            className={`${styles.statusTextBtn} ${styles.editBtn}`}
                            onClick={() => toggleStatus(task)}
                          >
                            Iniciar
                          </button>
                        )}
                        {task.status === "in_progress" && (
                          <button
                            className={`${styles.statusTextBtn} ${styles.completeBtn}`}
                            onClick={() => toggleStatus(task)}
                          >
                            Finalizar
                          </button>
                        )}
                        {task.status === "completed" && user?.rol === "administrador" && (
                          <button
                            className={`${styles.statusTextBtn} ${styles.moreBtn}`}
                            onClick={() => toggleStatus(task)}
                          >
                            Reabrir
                          </button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => handleViewClick(task)} title="Ver Detalle"><Eye size={16} /></button>
                        {user?.rol === "administrador" && (
                          <>
                            <button className={`${styles.actionBtn} ${styles.edit2Btn}`} onClick={() => handleEditClick(task)} title="Editar"><Pencil size={16} /></button>
                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteClick(task)} title="Eliminar"><Trash2 size={16} /></button>
                          </>
                        )}
                        {task.status === "completed" ? (
                            <button
                              className={`${styles.actionBtn} ${styles.commentBtn}`}
                              title="Comentarios deshabilitados (tarea completada)"
                              disabled
                              style={{ opacity: 0.3, cursor: "not-allowed" }}
                            >
                              <MessageCircle size={16} />
                            </button>
                          ) : (
                            <button
                              className={`${styles.actionBtn} ${styles.commentBtn}`}
                              onClick={() => openCommentsModal(task)}
                              title="Comentarios"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}  
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        )}
      </section>

      {/* MODAL DE CREACIÓN DE TAREA */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Nueva Tarea</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              {errorMsg && (
                <div className={`${styles.errorMessage} ${styles.fieldFull}`}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                <label>Título de la Tarea</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ej: Revisar informes mensuales..."
                  className={styles.formInput}
                  value={formData.title}
                  onChange={(e) => handleInputValidation("title", e.target.value)}
                />
                <span className={styles.characterCount}>{formData.title.length}/100</span>
              </div>

              <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                <label>Descripción (Opcional)</label>
                <textarea
                  maxLength={500}
                  placeholder="Añade detalles relevantes..."
                  className={styles.formTextarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
                <span className={styles.characterCount}>{formData.description.length}/500</span>
              </div>

              <div className={styles.formGroup}>
                <CustomSelect 
                  label="Categoría"
                  placeholder="Seleccionar categoría"
                  options={categorias.map(c => ({ value: c._id, label: c.nombre, color: c.color }))}
                  value={formData.categoria}
                  onChange={(val) => setFormData({ ...formData, categoria: val })}
                />
              </div>

              <div className={styles.formGroup}>
                <CustomSelect 
                  label="Asignado a"
                  placeholder="Seleccionar responsable"
                  options={availableUsers.map(u => ({ value: u._id, label: `${u.nombre} ${u.apellido}` }))}
                  value={formData.assignedTo}
                  onChange={(val) => setFormData({ ...formData, assignedTo: val })}
                />
              </div>

              <div className={styles.formGroup}>
                <CustomSelect 
                  label="Prioridad"
                  options={[
                    { value: "low", label: "Baja" },
                    { value: "medium", label: "Media" },
                    { value: "high", label: "Alta" }
                  ]}
                  value={formData.priority}
                  onChange={(val) => setFormData({ ...formData, priority: val })}
                />
              </div>

              <div className={styles.formGroup}>
                <CustomDatePicker 
                  label="Fecha Límite"
                  placeholder="Seleccionar fecha"
                  value={formData.dueDate}
                  onChange={handleDateValidation}
                />
              </div>


              <div className={`${styles.modalFooter} ${styles.fieldFull}`}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>Cerrar</button>
                <button type="submit" className={styles.btnPrimary}>Crear Tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
          <div className={`${styles.modalContent} ${styles.modalConfirm}`} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
              <AlertCircle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2>¿Eliminar tarea?</h2>
            <p>
              Estás a punto de eliminar la tarea <strong>"{taskToDelete?.title}"</strong>. Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE TAREA */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Editar Tarea</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTask(null);
                }}
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleUpdate}>
              {errorMsg && (
                <div className={`${styles.errorMessage} ${styles.fieldFull}`}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                <label>Título de la Tarea</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Ej: Revisar informes mensuales..."
                  className={styles.formInput}
                  value={formData.title}
                  onChange={(e) => handleInputValidation("title", e.target.value)}
                />
                <span className={styles.characterCount}>{formData.title.length}/100</span>
              </div>

              <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                <label>Descripción (Opcional)</label>
                <textarea
                  maxLength={500}
                  placeholder="Añade detalles relevantes..."
                  className={styles.formTextarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
                <span className={styles.characterCount}>{formData.description.length}/500</span>
              </div>

              <div className={styles.formGroup}>
                <CustomSelect 
                  label="Categoría"
                  placeholder="Seleccionar categoría"
                  options={categorias.map(c => ({ value: c._id, label: c.nombre, color: c.color }))}
                  value={formData.categoria}
                  onChange={(val) => setFormData({ ...formData, categoria: val })}
                />
              </div>

              <div className={styles.formGroup}>
                <CustomSelect 
                  label="Asignado a"
                  placeholder="Seleccionar responsable"
                  options={availableUsers.map(u => ({ value: u._id, label: `${u.nombre} ${u.apellido}` }))}
                  value={formData.assignedTo}
                  onChange={(val) => setFormData({ ...formData, assignedTo: val })}
                />
              </div>

              <div className={styles.formGroup}>
                <CustomSelect 
                  label="Prioridad"
                  options={[
                    { value: "low", label: "Baja" },
                    { value: "medium", label: "Media" },
                    { value: "high", label: "Alta" }
                  ]}
                  value={formData.priority}
                  onChange={(val) => setFormData({ ...formData, priority: val })}
                />
              </div>

              <div className={styles.formGroup}>
                <CustomDatePicker 
                  label="Fecha Límite"
                  placeholder="Seleccionar fecha"
                  value={formData.dueDate}
                  onChange={handleDateValidation}
                />
              </div>


              <div className={`${styles.modalFooter} ${styles.fieldFull}`}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTask(null);
                  }}
                >
                  Cerrar
                </button>

                <button type="submit" className={styles.btnPrimary}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE TAREA */}
      {isDetailModalOpen && selectedTaskDetails && (
        <div className={styles.modalOverlay} onClick={() => { setIsDetailModalOpen(false); setSelectedTaskDetails(null); }}>
          <div className={`${styles.modalContent} ${styles.modalDetail}`} onClick={(e) => e.stopPropagation()}>
            {/* Cabecera del modal */}
            <div className={styles.modalHeader} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: 'var(--color-blue-soft)', 
                  color: 'var(--color-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Eye size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Detalles de la Tarea</h2>
                </div>
              </div>
              <button onClick={() => { setIsDetailModalOpen(false); setSelectedTaskDetails(null); }} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Detalle */}
            <div className={styles.detailContainer}>
              {/* Título de la tarea */}
              <div className={styles.detailCardPrimary}>
                <span className={styles.detailLabel}>Título de la Tarea</span>
                <h3 className={styles.detailTitleText}>{selectedTaskDetails.title}</h3>
              </div>

              {/* Descripción de la tarea */}
              <div className={styles.detailCardSec}>
                <span className={styles.detailLabel}>Descripción</span>
                <div className={styles.detailDescBox}>
                  {selectedTaskDetails.description ? (
                    <p className={styles.detailDescriptionText}>{selectedTaskDetails.description}</p>
                  ) : (
                    <p className={styles.detailDescriptionText} style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      Sin descripción detallada disponible.
                    </p>
                  )}
                </div>
              </div>

              {/* Grid de Metadatos Compacto y Sin Iconos */}
              <div className={styles.detailMetaGrid}>
                {/* Categoría */}
                <div className={styles.metaItem}>
                  <div className={styles.metaTextWrapper}>
                    <span className={styles.metaLabel}>Categoría</span>
                    <span className={styles.metaValue} style={{ color: selectedTaskDetails.categoria?.color || 'inherit', fontWeight: 600 }}>
                      {selectedTaskDetails.categoria?.nombre || "Sin Categoría"}
                    </span>
                  </div>
                </div>

                {/* Responsable */}
                <div className={styles.metaItem}>
                  <div className={styles.metaTextWrapper}>
                    <span className={styles.metaLabel}>Responsable</span>
                    <span className={styles.metaValue}>
                      {selectedTaskDetails.assignedTo ? `${selectedTaskDetails.assignedTo.nombre} ${selectedTaskDetails.assignedTo.apellido}` : "Sin asignar"}
                    </span>
                  </div>
                </div>

                {/* Prioridad */}
                <div className={styles.metaItem}>
                  <div className={styles.metaTextWrapper}>
                    <span className={styles.metaLabel}>Prioridad</span>
                    <div style={{ marginTop: '0.15rem' }}>
                      {getPriorityBadge(selectedTaskDetails.priority)}
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div className={styles.metaItem}>
                  <div className={styles.metaTextWrapper}>
                    <span className={styles.metaLabel}>Estado</span>
                    <div style={{ marginTop: '0.15rem' }}>
                      {getStatusBadge(selectedTaskDetails.status)}
                    </div>
                  </div>
                </div>

                {/* Fecha Límite */}
                <div className={styles.metaItem}>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const localDueDate = parseLocalDate(selectedTaskDetails.dueDate);
                    const isOverdue = localDueDate && localDueDate < today && selectedTaskDetails.status !== "completed";
                    return (
                      <div className={styles.metaTextWrapper}>
                        <span className={styles.metaLabel}>Fecha Límite</span>
                        <span className={styles.metaValue} style={{ 
                          color: isOverdue ? '#ef4444' : 'var(--text-secondary)',
                          fontWeight: isOverdue ? 700 : 600 
                        }}>
                          {selectedTaskDetails.dueDate ? localDueDate.toLocaleDateString() : "Sin fecha límite"}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Asignador */}
                <div className={styles.metaItem}>
                  <div className={styles.metaTextWrapper}>
                    <span className={styles.metaLabel}>Asignador por</span>
                    <span className={styles.metaValue}>
                      {selectedTaskDetails.user ? `${selectedTaskDetails.user.nombre} ${selectedTaskDetails.user.apellido}` : "Sistema"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.modalFooter} style={{ gridTemplateColumns: '1fr', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button 
                type="button" 
                className={styles.btnSecondary} 
                onClick={() => { setIsDetailModalOpen(false); setSelectedTaskDetails(null); }}
                style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}
      {isCommentsModalOpen && activeTask && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsCommentsModalOpen(false)}
        >
          <div
            className={`${styles.modalContent} ${styles.modalDetail}`}
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                Comentarios
              </h2>

              <button
                onClick={() => setIsCommentsModalOpen(false)}
                style={{ color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* TASK INFO */}
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Nombre de la Tarea
              </span>
              <div style={{ fontWeight: 600 }}>
                {activeTask.title}
              </div>
            </div>

            {/* LISTA DE COMENTARIOS */}
            <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "1rem" }}>
              {commentsLoading ? (
                <p>Cargando comentarios...</p>
              ) : comentarios.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>
                  No hay comentarios aún
                </p>
              ) : (
                comentarios.map((c) => (
                  <div
                    key={c._id}
                    style={{
                      background: "#f6f7f9",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      marginBottom: "0.5rem"
                    }}
                  >
                    <strong>
                      {c.autor?.nombre} {c.autor?.apellido}
                    </strong>
                    <p className={styles.commentText}>{c.texto}</p>
                    <small style={{ color: "var(--text-muted)" }}>
                      {new Date(c.fecha).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>

            {/* INPUT NUEVO COMENTARIO */}
            {user?.rol === "usuario" && (
              <div>
                <textarea
                  value={nuevoComentario}
                  maxLength={500}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  style={{
                    width: "100%",
                    minHeight: "90px",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    resize: "none"
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                  <small style={{ color: "var(--text-muted)" }}>
                    {nuevoComentario.length}/500
                  </small>

                  <button
                    onClick={handleAddComment}
                    className={styles.btnPrimary}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
