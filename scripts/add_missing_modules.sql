-- =====================================================
-- Script para agregar módulos faltantes en la tabla de permisos
-- Ejecutar en la base de datos para habilitar estos módulos
-- en el sistema de permisos global e individual
-- =====================================================

-- 1. Verificar estructura actual
-- SELECT * FROM modulo ORDER BY id_modulo;

-- =====================================================
-- INSERTAR MÓDULOS FALTANTES
-- =====================================================

-- Nota: Ajusta los id_modulo si ya existen otros módulos con esos IDs
-- Verifica primero con: SELECT MAX(id_modulo) FROM modulo;

-- CONFIGURACIÓN (Módulo padre para Usuarios, Roles, Logs, Negocio)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (8, 'Configuración', '/configuracion', '["ver"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- USUARIOS (CRUD + desactivar usuarios)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (9, 'Usuarios', '/usuarios', '["ver","crear","editar","eliminar","desactivar","generar"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- ROLES Y PERMISOS (CRUD roles + gestión de permisos)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (10, 'Roles y Permisos', '/roles', '["ver","crear","editar","eliminar"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- LOGS DE SISTEMA (Solo lectura)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (11, 'Logs de Sistema', '/logs', '["ver"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- CONFIG. NEGOCIO (Ver y editar configuración de la empresa)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (12, 'Config. Negocio', '/negocio', '["ver","editar"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- NOTA DE ALMACÉN (CRUD + generar documentos)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (13, 'Nota de Almacén', '/nota_almacen', '["ver","crear","editar","eliminar","generar"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- REPORTES (Solo lectura + generar)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (14, 'Reportes', '/reportes', '["ver","generar"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- LIBRO DE VENTAS (Solo lectura + generar)
INSERT INTO modulo (id_modulo, nombre_modulo, ruta, active_actions)
VALUES (15, 'Libro de Ventas', '/libro_ventas', '["ver","generar"]')
ON DUPLICATE KEY UPDATE nombre_modulo = VALUES(nombre_modulo);

-- =====================================================
-- SUBMÓDULOS PARA CONFIGURACIÓN
-- =====================================================

-- Verificar estructura: SELECT * FROM submodulos WHERE id_modulo = 8;

INSERT INTO submodulos (id_submodulo, id_modulo, nombre_sub, ruta, active_actions)
VALUES (20, 8, 'Usuarios', '/configuracion/usuarios', '["ver","crear","editar","eliminar","desactivar","generar"]')
ON DUPLICATE KEY UPDATE nombre_sub = VALUES(nombre_sub);

INSERT INTO submodulos (id_submodulo, id_modulo, nombre_sub, ruta, active_actions)
VALUES (21, 8, 'Roles y Permisos', '/configuracion/roles', '["ver","crear","editar","eliminar"]')
ON DUPLICATE KEY UPDATE nombre_sub = VALUES(nombre_sub);

INSERT INTO submodulos (id_submodulo, id_modulo, nombre_sub, ruta, active_actions)
VALUES (22, 8, 'Logs de Sistema', '/configuracion/logs', '["ver"]')
ON DUPLICATE KEY UPDATE nombre_sub = VALUES(nombre_sub);

INSERT INTO submodulos (id_submodulo, id_modulo, nombre_sub, ruta, active_actions)
VALUES (23, 8, 'Config. Negocio', '/configuracion/negocio', '["ver","editar"]')
ON DUPLICATE KEY UPDATE nombre_sub = VALUES(nombre_sub);

-- =====================================================
-- SUBMÓDULOS ADICIONALES 
-- =====================================================

-- Nota de Almacén como submódulo de Almacén (si aplica)
-- Descomenta si quieres que sea submódulo en lugar de módulo
-- INSERT INTO submodulos (id_submodulo, id_modulo, nombre_sub, ruta, active_actions)
-- VALUES (24, 3, 'Nota de Almacén', '/nota_almacen', '["ver","crear","editar","eliminar","generar"]')
-- ON DUPLICATE KEY UPDATE nombre_sub = VALUES(nombre_sub);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecutar después de los INSERT para verificar:
-- SELECT * FROM modulo ORDER BY id_modulo;
-- SELECT * FROM submodulos ORDER BY id_modulo, id_submodulo;
