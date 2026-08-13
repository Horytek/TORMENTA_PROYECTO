import mysql from "mysql2/promise";
import {
  ECOMMERCE_DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../../src/config.js";

/**
 * Roles, permisos y sucursales asignadas por tienda.
 * Uso: ALLOW_REMOTE_MIGRATE=1 npm run db:migrate:ecommerce-rbac
 */

const PERMISOS = [
  ["dashboard.ver", "Dashboard", "ver"],
  ["productos.ver", "Productos", "ver"],
  ["productos.crear", "Productos", "crear"],
  ["productos.editar", "Productos", "editar"],
  ["productos.eliminar", "Productos", "eliminar"],
  ["atributos.ver", "Atributos", "ver"],
  ["atributos.crear", "Atributos", "crear"],
  ["atributos.editar", "Atributos", "editar"],
  ["atributos.eliminar", "Atributos", "eliminar"],
  ["stock.ver", "Stock", "ver"],
  ["inventario.ver", "Inventario", "ver"],
  ["inventario.editar", "Inventario", "editar"],
  ["transferencias.ver", "Transferencias", "ver"],
  ["transferencias.crear", "Transferencias", "crear"],
  ["transferencias.editar", "Transferencias", "editar"],
  ["pedidos.ver", "Pedidos", "ver"],
  ["pedidos.editar", "Pedidos", "editar"],
  ["pedidos.cancelar", "Pedidos", "cancelar"],
  ["pedidos.confirmar", "Pedidos", "confirmar"],
  ["recojo.ver", "Recojo", "ver"],
  ["recojo.escanear", "Recojo", "escanear"],
  ["recojo.confirmar", "Recojo", "confirmar"],
  ["ordenes.ver", "Órdenes", "ver"],
  ["ordenes.editar", "Órdenes", "editar"],
  ["entregas.ver", "Entregas", "ver"],
  ["entregas.editar", "Entregas", "editar"],
  ["resenas.ver", "Reseñas", "ver"],
  ["resenas.editar", "Reseñas", "editar"],
  ["sucursales.ver", "Sucursales", "ver"],
  ["sucursales.crear", "Sucursales", "crear"],
  ["sucursales.editar", "Sucursales", "editar"],
  ["sucursales.eliminar", "Sucursales", "eliminar"],
  ["usuarios.ver", "Usuarios", "ver"],
  ["usuarios.crear", "Usuarios", "crear"],
  ["usuarios.editar", "Usuarios", "editar"],
  ["usuarios.desactivar", "Usuarios", "desactivar"],
  ["roles.ver", "Roles", "ver"],
  ["roles.editar", "Roles", "editar"],
  ["configuracion.ver", "Configuración", "ver"],
  ["configuracion.editar", "Configuración", "editar"],
];

const ROLES = [
  {
    codigo: "administrador",
    nombre: "Administrador",
    es_sistema: 1,
    acceso_global: 1,
    permisos: "ALL",
  },
  {
    codigo: "gerente",
    nombre: "Gerente",
    es_sistema: 1,
    acceso_global: 1,
    permisos: PERMISOS.map((p) => p[0]).filter(
      (c) => !c.startsWith("configuracion.") && c !== "roles.editar"
    ),
  },
  {
    codigo: "encargado_sucursal",
    nombre: "Encargado de sucursal",
    es_sistema: 1,
    acceso_global: 0,
    permisos: [
      "dashboard.ver",
      "productos.ver",
      "stock.ver",
      "inventario.ver",
      "inventario.editar",
      "transferencias.ver",
      "transferencias.crear",
      "pedidos.ver",
      "pedidos.editar",
      "pedidos.confirmar",
      "recojo.ver",
      "recojo.escanear",
      "recojo.confirmar",
      "ordenes.ver",
      "ordenes.editar",
      "resenas.ver",
    ],
  },
  {
    codigo: "vendedor",
    nombre: "Vendedor",
    es_sistema: 1,
    acceso_global: 0,
    permisos: [
      "dashboard.ver",
      "productos.ver",
      "stock.ver",
      "pedidos.ver",
      "pedidos.editar",
      "ordenes.ver",
      "recojo.ver",
    ],
  },
  {
    codigo: "personal_recojo",
    nombre: "Personal de recojo",
    es_sistema: 1,
    acceso_global: 0,
    permisos: ["recojo.ver", "recojo.escanear", "recojo.confirmar", "pedidos.ver"],
  },
  {
    codigo: "consulta_stock",
    nombre: "Consulta de stock",
    es_sistema: 1,
    acceso_global: 0,
    permisos: ["stock.ver", "productos.ver"],
  },
  {
    codigo: "operador_tienda",
    nombre: "Operador de tienda",
    es_sistema: 1,
    acceso_global: 0,
    permisos: [
      "stock.ver",
      "inventario.ver",
      "pedidos.ver",
      "pedidos.editar",
      "pedidos.confirmar",
      "recojo.ver",
      "recojo.escanear",
      "recojo.confirmar",
    ],
  },
];

const ejecutar = async () => {
  if (!HOST || !USER) {
    throw new Error("Falta configurar DB_HOST / DB_USERNAME en .env.");
  }
  if (
    !process.env.ALLOW_REMOTE_MIGRATE &&
    !["localhost", "127.0.0.1", "::1"].includes(String(HOST))
  ) {
    throw new Error(
      "Migración remota cancelada. Usa ALLOW_REMOTE_MIGRATE=1 (Railway / proxy)."
    );
  }

  const cx = await mysql.createConnection({
    host: HOST,
    database: ECOMMERCE_DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 15000,
    multipleStatements: true,
  });

  const tableExists = async (tabla) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla]
    );
    return rows.length > 0;
  };

  const columnExists = async (tabla, col) => {
    const [rows] = await cx.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [ECOMMERCE_DATABASE, tabla, col]
    );
    return rows.length > 0;
  };

  try {
    if (!(await tableExists("ecom_permiso"))) {
      await cx.query(`
        CREATE TABLE ecom_permiso (
          id_permiso INT NOT NULL AUTO_INCREMENT,
          codigo VARCHAR(80) NOT NULL,
          modulo VARCHAR(60) NOT NULL,
          accion VARCHAR(40) NOT NULL,
          PRIMARY KEY (id_permiso),
          UNIQUE KEY uq_ecom_permiso_codigo (codigo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_permiso");
    } else {
      console.log("[omitido] ecom_permiso");
    }

    for (const [codigo, modulo, accion] of PERMISOS) {
      await cx.query(
        `INSERT IGNORE INTO ecom_permiso (codigo, modulo, accion) VALUES (?, ?, ?)`,
        [codigo, modulo, accion]
      );
    }

    if (!(await tableExists("ecom_rol"))) {
      await cx.query(`
        CREATE TABLE ecom_rol (
          id_rol INT NOT NULL AUTO_INCREMENT,
          id_tienda INT NOT NULL,
          codigo VARCHAR(64) NOT NULL,
          nombre VARCHAR(120) NOT NULL,
          es_sistema TINYINT(1) NOT NULL DEFAULT 0,
          acceso_global TINYINT(1) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id_rol),
          UNIQUE KEY uq_ecom_rol_tienda_codigo (id_tienda, codigo),
          CONSTRAINT fk_ecom_rol_tienda
            FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_rol");
    } else {
      console.log("[omitido] ecom_rol");
    }

    if (!(await tableExists("ecom_rol_permiso"))) {
      await cx.query(`
        CREATE TABLE ecom_rol_permiso (
          id_rol INT NOT NULL,
          id_permiso INT NOT NULL,
          PRIMARY KEY (id_rol, id_permiso),
          CONSTRAINT fk_ecom_rp_rol FOREIGN KEY (id_rol) REFERENCES ecom_rol (id_rol) ON DELETE CASCADE,
          CONSTRAINT fk_ecom_rp_perm FOREIGN KEY (id_permiso) REFERENCES ecom_permiso (id_permiso) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_rol_permiso");
    } else {
      console.log("[omitido] ecom_rol_permiso");
    }

    if (!(await tableExists("ecom_usuario_sucursal"))) {
      await cx.query(`
        CREATE TABLE ecom_usuario_sucursal (
          id_usuario INT NOT NULL,
          id_sucursal INT NOT NULL,
          id_tienda INT NOT NULL,
          PRIMARY KEY (id_usuario, id_sucursal),
          KEY idx_eus_tienda (id_tienda),
          CONSTRAINT fk_eus_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
          CONSTRAINT fk_eus_sucursal FOREIGN KEY (id_sucursal) REFERENCES ecom_sucursal (id_sucursal) ON DELETE CASCADE,
          CONSTRAINT fk_eus_tienda FOREIGN KEY (id_tienda) REFERENCES tienda (id_tienda) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("[creado] ecom_usuario_sucursal");
    } else {
      console.log("[omitido] ecom_usuario_sucursal");
    }

    if (await tableExists("usuario")) {
      if (!(await columnExists("usuario", "id_rol"))) {
        await cx.query(`ALTER TABLE usuario ADD COLUMN id_rol INT NULL`);
        console.log("[alter] usuario.id_rol");
      }
      if (!(await columnExists("usuario", "acceso_global"))) {
        await cx.query(
          `ALTER TABLE usuario ADD COLUMN acceso_global TINYINT(1) NOT NULL DEFAULT 1`
        );
        console.log("[alter] usuario.acceso_global");
      }
    }

    const [allPerms] = await cx.query(`SELECT id_permiso, codigo FROM ecom_permiso`);
    const permByCode = new Map(allPerms.map((p) => [p.codigo, p.id_permiso]));

    const [tiendas] = await cx.query(`SELECT id_tienda FROM tienda`);
    for (const t of tiendas) {
      for (const role of ROLES) {
        const [[ex]] = await cx.query(
          `SELECT id_rol FROM ecom_rol WHERE id_tienda = ? AND codigo = ? LIMIT 1`,
          [t.id_tienda, role.codigo]
        );
        let id_rol = ex?.id_rol;
        if (!id_rol) {
          const [ins] = await cx.query(
            `INSERT INTO ecom_rol (id_tienda, codigo, nombre, es_sistema, acceso_global)
             VALUES (?, ?, ?, ?, ?)`,
            [t.id_tienda, role.codigo, role.nombre, role.es_sistema, role.acceso_global]
          );
          id_rol = ins.insertId;
        }
        const codes = role.permisos === "ALL" ? PERMISOS.map((p) => p[0]) : role.permisos;
        for (const code of codes) {
          const id_permiso = permByCode.get(code);
          if (!id_permiso) continue;
          await cx.query(
            `INSERT IGNORE INTO ecom_rol_permiso (id_rol, id_permiso) VALUES (?, ?)`,
            [id_rol, id_permiso]
          );
        }
      }

      const [[adminRol]] = await cx.query(
        `SELECT id_rol FROM ecom_rol WHERE id_tienda = ? AND codigo = 'administrador' LIMIT 1`,
        [t.id_tienda]
      );
      if (adminRol) {
        await cx.query(
          `UPDATE usuario SET id_rol = ?, acceso_global = 1
           WHERE id_tienda = ? AND id_rol IS NULL`,
          [adminRol.id_rol, t.id_tienda]
        );
      }
    }

    console.log("Migración ecommerce_rbac OK");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((err) => {
  console.error(err);
  process.exit(1);
});
