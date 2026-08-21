"use client";

import { useEffect, useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "money" | "danger" | "success";
  duration?: number;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

/** Call from anywhere to show a toast */
export function showToast(message: string, type: Toast["type"] = "info", duration = 3000) {
  const toast: Toast = { id: String(++toastId), message, type, duration };
  listeners.forEach((fn) => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev.slice(-4), toast]); // keep max 5
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, toast.duration || 3000);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-slide-in border ${getToastStyle(toast.type)}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function getToastStyle(type: Toast["type"]): string {
  switch (type) {
    case "money":
      return "bg-green-900/90 border-green-600 text-green-200";
    case "danger":
      return "bg-red-900/90 border-red-600 text-red-200";
    case "success":
      return "bg-blue-900/90 border-blue-600 text-blue-200";
    case "info":
    default:
      return "bg-gray-800/90 border-gray-600 text-gray-200";
  }
}
