INSERT INTO permission_action_catalog (action_key, name, description, is_active) VALUES
('ver', 'Ver', 'Permite la visualización del módulo o recurso', 1),
('crear', 'Crear', 'Permite crear nuevos registros', 1),
('editar', 'Editar', 'Permite modificar registros existentes', 1),
('eliminar', 'Eliminar', 'Permite borrar registros', 1),
('desactivar', 'Desactivar', 'Permite marcar registros como inactivos sin borrarlos', 1),
('generar', 'Generar', 'Permite ejecutar acciones de generación (ej. reportes, facturas)', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);
