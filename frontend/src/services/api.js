const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const fetchApi = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.mensaje || "Ocurrió un error en la petición");
  }

  return response.json();
};
