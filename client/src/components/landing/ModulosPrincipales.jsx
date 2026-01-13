import React from "react";
import { SectionShell } from "./ui/SectionShell";
import { SectionHeader } from "./ui/SectionHeader";
import { GlassCard } from "./ui/GlassCard";

export const ModulosPrincipales = ({ onOpenModal }) => {
  // Módulos reales del sistema basados en la estructura del proyecto y solicitud del usuario.
  const modulos = [
    {
      category: "Ventas",
      titulo: "Punto de Venta",
      descripcion: "Facturación rápida, control de cajas y múltiples métodos de pago.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 4.5ZM3 4.5v13.5c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6Zm3 3h.008v.008H6V7.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM6 10.5h.008v.008H6v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM6 13.5h.008v.008H6v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
      caracteristicas: [
        "Emisión de Tickets/Facturas",
        "Apertura y Cierre de Caja",
        "Gestión de Vendedores"
      ]
    },
    {
      category: "Logística",
      titulo: "Inventario Global",
      descripcion: "Control total de stock, guía de remisión y movimientos de almacén.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      caracteristicas: [
        "Kardex Físico y Valorizado",
        "Gestión de Marcas y Categorías",
        "Códigos de Barras y QR"
      ]
    },
    {
      category: "Gestión",
      titulo: "Clientes",
      descripcion: "Base de datos centralizada para fidelización y seguimiento comercial.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      caracteristicas: [
        "Historial de Compras",
        "Cuentas Corrientes",
        "Línea de Crédito"
      ]
    },
    {
      category: "Compras",
      titulo: "Proveedores",
      descripcion: "Gestión eficiente de adquisiciones, órdenes de compra y cuentas por pagar.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      caracteristicas: [
        "Registro de Compras",
        "Evaluación de Proveedores",
        "Pagos Programados"
      ]
    },
    {
      category: "Talento",
      titulo: "Empleados",
      descripcion: "Administración de personal, roles, accesos y control de asistencia.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      caracteristicas: [
        "Gestión de Usuarios y Roles",
        "Asignación de Sucursales",
        "Permisos Granulares"
      ]
    },
    {
      category: "Control",
      titulo: "Reportes y BI",
      descripcion: "Tableros de control en tiempo real para la toma de decisiones estratégicas.",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      ),
      caracteristicas: [
        "Reportes de Ventas Detallados",
        "Márgenes de Ganancia",
        "Exportación a Excel/PDF"
      ]
    }
  ];

  return (
    <SectionShell id="modulos">
      <SectionHeader
        title="Módulos del Sistema"
        subtitle="Una suite completa de herramientas diseñadas para operar tu negocio de principio a fin."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modulos.map((modulo, index) => (
          <GlassCard
            key={index}
            className="p-8 group !bg-[#060a14] border-white/5"
          >
            {/* Header: Chip + Dot */}
            <div className="flex justify-between items-center mb-8">
              <span className="px-3 py-1 rounded-[var(--radius-chip)] bg-white/5 border border-white/5 text-[10px] uppercase font-bold tracking-widest text-[var(--premium-muted)]">
                {modulo.category}
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            </div>

            {/* Icon & Title Block */}
            <div className="flex gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-purple-400 shrink-0 group-hover:scale-110 transition-transform duration-300">
                {modulo.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{modulo.titulo}</h3>
                <p className="text-sm text-[var(--premium-muted)] leading-relaxed">
                  {modulo.descripcion}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />

            {/* Feature List */}
            <ul className="space-y-3">
              {modulo.caracteristicas.map((item, i) => (
                <li key={i} className="flex items-center text-sm text-[var(--premium-muted2)] group-hover:text-[var(--premium-muted)] transition-colors">
                  <svg className="w-3.5 h-3.5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </SectionShell>
  );
};
