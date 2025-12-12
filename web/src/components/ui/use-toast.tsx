"use client";

import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function toast({ title, description, variant = "default" }: ToastProps) {
  return variant === 'destructive' ?
    sonnerToast.error(title, { description }) :
    sonnerToast(title, { description });
}

export { SonnerToaster as Toaster };