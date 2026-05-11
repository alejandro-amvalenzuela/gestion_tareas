const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const fetchApi = async (endpoint, options = {}) => {
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user ? user._id : "";
  const userRole = user ? user.rol : "";

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      "X-User-Role": userRole,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.mensaje || "Ocurrió un error en la petición");
  }

  return response.json();
};
