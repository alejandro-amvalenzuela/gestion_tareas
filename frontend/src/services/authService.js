import { fetchApi } from "./api";

export const authService = {
  login: async (username, password) => {
    try {
      const response = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      
      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  isLoggedIn: () => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("user");
    }
    return false;
  }
};
