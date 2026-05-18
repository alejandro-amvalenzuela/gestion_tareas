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
  const [errorMsg, setErrorMsg] = useState("");
  
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
    try {
      await categoriasService.delete(categoryToDelete._id);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      alert("Error al eliminar la categoría");
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
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
                      <span className={styles.taskDesc}>{cat.descripcion || "-"}</span>
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
        <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
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
    </div>
  );
}
