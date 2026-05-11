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
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);

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
    } catch (err) {
      alert("Error al guardar el usuario");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
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
      alert("Error al eliminar el usuario");
    }
  };

  const toggleStatus = async (user) => {
    try {
      await usersService.toggleStatus(user._id);
      fetchUsers();
    } catch (err) {
      alert("Error al cambiar el estado");
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
          <button className={styles.btnPrimary} onClick={() => { setFormData(initialFormData); setEditingUser(null); setIsModalOpen(true); }}>
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
              {filteredUsers.map((user) => (
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
                        title={user.activo ? "Desactivar" : "Activar"}
                      >
                        {user.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button className={`${styles.actionBtn} ${styles.edit2Btn}`} onClick={() => handleEditClick(user)} title="Editar"><Pencil size={16} /></button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteClick(user)} title="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <div className={styles.formGroup}>
                <label>Nombre</label>
                <input 
                  type="text" 
                  required 
                  className={styles.formInput} 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Juan"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Apellido</label>
                <input 
                  type="text" 
                  required 
                  className={styles.formInput} 
                  value={formData.apellido} 
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})} 
                  placeholder="Ej: Pérez"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Usuario (Username)</label>
                <input 
                  type="text" 
                  required 
                  className={styles.formInput} 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  placeholder="Ej: jperez"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Contraseña</label>
                <input 
                  type="text" 
                  required 
                  className={styles.formInput} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
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
    </div>
  );
}
