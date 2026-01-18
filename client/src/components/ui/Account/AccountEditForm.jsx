import { Button, Input, Card, CardBody, Chip, Divider } from "@heroui/react";
import { FileKey, Image as ImageIcon, Shield, Server, Key, Building2, CheckCircle2 } from "lucide-react";

export default function AccountEditForm({ form, loading, onChange, onCert, onLogo, onCancel, onSave }) {
    return (
        <form className="space-y-6" onSubmit={e => { e.preventDefault(); onSave(); }}>
            {/* Sección: Datos de Empresa */}
            <SectionCard
                icon={<Building2 className="w-4 h-4" />}
                title="Datos de la Empresa"
                subtitle="Información básica de la empresa"
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="RUC"
                        name="ruc"
                        value={form.ruc}
                        onChange={onChange}
                        placeholder="20XXXXXXXXXX"
                        classNames={{
                            inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                        }}
                    />
                    <Input
                        label="Razón Social"
                        name="razon_social"
                        value={form.razon_social}
                        onChange={onChange}
                        placeholder="Empresa S.A.C."
                        classNames={{
                            inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                        }}
                    />
                    <Input
                        label="Dirección"
                        name="direccion"
                        value={form.direccion}
                        onChange={onChange}
                        placeholder="Av. Principal 123"
                        classNames={{
                            inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                        }}
                    />

                    {/* Logotipo de la empresa */}
                    <FileUploadBox
                        id="logo"
                        label="Logotipo de la Empresa"
                        description="Imagen PNG o JPG (máx. 500KB)"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={onLogo}
                        icon={<ImageIcon className="w-6 h-6 text-blue-500" />}
                        hasFile={!!form.logoBase64}
                    />
                </div>
            </SectionCard>

            {/* Sección: Configuración SUNAT */}
            <SectionCard
                icon={<Shield className="w-4 h-4" />}
                title="Configuración SUNAT"
                subtitle="Credenciales para facturación electrónica"
                badge="Encriptado"
            >
                <div className="grid grid-cols-1 gap-4">
                    <SelectField
                        label="Entorno"
                        name="environment"
                        value={form.environment}
                        onChange={onChange}
                        options={[["beta", "🧪 Beta (Pruebas)"], ["prod", "🚀 Producción"]]}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Usuario SOL"
                            name="sol_user"
                            value={form.sol_user}
                            onChange={onChange}
                            placeholder="MODDATOS"
                            classNames={{
                                inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                            }}
                        />
                        <Input
                            label="Contraseña SOL"
                            name="sol_pass"
                            type="password"
                            value={form.sol_pass}
                            onChange={onChange}
                            placeholder="••••••••"
                            classNames={{
                                inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                            }}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Sección: Certificado Digital */}
            <SectionCard
                icon={<FileKey className="w-4 h-4" />}
                title="Certificado Digital"
                subtitle="Archivo .p12 para firma electrónica"
            >
                <div className="space-y-4">
                    <Input
                        label="Contraseña del Certificado"
                        name="cert_password"
                        type="password"
                        value={form.cert_password}
                        onChange={onChange}
                        placeholder="••••••••"
                        classNames={{
                            inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                        }}
                    />

                    <FileUploadBox
                        id="certificado"
                        label="Certificado SUNAT"
                        description="Archivo .p12 o .pfx"
                        accept=".pfx,.p12"
                        onChange={onCert}
                        icon={<FileKey className="w-6 h-6 text-blue-500" />}
                        hasFile={!!form.certificadoBase64}
                    />
                </div>
            </SectionCard>

            {/* Sección: GRE (Guías de Remisión) */}
            <SectionCard
                icon={<Server className="w-4 h-4" />}
                title="API GRE (Opcional)"
                subtitle="Para Guías de Remisión Electrónicas"
            >
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Client ID"
                        name="client_id"
                        value={form.client_id}
                        onChange={onChange}
                        placeholder="Obtenido en SUNAT Operaciones en Línea"
                        classNames={{
                            inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                        }}
                    />
                    <Input
                        label="Client Secret"
                        name="client_secret"
                        type="password"
                        value={form.client_secret}
                        onChange={onChange}
                        placeholder="••••••••"
                        classNames={{
                            inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700",
                        }}
                    />
                </div>
            </SectionCard>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-slate-200/50 dark:border-zinc-700/50">
                <Button
                    size="md"
                    variant="flat"
                    onPress={onCancel}
                    className="px-5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                    Cancelar
                </Button>
                <Button
                    size="md"
                    color="success"
                    type="submit"
                    isLoading={loading}
                    className="px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/20"
                >
                    {loading ? 'Guardando...' : '✓ Guardar Configuración'}
                </Button>
            </div>
        </form>
    );
}

// Componente de tarjeta de sección
function SectionCard({ icon, title, subtitle, badge, children }) {
    return (
        <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-700/50 shadow-sm">
            <CardBody className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400">
                        {icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h4>
                            {badge && (
                                <Chip size="sm" variant="flat" className="h-5 text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Key className="w-3 h-3 mr-1" /> {badge}
                                </Chip>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p>
                    </div>
                </div>
                <Divider className="my-2 bg-slate-100 dark:bg-zinc-800" />
                {children}
            </CardBody>
        </Card>
    );
}

// Componente de subida de archivos mejorado
function FileUploadBox({ id, label, description, accept, onChange, icon, hasFile }) {
    return (
        <div className={`
            relative border-2 border-dashed rounded-xl p-4 transition-all duration-200
            ${hasFile
                ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700'
            }
        `}>
            <div className="flex items-center gap-4">
                <div className={`
                    flex items-center justify-center w-12 h-12 rounded-xl
                    ${hasFile
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-slate-100 dark:bg-zinc-800'
                    }
                `}>
                    {hasFile ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-white">{label}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{description}</p>
                    {hasFile && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ Archivo cargado</p>
                    )}
                </div>
            </div>
            <input
                id={id}
                name={id}
                type="file"
                accept={accept}
                onChange={onChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
    );
}

// Componente de selector mejorado
function SelectField({ label, name, value, onChange, options }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
                <option value="">Seleccione...</option>
                {options.map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                ))}
            </select>
        </div>
    );
}
