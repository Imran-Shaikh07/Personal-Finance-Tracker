
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://personal-finance-tracker-ana4.onrender.com/api"
).replace(/\/$/, "");

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const { headers = {}, ...otherOptions } = options;

  let response;

  try {
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

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
      `Cannot connect to backend at ${API_URL}. Please check your internet connection or server status.`
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
