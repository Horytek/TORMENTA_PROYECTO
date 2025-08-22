import React from 'react';
import { Chip, Tooltip } from '@heroui/react';
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

const TablaLogs = ({ logs, loading }) => {
	return (
		<div className="bg-white rounded-2xl shadow border border-blue-100 p-4">
			{/* Leyenda informativa */}
			
			
			<div className="overflow-auto rounded-2xl">
				<table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
					<thead>
						<tr className="bg-blue-50 text-blue-900 text-[13px] font-bold">
							<th className="py-2 px-2 text-left">Fecha/Hora</th>
							<th className="py-2 px-2 text-center">Usuario</th>
							<th className="py-2 px-2 text-center">Acción</th>
							<th className="py-2 px-2 text-center">Descripción</th>
							<th className="py-2 px-2 text-center">IP</th>
						</tr>
					</thead>
					<tbody>
						{logs.map((l, idx) => (
							<tr
								key={l.id_log}
								className={`transition-colors duration-150 ${idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"} hover:bg-blue-100/60`}
							>
								<td className="py-1.5 px-2 whitespace-nowrap text-left">
									<span className="font-bold text-[13px] block">
										{new Date(l.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
									</span>
									<span className="text-xs text-gray-500 block">
										{new Date(l.fecha).toLocaleDateString()}
									</span>
								</td>
								<td className="py-1.5 px-2 text-center">
									<Chip color="primary" variant="flat" size="sm">{l.usua || l.id_usuario || 'Sistema'}</Chip>
								</td>
								<td className="py-1.5 px-2 text-center">
									{(() => {
										const style = ACTION_STYLES[l.accion] || { color: 'secondary', label: l.accion, duplicateControl: false };
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
									})()}
								</td>
									
								<td className="py-1.5 px-2 text-left max-w-sm truncate" title={l.descripcion}>
									<Tooltip content={l.descripcion || '-'}>{l.descripcion || '-'}</Tooltip>
								</td>
								<td className="py-1.5 px-2 text-center">
									<Chip color="default" variant="flat" size="sm">{l.ip || '-'}</Chip>
								</td>
							</tr>
						))}
						{!loading && !logs.length && (
							<tr>
								<td colSpan={6} className="text-center py-6 text-gray-500">Sin resultados</td>
							</tr>
						)}
						{loading && (
							<tr>
								<td colSpan={6} className="text-center py-6 text-gray-400">Cargando...</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

TablaLogs.propTypes = {
	logs: PropTypes.array.isRequired,
	loading: PropTypes.bool
};

export default TablaLogs;

