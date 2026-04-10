import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export const WHATSAPP_NUMBER = "47920008427";
export const DEADLINE_DATE = new Date(2026, 4, 8); // 08/05/2026

export function isDeadlinePassed() {
  return new Date() > DEADLINE_DATE;
}
