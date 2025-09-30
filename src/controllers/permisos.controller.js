import { getConnection } from "./../database/database.js";

const getModulosConSubmodulos = async (req, res) => {
    try {
        const connection = await getConnection();
        
        // Verificar si es desarrollador o administrador de empresa
        const nameUser = req.user.nameUser;
        const isDeveloper = nameUser === 'desarrollador';
        const id_tenant = req.id_tenant;
        
        let modulosQuery, submodulosQuery, queryParams;
        
        if (isDeveloper) {
            // Desarrollador ve todos los módulos sin filtro de tenant
            modulosQuery = `SELECT * FROM modulo ORDER BY id_modulo`;
            submodulosQuery = `
                SELECT 
                    s.id_submodulo,
                    s.id_modulo,
                    s.nombre_sub,
                    s.ruta as ruta_submodulo
                FROM submodulos s
                ORDER BY s.id_modulo, s.id_submodulo
            `;
            queryParams = [];
        } else {
            // Administrador de empresa ve solo sus módulos del tenant
            modulosQuery = `SELECT * FROM modulo WHERE id_tenant = ? ORDER BY id_modulo`;
            submodulosQuery = `
                SELECT 
                    s.id_submodulo,
                    s.id_modulo,
                    s.nombre_sub,
                    s.ruta as ruta_submodulo
                FROM submodulos s
                WHERE s.id_tenant = ?
                ORDER BY s.id_modulo, s.id_submodulo
            `;
            queryParams = [id_tenant];
        }
        
        const [modulos] = await connection.query(modulosQuery, queryParams);
        const [submodulos] = await connection.query(submodulosQuery, queryParams);
        
        const modulosConSubmodulos = modulos.map(modulo => {
            const moduloSubmodulos = submodulos.filter(
                submodulo => submodulo.id_modulo === modulo.id_modulo
            );
            
            return {
                id: modulo.id_modulo,
                nombre: modulo.nombre_modulo,
                ruta: modulo.ruta,
                expandible: moduloSubmodulos.length > 0,
                submodulos: moduloSubmodulos
            };
        });
        
        res.json({
            success: true,
            data: modulosConSubmodulos
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const getPermisosModulo = async (req, res) => {
    try {
        const { id_rol } = req.params;
        const connection = await getConnection();

        // Verificar si es desarrollador
        const nameUser = req.user.nameUser;
        const isDeveloper = nameUser === 'desarrollador';
        const id_tenant = req.id_tenant;

        let permisosQuery, queryParams;

        if (isDeveloper) {
            // Desarrollador ve permisos sin filtro de tenant
            permisosQuery = `
                SELECT m.nombre_modulo, s.nombre_submodulo, p.ver, p.crear, p.editar, p.eliminar, p.desactivar, p.generar
                FROM permisos p
                INNER JOIN modulo m ON p.id_modulo = m.id_modulo
                LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                WHERE p.id_rol = ?
            `;
            queryParams = [id_rol];
        } else {
            // Administrador de empresa ve solo permisos de su tenant
            permisosQuery = `
                SELECT m.nombre_modulo, s.nombre_submodulo, p.ver, p.crear, p.editar, p.eliminar, p.desactivar, p.generar
                FROM permisos p
                INNER JOIN modulo m ON p.id_modulo = m.id_modulo
                LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                WHERE p.id_rol = ? AND p.id_tenant = ?
            `;
            queryParams = [id_rol, id_tenant];
        }

        const [permisos] = await connection.query(permisosQuery, queryParams);

        res.json(permisos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener permisos", error });
    }
};

const getRoles = async (req, res) => {
    try {
        const connection = await getConnection();
        
        // Verificar si es desarrollador o administrador de empresa
        const nameUser = req.user.nameUser;
        const isDeveloper = nameUser === 'desarrollador';
        const id_tenant = req.id_tenant;
        
        let rolesQuery, queryParams;
        
        if (isDeveloper) {
            // Desarrollador ve todos los roles sin filtro de tenant
            rolesQuery = `SELECT id_rol, nom_rol FROM rol WHERE id_rol!=10 ORDER BY id_rol`;
            queryParams = [];
        } else {
            // Administrador de empresa ve solo los roles de su tenant
            rolesQuery = `SELECT id_rol, nom_rol FROM rol WHERE id_rol!=10 AND id_tenant = ? ORDER BY id_rol`;
            queryParams = [id_tenant];
        }
        
        const [roles] = await connection.query(rolesQuery, queryParams);
        
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const getPermisosByRol = async (req, res) => {
    try {
        const { id_rol } = req.params;
        const connection = await getConnection();
        
        // Verificar si es desarrollador
        const nameUser = req.user.nameUser;
        const isDeveloper = nameUser === 'desarrollador';
        const id_tenant = req.id_tenant;
        
        let permisosQuery, queryParams;
        
        if (isDeveloper) {
            // Desarrollador ve permisos sin filtro de tenant
            permisosQuery = `
                SELECT 
                    id_permiso,
                    id_rol,
                    id_modulo,
                    id_submodulo,
                    crear,
                    ver,
                    editar,
                    eliminar,
                    desactivar,
                    generar
                FROM permisos
                WHERE id_rol = ?
            `;
            queryParams = [id_rol];
        } else {
            // Administrador de empresa ve solo permisos de su tenant
            permisosQuery = `
                SELECT 
                    id_permiso,
                    id_rol,
                    id_modulo,
                    id_submodulo,
                    crear,
                    ver,
                    editar,
                    eliminar,
                    desactivar,
                    generar
                FROM permisos
                WHERE id_rol = ? AND id_tenant = ?
            `;
            queryParams = [id_rol, id_tenant];
        }
        
        const [permisos] = await connection.query(permisosQuery, queryParams);
        
        res.json({
            success: true,
            data: permisos
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

const savePermisos = async (req, res) => {
    const connection = await getConnection();
    await connection.beginTransaction();
    
    try {
        const { id_rol, permisos } = req.body;
        
        // Verificar si es desarrollador
        const nameUser = req.user.nameUser;
        const isDeveloper = nameUser === 'desarrollador';
        const id_tenant = req.id_tenant;
        
        if (isDeveloper) {
            // Desarrollador elimina permisos sin filtro de tenant (todos los tenants)
            await connection.query(
                'DELETE FROM permisos WHERE id_rol = ?',
                [id_rol]
            );
        } else {
            // Administrador de empresa elimina solo permisos de su tenant
            await connection.query(
                'DELETE FROM permisos WHERE id_rol = ? AND id_tenant = ?',
                [id_rol, id_tenant]
            );
        }
        
        if (permisos && permisos.length > 0) {
            for (const p of permisos) {
                if (isDeveloper) {
                    // Desarrollador inserta permisos para todos los tenants
                    // Obtener todos los tenants existentes
                    const [tenants] = await connection.query('SELECT DISTINCT id_tenant FROM usuario WHERE id_tenant IS NOT NULL');
                    
                    for (const tenant of tenants) {
                        await connection.query(`
                            INSERT INTO permisos
                            (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, id_tenant)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            id_rol, 
                            p.id_modulo, 
                            p.id_submodulo || null, 
                            p.crear !== undefined ? p.crear : 0,
                            p.ver !== undefined ? p.ver : 0,
                            p.editar !== undefined ? p.editar : 0,
                            p.eliminar !== undefined ? p.eliminar : 0,
                            p.desactivar !== undefined ? p.desactivar : 0,
                            p.generar !== undefined ? p.generar : 0,
                            tenant.id_tenant
                        ]);
                    }
                } else {
                    // Administrador de empresa inserta permisos solo para su tenant
                    await connection.query(`
                        INSERT INTO permisos
                        (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, id_tenant)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        id_rol, 
                        p.id_modulo, 
                        p.id_submodulo || null, 
                        p.crear !== undefined ? p.crear : 0,
                        p.ver !== undefined ? p.ver : 0,
                        p.editar !== undefined ? p.editar : 0,
                        p.eliminar !== undefined ? p.eliminar : 0,
                        p.desactivar !== undefined ? p.desactivar : 0,
                        p.generar !== undefined ? p.generar : 0,
                        id_tenant
                    ]);
                }
            }
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Permisos actualizados correctamente',
            data: {
                id_rol,
                permisos_count: permisos ? permisos.length : 0
            }
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ 
            success: false, 
            message: `Error al guardar permisos` 
        });
    } finally {
        connection.release();
    }
};

const checkPermiso = async (req, res) => {
  try {
    const idModulo = parseInt(req.query.idModulo);
    const idSubmodulo = req.query.idSubmodulo ? parseInt(req.query.idSubmodulo) : null;

    if (isNaN(idModulo)) {
      return res.status(400).json({
        hasPermission: false,
        message: "El parámetro idModulo debe ser un número válido"
      });
    }

    const nameUser =
      req.user?.nameUser ||
      req.user?.usr ||
      req.user?.usuario ||
      req.user?.username ||
      req.nameUser;

    if (!nameUser) {
      return res.status(400).json({
        hasPermission: false,
        message: "Información de usuario incompleta en el token"
      });
    }

      // Si es desarrollador, tiene todos los permisos
      if (nameUser === 'desarrollador') {
        return res.json({ 
          hasPermission: true,
          hasCreatePermission: true,
          hasEditPermission: true,
          hasDeletePermission: true,
          hasGeneratePermission: true,
          hasDeactivatePermission: true
        });
      }
      
      const connection = await getConnection();
      
      const [usuarios] = await connection.query(
        'SELECT id_usuario, id_rol FROM usuario WHERE usua = ? AND id_tenant = ?',
        [nameUser, req.id_tenant]
      );
      
      if (!usuarios.length) {
        return res.json({ hasPermission: false });
      }
      
      const idRol = usuarios[0].id_rol;
      
      if (idRol === 10) {  
        return res.json({ hasPermission: true });
      }
      
      const [permisos] = await connection.query(
        `SELECT ver, crear, editar, eliminar, desactivar, generar FROM permisos 
         WHERE id_rol = ? AND id_modulo = ? AND (id_submodulo = ? OR (id_submodulo IS NULL AND ? IS NULL)) AND id_tenant = ?`,
        [idRol, idModulo, idSubmodulo, idSubmodulo, req.id_tenant]
      );
      
      const hasPermission = permisos.length > 0 && permisos[0].ver === 1;
      const hasCreatePermission = permisos.length > 0 && permisos[0].crear === 1;
      const hasEditPermission = permisos.length > 0 && permisos[0].editar === 1;
      const hasDeletePermission = permisos.length > 0 && permisos[0].eliminar === 1;
      const hasGeneratePermission = permisos.length > 0 && permisos[0].generar === 1;
      const hasDeactivatePermission = permisos.length > 0 && permisos[0].desactivar === 1;

      res.json({ hasPermission, hasCreatePermission, hasEditPermission, hasDeletePermission, hasGeneratePermission, hasDeactivatePermission });
    } catch (error) {
      res.status(500).json({ 
        hasPermission: false,
        hasCreatePermission: false,
        hasEditPermission: false,
        hasDeletePermission: false,
        hasGeneratePermission: false,
        hasDeactivatePermission: false,
        message: "Error interno del servidor" 
      });
    }
};

export const methods = {
    getModulosConSubmodulos,
    getRoles,
    getPermisosByRol,
    savePermisos,
    getPermisosModulo,
    checkPermiso
};