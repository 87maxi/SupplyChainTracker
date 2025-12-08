"use client";

import { ethers } from 'ethers';
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
  // Use ethers.keccak256 to generate a proper bytes32 hash
  return ethers.keccak256(ethers.toUtf8Bytes(text));
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
    '0xbe0c84bfff967b2deb88bd0540d4a796d0ebfdcb72262ced26f1892b419e6457': 'Fabricante',
    '0x49c0376dc7caa3eab0c186e9bc20bf968b0724fea74a37706c35f59bc5d8b15b': 'Auditor HW',
    '0xeeb4ddf6a0e2f06cb86713282a0b88ee789709e92a08b9e9b4ce816bbb13fcaf': 'Técnico SW',
    '0xa8f5858ea94a9ede7bc5dd04119dcc24b3b02a20be15d673993d8b6c2a901ef9': 'Escuela'
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