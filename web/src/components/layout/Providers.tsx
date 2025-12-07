"use client";

import { Web3Provider } from '@/lib/contexts/Web3Context';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}