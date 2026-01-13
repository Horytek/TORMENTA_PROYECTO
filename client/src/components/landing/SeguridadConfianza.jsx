import React from "react";
import { SectionShell } from "./ui/SectionShell";
import { GlassCard } from "./ui/GlassCard";
import { motion } from "framer-motion";

export const SeguridadConfianza = () => {
    return (
        <SectionShell id="seguridad-y-confianza">
            <div className="text-center mb-16 md:mb-24">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--premium-muted)]">
                        ARQUITECTURA & SEGURIDAD
                    </span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                    Diseñado para la confianza.<br />
                    <span className="text-[var(--premium-muted)]">Construido para escalar.</span>
                </h2>
                <p className="text-lg text-[var(--premium-muted)] max-w-2xl mx-auto">
                    Cada acción queda registrada. Cada usuario tiene solo el acceso que necesita.
                    Una estructura de permisos granular que protege tu negocio desde el núcleo.
                </p>
            </div>

            <div className="w-full flex justify-center mb-16 overflow-hidden">
                <div className="flex items-center gap-4 md:gap-8 text-xs font-bold uppercase tracking-widest text-[var(--premium-muted2)]">
                    <span className="text-white border-b border-white pb-1">EMPRESA</span>
                    <span className="w-8 h-px bg-white/10"></span>
                    <span>SUCURSALES</span>
                    <span className="w-8 h-px bg-white/10"></span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded">ROLES</span>
                    <span className="w-8 h-px bg-white/10"></span>
                    <span>USUARIOS</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Col: Roles List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="text-sm font-medium text-[var(--premium-muted)] mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        Roles & Perfiles
                    </div>

                    <GlassCard className="p-5 border-white/20 !bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">Vendedor</h4>
                                <p className="text-xs text-[var(--premium-muted2)]">Acceso limitado a punto de venta y catálogo.</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 opacity-50 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--premium-muted)]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-[var(--premium-muted)] font-bold text-sm">Almacenero</h4>
                                <p className="text-xs text-[var(--premium-muted2)]">Control de stock, ingresos y kardex.</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5 opacity-50 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--premium-muted)]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-[var(--premium-muted)] font-bold text-sm">Admin Global</h4>
                                <p className="text-xs text-[var(--premium-muted2)]">Control total del sistema y usuarios.</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Col: Access Matrix Mockup */}
                <div className="lg:col-span-8">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-white font-bold">Matriz de Acceso</h4>
                        <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-[var(--premium-muted)]">SALES_POLICY</span>
                    </div>

                    <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#060a14] relative">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                        <div className="relative z-10 p-6 space-y-4">
                            {/* Permission Row 1 */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm font-bold text-white">Punto de Venta</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 rounded flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                        CREATE
                                    </span>
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 rounded flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                        READ
                                    </span>
                                </div>
                            </div>

                            {/* Permission Row 2 */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 opacity-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm font-bold text-white">Inventario Global</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 rounded flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                        READ
                                    </span>
                                </div>
                            </div>

                            {/* Permission Row 3 */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-transparent opacity-30">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                    <span className="text-sm font-bold text-[var(--premium-muted)]">Kardex Valorizado</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-[10px] text-[var(--premium-muted2)] flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                        Sin acceso
                                    </span>
                                </div>
                            </div>

                            {/* Permission Row 4 */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm font-bold text-white">Gestión de Clientes</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 rounded flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                        CREATE
                                    </span>
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 rounded flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                        READ
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </SectionShell>
    );
};
