import { Button, Input } from "@heroui/react";
import { FileKey, Image as ImageIcon } from "lucide-react";
import {
    Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent
} from "@/components/ui/empty";

export default function AccountEditForm({ form, loading, onChange, onCert, onLogo, onCancel, onSave }) {
    return (
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSave(); }}>
            <SelectField label="Plan *" name="plan" value={form.plan} onChange={onChange} options={[["free", "Free"]]} />
            <SelectField
                label="Entorno *"
                name="environment"
                value={form.environment}
                onChange={onChange}
                options={[["beta", "Beta Sunat"], ["produccion", "Producción Sunat"]]}
            />
            <Input label="Usuario SOL" name="sol_user" value={form.sol_user} onChange={onChange} className="w-full" />
            <Input label="Contraseña SOL" name="sol_pass" value={form.sol_pass} onChange={onChange} className="w-full" />
            <Input label="RUC *" name="ruc" value={form.ruc} onChange={onChange} required className="w-full" />
            <Input label="Razón Social *" name="razon_social" value={form.razon_social} onChange={onChange} required className="w-full" />
            <Input label="Dirección *" name="direccion" value={form.direccion} onChange={onChange} required className="w-full" />
            <Input
                label="Contraseña del Certificado *"
                name="cert_password"
                value={form.cert_password}
                onChange={onChange}
                required
                className="w-full"
                placeholder="Contraseña del archivo .pfx/.p12"
            />
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <FileKey className="text-blue-500" />
                    </EmptyMedia>
                    <EmptyTitle>Certificado SUNAT <span className="text-red-500">*</span></EmptyTitle>
                    <EmptyDescription>Archivo PFX/P12 (Base64)</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <input
                        id="certificado"
                        name="certificado"
                        type="file"
                        accept=".pfx,.p12"
                        onChange={onCert}
                        className="w-full mt-2 cursor-pointer"
                        required
                    />
                </EmptyContent>
            </Empty>
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <ImageIcon className="text-blue-500" />
                    </EmptyMedia>
                    <EmptyTitle>Logo SUNAT <span className="text-red-500">*</span></EmptyTitle>
                    <EmptyDescription>PNG (Base64)</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/png"
                        onChange={onLogo}
                        className="w-full mt-2 cursor-pointer"
                        required
                    />
                </EmptyContent>
            </Empty>
            <Input label="Client ID" name="client_id" value={form.client_id} onChange={onChange} className="w-full" />
            <Input label="Client Secret" name="client_secret" value={form.client_secret} onChange={onChange} className="w-full" />
            <div className="flex gap-2 justify-end">
                <Button size="sm" variant="flat" onPress={onCancel}>Cancelar</Button>
                <Button size="sm" color="primary" type="submit" isLoading={loading}>Guardar</Button>
            </div>
        </form>
    );
}

function SelectField({ label, name, value, onChange, options }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                required
                className="w-full rounded-lg border px-3 py-2"
            >
                <option value="">Seleccione</option>
                {options.map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                ))}
            </select>
        </div>
    );
}
