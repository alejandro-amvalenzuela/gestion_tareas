import { fetchApi } from "./api";

export const categoriasService = {
  getAll: async () => {
    return fetchApi("/categorias");
  },

  create: async (categoria) => {
    return fetchApi("/categorias", {
      method: "POST",
      body: JSON.stringify(categoria),
    });
  },

  update: async (id, categoria) => {
    return fetchApi(`/categorias/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoria),
    });
  },

  delete: async (id) => {
    return fetchApi(`/categorias/${id}`, {
      method: "DELETE",
    });
  },
};
