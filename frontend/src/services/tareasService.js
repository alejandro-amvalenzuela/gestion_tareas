import { fetchApi } from "./api";

export const tareasService = {
  getTareas: () => fetchApi("/tareas"),
  
  createTarea: (tarea) => fetchApi("/tareas", {
    method: "POST",
    body: JSON.stringify(tarea),
  }),
  
  updateTarea: (id, tarea) => fetchApi(`/tareas/${id}`, {
    method: "PUT",
    body: JSON.stringify(tarea),
  }),
  
  deleteTarea: (id) => fetchApi(`/tareas/${id}`, {
    method: "DELETE",
  }),

  addComentario: (id, texto) =>
  fetchApi(`/tareas/${id}/comentarios`, {
    method: "POST",
    body: JSON.stringify({ texto }),
  }),

  getComentarios: (id) =>
    fetchApi(`/tareas/${id}/comentarios`)

};
