import api from './api';
import { DEFAULT_LDCE_BOUNDARY } from '../constants/campus';

const STORAGE_KEY = 'cp_campus_boundary';

export function getCachedBoundary() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
  } catch {}
  return DEFAULT_LDCE_BOUNDARY;
}

export async function loadBoundary() {
  try {
    const { data } = await api.get('/config/boundary');
    if (Array.isArray(data.boundary) && data.boundary.length >= 3) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.boundary));
      return data.boundary;
    }
  } catch {}
  return getCachedBoundary();
}

export async function saveBoundary(boundary) {
  const { data } = await api.put('/config/boundary', { boundary });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.boundary));
  return data.boundary;
}

