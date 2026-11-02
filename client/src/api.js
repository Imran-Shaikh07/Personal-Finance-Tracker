
const API_URL = (
  import.meta.env.VITE_API_URL || "https://personal-finance-tracker-ana4.onrender.com"
).replace(/\/$/, "");

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const { headers = {}, ...otherOptions } = options;

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...otherOptions,
      headers: {
        ...(otherOptions.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend. Make sure your server is running at http://localhost:5000."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}
