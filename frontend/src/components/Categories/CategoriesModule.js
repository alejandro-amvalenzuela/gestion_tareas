"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Tag,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import styles from "../Tasks/TasksModule.module.css";
import { categoriasService } from "@/services/categoriasService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

const initialFormData = {
  nombre: "",
  descripcion: ""
};

export default function CategoriesModule() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showReassignWarning, setShowReassignWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorModalMsg, setErrorModalMsg] = useState("");
  
  const user = authService.getCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.rol !== "administrador") {
      router.push("/tasks");
      return;
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriasService.getAll();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriasService.update(editingCategory._id, formData);
      } else {
        await categoriasService.create(formData);
      }
      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingCategory(null);
      setErrorMsg("");
      fetchCategories();
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setErrorMsg(err.response.data.mensaje || "Error de validación");
      } else {
        setErrorMsg("Error al guardar la categoría");
      }
    }
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setErrorMsg("");
    setFormData({
      nombre: category.nombre || "",
      descripcion: category.descripcion || ""
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    // Si tiene tareas asignadas y no hemos mostrado la advertencia de reasignación aún
    if (categoryToDelete.tareasCount > 0 && !showReassignWarning) {
      setIsDeleteModalOpen(false);
      setShowReassignWarning(true);
      return;
    }

    try {
      await categoriasService.delete(categoryToDelete._id);
      setIsDeleteModalOpen(false);
      setShowReassignWarning(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      const errMsg = err.response && err.response.data && err.response.data.mensaje
        ? err.response.data.mensaje
        : "Error al eliminar la categoría";
      setIsDeleteModalOpen(false);
      setShowReassignWarning(false);
      setCategoryToDelete(null);
      setErrorModalMsg(errMsg);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.moduleContainer}>
      {/* CABECERA INTEGRADA */}
      <section className={styles.tableHeader}>
        <div className={styles.tableTitle}>
          <h3>Categorías / Proyectos</h3>
          <p>{filteredCategories.length} categorías registradas</p>
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
          <button className={styles.btnPrimary} onClick={() => { setFormData(initialFormData); setEditingCategory(null); setErrorMsg(""); setIsModalOpen(true); }}>
            <Plus size={18} />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </section>

      <section className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Loader2 size={32} className="animate-spin" />
            <p>Cargando categorías...</p>
          </div>
        ) : (
          <table className={styles.taskTable}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style={{ textAlign: 'center' }}>Tareas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron categorías.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat._id} className={styles.rowHover}>
                    <td>
                      <div className={styles.taskCell}>
                        <span className={styles.taskTitle}>{cat.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.taskCell}>
                        <span className={styles.taskDesc}>{cat.descripcion || "-"}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles.badge} style={{ 
                        background: 'rgba(36, 184, 32, 0.1)', 
                        color: 'rgba(36, 184, 32, 1)', 
                        border: '1px solid rgba(36, 184, 32, 0.15)',
                        fontWeight: '700',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.8rem'
                      }}>
                        {cat.tareasCount || 0}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className={`${styles.actionBtn} ${styles.edit2Btn}`} onClick={() => handleEditClick(cat)} title="Editar"><Pencil size={16} /></button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteClick(cat)} title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* MODAL DE CATEGORÍA */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {errorMsg && (
                <div className={styles.errorMessage}>
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
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
                <span className={styles.characterCount}>{formData.nombre.length}/50</span>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  maxLength={200}
                  className={styles.formTextarea}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                ></textarea>
                <span className={styles.characterCount}>{formData.descripcion.length}/200</span>
              </div>


              <div className={styles.modalFooter} style={{ marginTop: '1rem' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingCategory ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => { setIsDeleteModalOpen(false); }}>
          <div className={`${styles.modalContent} ${styles.modalConfirm}`} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
              <AlertCircle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2>¿Eliminar categoría?</h2>
            <p>
              Estás a punto de eliminar la categoría <strong>"{categoryToDelete?.nombre}"</strong>. Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA: REASIGNACIÓN DE TAREAS A "GENERAL" */}
      {showReassignWarning && (
        <div className={styles.modalOverlay} onClick={() => { setShowReassignWarning(false); setCategoryToDelete(null); }}>
          <div className={`${styles.modalContent} ${styles.modalConfirm}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#fff7ed',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertCircle size={30} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
              Esta categoría tiene tareas asignadas
            </h2>
            <p style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
              La categoría <strong>"{categoryToDelete?.nombre}"</strong> tiene{' '}
              <strong style={{ color: '#f59e0b' }}>{categoryToDelete?.tareasCount} {categoryToDelete?.tareasCount === 1 ? 'tarea asignada' : 'tareas asignadas'}</strong>.
            </p>
            <p style={{ marginTop: '0.5rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Si continúas, todas estas tareas serán reasignadas automáticamente a la categoría{' '}
              <strong style={{ color: 'rgba(36, 184, 32, 1)' }}>"General"</strong>. ¿Deseas continuar?
            </p>
            <div className={styles.modalFooter} style={{ marginTop: '1.5rem' }}>
              <button
                className={styles.btnSecondary}
                onClick={() => { setShowReassignWarning(false); setCategoryToDelete(null); }}
              >
                Cancelar
              </button>
              <button
                className={`${styles.btnPrimary} ${styles.btnDanger}`}
                onClick={confirmDelete}
              >
                Sí, eliminar y reasignar
              </button>
            </div>
          </div>
        </div>
      )}

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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Operación No Permitida</h2>
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
