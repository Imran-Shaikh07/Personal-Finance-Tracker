
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://personal-finance-tracker-ana4.onrender.com/api"
).replace(/\/$/, "");

export { API_URL };

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const { headers = {}, ...otherOptions } = options;

  // Prevent missing or duplicate slashes
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  let response;

  try {
    response = await fetch(`${API_URL}${normalizedEndpoint}`, {
      ...otherOptions,
      headers: {
        ...(otherOptions.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    console.error("Backend connection error:", error);

    throw new Error(
      `Cannot connect to backend: ${API_URL}`
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
