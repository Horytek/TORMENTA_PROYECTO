import React from 'react';
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Chip,
	Tooltip,
	Spinner
} from '@heroui/react';
import PropTypes from 'prop-types';
import { LOG_ACTIONS } from '../../../utils/logActions';

const ACTION_STYLES = {
	[LOG_ACTIONS.LOGIN_OK]: { color: 'success', label: 'Ingreso exitoso', duplicateControl: true },
	[LOG_ACTIONS.LOGOUT]: { color: 'warning', label: 'Cierre de sesión', duplicateControl: true },
	[LOG_ACTIONS.LOGIN_FAIL]: { color: 'danger', label: 'Intento fallido', duplicateControl: true },
	[LOG_ACTIONS.USUARIO_BLOQUEAR]: { color: 'danger', label: 'Usuario bloqueado', duplicateControl: false },
	[LOG_ACTIONS.USUARIO_DESBLOQUEAR]: { color: 'success', label: 'Usuario desbloqueado', duplicateControl: false },
	[LOG_ACTIONS.USUARIO_CAMBIAR_CONTRASENA]: { color: 'primary', label: 'Cambio de contraseña', duplicateControl: true },
	[LOG_ACTIONS.VENTA_CREAR]: { color: 'success', label: 'Venta creada', duplicateControl: false },
	[LOG_ACTIONS.VENTA_ANULAR]: { color: 'danger', label: 'Venta anulada', duplicateControl: false },
	[LOG_ACTIONS.COMPROBANTE_EMITIR]: { color: 'primary', label: 'Comprobante emitido', duplicateControl: true },
	[LOG_ACTIONS.SUNAT_ENVIAR]: { color: 'primary', label: 'Enviado a SUNAT', duplicateControl: true },
	[LOG_ACTIONS.SUNAT_ACEPTADA]: { color: 'success', label: 'SUNAT aceptó', duplicateControl: false },
	[LOG_ACTIONS.SUNAT_RECHAZADA]: { color: 'danger', label: 'SUNAT rechazó', duplicateControl: false },
	[LOG_ACTIONS.NOTA_INGRESO_CREAR]: { color: 'success', label: 'Nota de ingreso', duplicateControl: true },
	[LOG_ACTIONS.NOTA_SALIDA_CREAR]: { color: 'warning', label: 'Nota de salida', duplicateControl: true },
	[LOG_ACTIONS.NOTA_ANULAR]: { color: 'danger', label: 'Nota anulada', duplicateControl: false },
	[LOG_ACTIONS.GUIA_CREAR]: { color: 'success', label: 'Guía creada', duplicateControl: false },
	[LOG_ACTIONS.GUIA_ANULAR]: { color: 'danger', label: 'Guía anulada', duplicateControl: false },
	[LOG_ACTIONS.CLIENTE_CREAR]: { color: 'success', label: 'Cliente creado', duplicateControl: true },
	[LOG_ACTIONS.CLIENTE_EDITAR]: { color: 'primary', label: 'Cliente editado', duplicateControl: true },
	[LOG_ACTIONS.PRODUCTO_CAMBIO_PRECIO]: { color: 'warning', label: 'Cambio de precio', duplicateControl: true }
};

const columns = [
	{ name: "FECHA/HORA", uid: "fecha" },
	{ name: "USUARIO", uid: "usuario", align: "center" },
	{ name: "ACCIÓN", uid: "accion", align: "center" },
	{ name: "DESCRIPCIÓN", uid: "descripcion" },
	{ name: "IP", uid: "ip", align: "center" },
];

const TablaLogs = ({ logs, loading }) => {

	const renderCell = (log, columnKey) => {
		switch (columnKey) {
			case "fecha":
				return (
					<div className="flex flex-col">
						<span className="font-bold text-sm text-slate-800 dark:text-slate-100">
							{new Date(log.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
						</span>
						<span className="text-xs text-slate-400 dark:text-slate-500">
							{new Date(log.fecha).toLocaleDateString()}
						</span>
					</div>
				);
			case "usuario":
				return (
					<Chip color="primary" variant="flat" size="sm">
						{log.usua || log.id_usuario || 'Sistema'}
					</Chip>
				);
			case "accion":
				const style = ACTION_STYLES[log.accion] || { color: 'secondary', label: log.accion, duplicateControl: false };
				return (
					<div className="flex items-center justify-center gap-1">
						<Chip color={style.color} variant="flat" size="sm">{style.label}</Chip>
						{style.duplicateControl && (
							<Tooltip content="Control de duplicados activo">
								<span className="text-green-500 text-xs">🛡️</span>
							</Tooltip>
						)}
					</div>
				);
			case "descripcion":
				return (
					<Tooltip content={log.descripcion || '-'}>
						<span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[200px] block">
							{log.descripcion || '-'}
						</span>
					</Tooltip>
				);
			case "ip":
				return (
					<Chip color="default" variant="flat" size="sm">
						{log.ip || '-'}
					</Chip>
				);
			default:
				return null;
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner size="lg" color="primary" />
			</div>
		);
	}

	return (
		<Table
			aria-label="Tabla de logs del sistema"
			removeWrapper
			classNames={{
				base: "max-h-[calc(100vh-450px)] overflow-y-auto",
				table: "min-w-full",
				th: "bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider h-11 first:rounded-l-lg last:rounded-r-lg shadow-none border-b border-slate-200 dark:border-zinc-800",
				td: "py-3 border-b border-slate-100 dark:border-zinc-800 group-data-[first=true]:first:before:rounded-none group-data-[first=true]:last:before:rounded-none",
				tr: "hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors shadow-none",
			}}
		>
			<TableHeader columns={columns}>
				{(column) => (
					<TableColumn key={column.uid} align={column.align || "start"}>
						{column.name}
					</TableColumn>
				)}
			</TableHeader>
			<TableBody items={logs} emptyContent={"Sin resultados"}>
				{(item) => (
					<TableRow key={item.id_log}>
						{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
};

TablaLogs.propTypes = {
	logs: PropTypes.array.isRequired,
	loading: PropTypes.bool
};

export default TablaLogs;
