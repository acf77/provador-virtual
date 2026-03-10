"use client";

import { useState, useEffect, useCallback } from "react";

export interface WardrobeItem {
  id: string;
  dataUrl: string;
  name: string;
  addedAt: string;
}

const GARMENTS_KEY = "wardrobe:garments";
const USER_PHOTO_KEY = "wardrobe:userPhoto";
const LAST_RESULT_KEY = "wardrobe:lastResult";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(dataUrl: string, name: string): File {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], name, { type: mime });
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — silently ignore for MVP
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWardrobe() {
  const [garments, setGarments] = useState<WardrobeItem[]>([]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [lastResult, setLastResultState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setGarments(readStorage<WardrobeItem[]>(GARMENTS_KEY, []));
    setUserPhoto(readStorage<string | null>(USER_PHOTO_KEY, null));
    setLastResultState(readStorage<string | null>(LAST_RESULT_KEY, null));
    setReady(true);
  }, []);

  const addGarment = useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const item: WardrobeItem = {
      id: crypto.randomUUID(),
      dataUrl,
      name: file.name,
      addedAt: new Date().toISOString(),
    };
    setGarments((prev) => {
      const next = [item, ...prev];
      writeStorage(GARMENTS_KEY, next);
      return next;
    });
    return item;
  }, []);

  const removeGarment = useCallback((id: string) => {
    setGarments((prev) => {
      const next = prev.filter((g) => g.id !== id);
      writeStorage(GARMENTS_KEY, next);
      return next;
    });
  }, []);

  const saveUserPhoto = useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setUserPhoto(dataUrl);
    writeStorage(USER_PHOTO_KEY, dataUrl);
    return dataUrl;
  }, []);

  const clearUserPhoto = useCallback(() => {
    setUserPhoto(null);
    writeStorage(USER_PHOTO_KEY, null);
  }, []);

  const saveLastResult = useCallback((url: string) => {
    setLastResultState(url);
    writeStorage(LAST_RESULT_KEY, url);
  }, []);

  const clearAll = useCallback(() => {
    setGarments([]);
    setUserPhoto(null);
    setLastResultState(null);
    localStorage.removeItem(GARMENTS_KEY);
    localStorage.removeItem(USER_PHOTO_KEY);
    localStorage.removeItem(LAST_RESULT_KEY);
  }, []);

  return {
    ready,
    garments,
    userPhoto,
    lastResult,
    addGarment,
    removeGarment,
    saveUserPhoto,
    clearUserPhoto,
    saveLastResult,
    clearAll,
  };
}
