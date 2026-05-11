import { fetchApi } from "./api";

export const categoriaService = {
  getCategorias: () => fetchApi("/categorias"),
  createCategoria: (categoria) => fetchApi("/categorias", {
    method: "POST",
    body: JSON.stringify(categoria),
  }),
};
