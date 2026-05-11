import { fetchApi } from "./api";

export const usersService = {
  getUsers: () => fetchApi("/usuarios"),
  
  createUser: (user) => fetchApi("/usuarios", {
    method: "POST",
    body: JSON.stringify(user),
  }),
  
  updateUser: (id, user) => fetchApi(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  }),
  
  deleteUser: (id) => fetchApi(`/usuarios/${id}`, {
    method: "DELETE",
  }),

  toggleStatus: (id) => fetchApi(`/usuarios/${id}/toggle`, {
    method: "PATCH",
  }),
};
