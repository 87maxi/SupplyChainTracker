"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '@/lib/contexts/Web3Context';
import { ArrowRight, ShieldCheck, Laptop, School } from 'lucide-react';

export default function LandingPage() {
  const { isConnected, connect } = useWeb3();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Trazabilidad Segura para <br />
            <span className="text-primary">Netbooks Educativas</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Un sistema transparente basado en blockchain para garantizar que cada dispositivo llegue a manos de los estudiantes que lo necesitan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isConnected ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Ingresar al Sistema <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" onClick={connect} className="gap-2">
                Conectar Wallet <ArrowRight className="w-4 h-4" />
              </Button>
            )}
            <Link href="/about">
              <Button variant="outline" size="lg">
                Más Información
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-lg shadow-sm border">
              <div className="p-3 bg-primary/10 rounded-full">
                <Laptop className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Registro Único</h3>
              <p className="text-muted-foreground">
                Cada netbook es registrada en la blockchain con un identificador único e inmutable desde su fabricación.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-lg shadow-sm border">
              <div className="p-3 bg-primary/10 rounded-full">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Auditoría Transparente</h3>
              <p className="text-muted-foreground">
                Procesos de validación de hardware y software certificados por auditores autorizados en la red.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-lg shadow-sm border">
              <div className="p-3 bg-primary/10 rounded-full">
                <School className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Entrega Garantizada</h3>
              <p className="text-muted-foreground">
                Seguimiento completo hasta la entrega final al estudiante en la escuela asignada.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}