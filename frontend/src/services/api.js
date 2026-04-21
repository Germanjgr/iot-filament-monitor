const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  getSensorHistory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/sensor-data${queryString ? "?" + queryString : ""}`);
  },

  getAlerts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/sensor-data/alerts${queryString ? "?" + queryString : ""}`);
  },

  getHealth: () => request("/health"),
};