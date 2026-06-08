"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  User,
  Shield,
  ShieldAlert,
  X,
  Loader2,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react";
import styles from "../Tasks/TasksModule.module.css";
import { usersService } from "@/services/usersService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import CustomSelect from "../Shared/CustomSelect";

export default function UsersModule() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [manualAssignments, setManualAssignments] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorModalMsg, setErrorModalMsg] = useState("");
  const currentUser = authService.getCurrentUser();

  const initialFormData = {
    nombre: "",
    apellido: "",
    username: "",
    password: "",
    rol: "usuario",
    activo: true
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen || showDeactivateWarning || errorModalMsg) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, isDeleteModalOpen, showDeactivateWarning, errorModalMsg]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar los usuarios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersService.updateUser(editingUser._id, formData);
      } else {
        await usersService.createUser(formData);
      }
      await fetchUsers();
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData(initialFormData);
      setErrorMsg("");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setErrorMsg(err.response.data.mensaje || "Error de validación");
      } else {
        setErrorMsg("Error al guardar el usuario");
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setErrorMsg("");
    setFormData({
      nombre: user.nombre || "",
      apellido: user.apellido || "",
      username: user.username || "",
      password: user.password || "",
      rol: user.rol || "usuario",
      activo: user.activo ?? true
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await usersService.deleteUser(userToDelete._id);
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      const errMsg = err.response && err.response.data && err.response.data.mensaje
        ? err.response.data.mensaje
        : "Error al eliminar el usuario";
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      setErrorModalMsg(errMsg);
    }
  };

  const toggleStatus = async (user) => {
    if (user.activo) {
      try {
        const res = await usersService.getPendingTasks(user._id);
        const count = res.pendingCount || 0;
        const tasks = res.tasks || [];
        setPendingTaskCount(count);
        setPendingTasks(tasks);

        const activeRecipients = users.filter(u => u.activo && u._id !== user._id && u.rol === "usuario");
        const initialAssignments = {};
        if (activeRecipients.length > 0) {
          tasks.forEach(task => {
            initialAssignments[task._id] = activeRecipients[0]._id;
          });
        }
        setManualAssignments(initialAssignments);

        setUserToDeactivate(user);
        setShowDeactivateWarning(true);
      } catch (err) {
        setErrorModalMsg("Error al consultar las tareas pendientes del usuario.");
      }
    } else {
      try {
        await usersService.toggleStatus(user._id);
        fetchUsers();
      } catch (err) {
        setErrorModalMsg("Error al activar el usuario.");
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await usersService.toggleStatus(userToDeactivate._id, manualAssignments);
      setShowDeactivateWarning(false);
      setUserToDeactivate(null);
      setPendingTaskCount(0);
      setPendingTasks([]);
      setManualAssignments({});
      fetchUsers();
    } catch (err) {
      const errMsg = err.response?.data?.mensaje || "Error al desactivar el usuario";
      setShowDeactivateWarning(false);
      setUserToDeactivate(null);
      setPendingTaskCount(0);
      setPendingTasks([]);
      setManualAssignments({});
      setErrorModalMsg(errMsg);
    }
  };

  return (
    <div className={styles.moduleContainer}>
      {/* CABECERA INTEGRADA */}
      <section className={styles.tableHeader}>
        <div className={styles.tableTitle}>
          <h3>Gestión de Usuarios</h3>
          <p>{filteredUsers.length} usuarios registrados</p>
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
          <button className={styles.btnPrimary} onClick={() => { setFormData(initialFormData); setEditingUser(null); setErrorMsg(""); setIsModalOpen(true); }}>
            <Plus size={18} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </section>

      <section className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" />
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <table className={styles.taskTable}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Username</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isCurrentUser = currentUser && currentUser._id === user._id;
                return (
                  <tr key={user._id} className={styles.rowHover}>
                    <td>
                      <div className={styles.taskCell}>
                        <span className={styles.taskTitle}>{user.nombre} {user.apellido}</span>
                      </div>
                    </td>
                    <td>{user.username}</td>
                    <td>
                      <span style={{ 
                        color: user.rol === 'administrador' ? 'var(--color-orange)' : 'var(--color-blue)',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {user.rol}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: user.activo ? 'rgba(36, 184, 32, 1)' : 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className={`${styles.actionBtn} ${user.activo ? styles.deleteBtn : styles.edit2Btn}`} 
                          onClick={() => toggleStatus(user)}
                          title={isCurrentUser ? "No puedes cambiar tu propio estado" : (user.activo ? "Desactivar" : "Activar")}
                          disabled={isCurrentUser}
                          style={isCurrentUser ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                        >
                          {user.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button className={`${styles.actionBtn} ${styles.edit2Btn}`} onClick={() => handleEditClick(user)} title="Editar"><Pencil size={16} /></button>
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                          onClick={() => handleDeleteClick(user)} 
                          title={isCurrentUser ? "No puedes eliminarte a ti mismo" : "Eliminar"}
                          disabled={isCurrentUser}
                          style={isCurrentUser ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* MODAL DE USUARIO */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
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
              <div className={styles.formGroup}>
                <label>Nombre</label>
                <input 
                  type="text" 
                  required 
                  maxLength={50}
                  className={styles.formInput} 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Juan"
                />
                <span className={styles.characterCount}>{formData.nombre.length}/50</span>
              </div>

              <div className={styles.formGroup}>
                <label>Apellido</label>
                <input 
                  type="text" 
                  required 
                  maxLength={50}
                  className={styles.formInput} 
                  value={formData.apellido} 
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})} 
                  placeholder="Ej: Pérez"
                />
                <span className={styles.characterCount}>{formData.apellido.length}/50</span>
              </div>

              <div className={styles.formGroup}>
                <label>Usuario (Username)</label>
                <input 
                  type="text" 
                  required 
                  maxLength={20}
                  minLength={4}
                  className={styles.formInput} 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s/g, "")})} 
                  placeholder="Ej: jperez"
                />
                <span className={styles.characterCount}>{formData.username.length}/20</span>
              </div>

              <div className={styles.formGroup}>
                <label>Contraseña</label>
                <input 
                  type="password" 
                  required 
                  className={styles.formInput} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value.replace(/\s/g, "")})} 
                  placeholder="Contraseña de acceso"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fieldFull}`}>
                <label>Rol del Sistema</label>
                <CustomSelect
                  options={[
                    { value: 'usuario', label: 'Usuario' },
                    { value: 'administrador', label: 'Administrador' }
                  ]}
                  value={formData.rol}
                  onChange={(val) => setFormData({...formData, rol: val})}
                  placeholder="Selecciona un rol"
                />
              </div>

              <div className={`${styles.modalFooter} ${styles.fieldFull}`}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingUser ? "Actualizar" : "Guardar Usuario"}
                </button>
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
            <h2>¿Eliminar usuario?</h2>
            <p>
              Estás a punto de eliminar al usuario <strong>"{userToDelete?.nombre} {userToDelete?.apellido}"</strong>. Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA: DESACTIVACIÓN Y REDISTRIBUCIÓN DE TAREAS */}
      {showDeactivateWarning && (() => {
        const activeRecipients = users.filter(u => u.activo && u._id !== userToDeactivate?._id && u.rol === "usuario");
        const selectOptions = activeRecipients.map(u => ({
          value: u._id,
          label: `${u.nombre} ${u.apellido} (${u.username})`
        }));
        return (
          <div className={styles.modalOverlay} onClick={() => { setShowDeactivateWarning(false); setUserToDeactivate(null); }}>
            <div className={`${styles.modalContent} ${styles.modalConfirm}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '1.25rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fff7ed',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem auto'
              }}>
                <AlertCircle size={24} />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
                ¿Desactivar usuario?
              </h2>
              <p style={{ marginTop: '0.25rem', color: '#475569', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Estás a punto de desactivar al usuario <strong>"{userToDeactivate?.nombre} {userToDeactivate?.apellido}"</strong>.
              </p>
              {pendingTaskCount > 0 ? (
                <>
                  <p style={{ marginTop: '0.25rem', color: '#475569', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    Este usuario tiene{' '}
                    <strong style={{ color: '#f59e0b' }}>{pendingTaskCount} {pendingTaskCount === 1 ? 'tarea activa' : 'tareas activas o en progreso'}</strong>.
                  </p>
                  {activeRecipients.length === 0 ? (
                    <div style={{
                      marginTop: '0.75rem',
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '6px',
                      padding: '0.6rem',
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      textAlign: 'left'
                    }}>
                      <strong>No hay otros usuarios activos en el sistema.</strong> Para poder desactivar a este usuario, primero debes activar a otro miembro del equipo o crear uno nuevo para recibir estas tareas.
                    </div>
                  ) : (
                    <>
                      <p style={{ marginTop: '0.4rem', color: '#475569', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                        Reasigna sus tareas pendientes a otros miembros del equipo:
                      </p>
                      <div style={{ 
                        maxHeight: '180px', 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.5rem', 
                        paddingRight: '0.25rem',
                        marginBottom: '0.5rem',
                        textAlign: 'left'
                      }}>
                        {pendingTasks.map(task => (
                          <div key={task._id} style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '0.4rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}>
                            <span style={{ 
                              fontSize: '0.85rem', 
                              fontWeight: 600, 
                              color: '#1e293b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              textAlign: 'left'
                            }}>
                              {task.title}
                            </span>
                            <div style={{ width: '220px', flexShrink: 0 }}>
                              <CustomSelect
                                options={selectOptions}
                                value={manualAssignments[task._id] || ""}
                                onChange={(val) => setManualAssignments({
                                  ...manualAssignments,
                                  [task._id]: val
                                })}
                                placeholder="Selecciona un responsable"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p style={{ marginTop: '0.25rem', color: '#475569', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  Este usuario no tiene tareas activas asignadas en este momento. La desactivación se realizará directamente.
                </p>
              )}
              <div className={styles.modalFooter} style={{ marginTop: '0.75rem' }}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => { setShowDeactivateWarning(false); setUserToDeactivate(null); }}
                >
                  Cancelar
                </button>
                <button
                  className={`${styles.btnPrimary} ${styles.btnDanger}`}
                  style={{ 
                    background: '#f59e0b', 
                    borderColor: '#d97706',
                    opacity: (pendingTaskCount > 0 && activeRecipients.length === 0) ? 0.5 : 1,
                    cursor: (pendingTaskCount > 0 && activeRecipients.length === 0) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={confirmDeactivate}
                  disabled={pendingTaskCount > 0 && activeRecipients.length === 0}
                >
                  {pendingTaskCount > 0 ? "Confirmar y reasignar" : "Sí, desactivar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE ADVERTENCIA DE INTEGRIDAD */}
      {errorModalMsg && (
        <div className={styles.modalOverlay} onClick={() => setErrorModalMsg("")}>
          <div className={`${styles.modalContent} ${styles.modalConfirm}`} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertCircle size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Operación No Permitida</h2>
            <p style={{ marginTop: '0.5rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {errorModalMsg}
            </p>
            <div className={styles.modalFooter} style={{ gridTemplateColumns: '1fr', marginTop: '1.5rem' }}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setErrorModalMsg("")} 
                style={{ 
                  width: '100%', 
                  background: '#f8fafc', 
                  color: '#475569', 
                  border: '1px solid #cbd5e1', 
                  padding: '0.625rem',
                  fontWeight: 600,
                  fontSize: '0.875rem' 
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
