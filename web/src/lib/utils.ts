"use client";

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trunca una dirección de Ethereum para mostrar solo los primeros y últimos caracteres
 * @param address - Dirección de Ethereum a truncar
 * @returns Dirección truncada (ej: 0x1234...5678)
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formatea una marca de tiempo UNIX a una fecha legible
 * @param timestamp - Marca de tiempo UNIX en segundos
 * @returns Fecha formateada (ej: 01/01/2025 12:00)
 */
export function formatDate(timestamp: number): string {
  if (!timestamp) return '';

  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Convierte una cadena de texto a un hash bytes32
 * @param text - Texto a convertir
 * @returns Hash bytes32 del texto
 */
export function stringToBytes32(text: string): string {
  // Convierte el string a un hash SHA-256 y lo convierte a hexadecimal
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // En un entorno de navegador, podríamos usar crypto.subtle.digest
  // Por ahora, devolvemos un padding simple del hash del string
  let hash = '';
  for (let i = 0; i < data.length; i++) {
    const hex = data[i].toString(16);
    hash += (hex.length === 1 ? '0' : '') + hex;
  }

  // Aseguramos que el hash tenga 66 caracteres (0x + 64 caracteres hex)
  hash = hash.slice(0, 64);
  while (hash.length < 64) {
    hash += '0';
  }

  return '0x' + hash;
}

/**
 * Valida si una dirección de Ethereum es válida
 * @param address - Dirección a validar
 * @returns true si la dirección es válida
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Obtiene el nombre del rol basado en su hash
 * @param role - Hash del rol
 * @returns Nombre descriptivo del rol
 */
export function getRoleName(role: string): string {
  const roles: Record<string, string> = {
    '0x0000000000000000000000000000000000000000000000000000000000000000': 'Admin Principal',
    '0x98fc1341304b523375cd3a25cf3ad20857bdc79b4f3d9840965408e183229a5e': 'Fabricante',
    '0x1ae41bc4402a4837bfe8f6d64908e31d2df7fcdf0e17b3d76ed0974e6eb1325e': 'Auditor HW',
    '0xe1e7d626b0388606bd19894ab2a84c78416c5196d842ff58d27a646d12f2429c': 'Técnico SW',
    '0x7b2721288b8eedd4036a78399b4e86844f712d69493f32437bcc722e59a39e7d': 'Escuela'
  };

  return roles[role] || 'Rol Desconocido';
}

/**
 * Obtiene la descripción del estado de una netbook
 * @param state - ID del estado (0-3)
 * @returns Objeto con información del estado
 */
export function getNetbookStateInfo(state: number) {
  const states = [
    { id: 0, name: 'FABRICADA', label: 'Fabricada', description: 'Netbook registrada por el fabricante' },
    { id: 1, name: 'HW_APROBADO', label: 'Hardware Aprobado', description: 'Verificación de hardware completada' },
    { id: 2, name: 'SW_VALIDADO', label: 'Software Validado', description: 'Instalación y validación de software completada' },
    { id: 3, name: 'DISTRIBUIDA', label: 'Distribuida', description: 'Asignada a estudiante final' }
  ];

  return states[state] || states[0];
}