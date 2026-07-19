const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface GeoLocation {
  id: number;
  country: string;
  province: string | null;
  city: string;
  locationCode: string;
  latitude: number;
  longitude: number;
  timezone: number;
  label: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.message || `请求失败 ${res.status}`);
  }
  return body.data;
}

export function fetchCountries(): Promise<string[]> {
  return getJson("/api/geo/countries");
}

export function fetchProvinces(country: string): Promise<string[]> {
  return getJson(`/api/geo/provinces?country=${encodeURIComponent(country)}`);
}

export function fetchCities(country: string, province?: string): Promise<GeoLocation[]> {
  const params = new URLSearchParams({ country });
  if (province) params.set("province", province);
  return getJson(`/api/geo/cities?${params}`);
}

export function searchLocations(keyword: string, limit = 20): Promise<GeoLocation[]> {
  const q = keyword.trim();
  if (!q) return Promise.resolve([]);
  return getJson(`/api/geo/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}
