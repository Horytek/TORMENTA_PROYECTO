import { getConnection } from "./../database/database";

const getModulosConSubmodulos = async (req, res) => {
    try {
        const connection = await getConnection();
        
        const [modulos] = await connection.query(`
            SELECT * FROM modulo ORDER BY id_modulo
        `);
        
        const [submodulos] = await connection.query(`
            SELECT 
                s.id_submodulo,
                s.id_modulo,
                s.nombre_sub,
                s.ruta as ruta_submodulo
            FROM submodulos s
            ORDER BY s.id_modulo, s.id_submodulo
        `);
        
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

        const [permisos] = await connection.query(`
            SELECT m.nombre_modulo, s.nombre_submodulo, p.ver, p.crear, p.editar, p.eliminar, p.desactivar, p.generar
            FROM permisos p
            INNER JOIN modulo m ON p.id_modulo = m.id_modulo
            LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
            WHERE p.id_rol = ?`, 
            [id_rol]
        );

        res.json(permisos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener permisos", error });
    }
};

const getRoles = async (req, res) => {
    try {
        const connection = await getConnection();
        const [roles] = await connection.query(`
            SELECT id_rol, nom_rol FROM rol WHERE id_rol!=10
        `);
        
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
        
        const [permisos] = await connection.query(`
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
        `, [id_rol]);
        
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
        
        await connection.query(
            'DELETE FROM permisos WHERE id_rol = ?',
            [id_rol]
        );
        
        if (permisos && permisos.length > 0) {
            //console.log("Permissions to save:", permisos);
            for (const p of permisos) {
                await connection.query(`
                    INSERT INTO permisos
                    (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    id_rol, 
                    p.id_modulo, 
                    p.id_submodulo || null, 
                    p.crear !== undefined ? p.crear : 0,
                    p.ver !== undefined ? p.ver : 0,
                    p.editar !== undefined ? p.editar : 0,
                    p.eliminar !== undefined ? p.eliminar : 0,
                    p.desactivar !== undefined ? p.desactivar : 0,
                    p.generar !== undefined ? p.generar : 0
                ]);
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

// AQUÍ ESTÁ LA CORRECCIÓN CLAVE
const checkPermiso = async (req, res) => {
    try {
      // Convertir a números y validar
      const idModulo = parseInt(req.query.idModulo);
      const idSubmodulo = req.query.idSubmodulo ? parseInt(req.query.idSubmodulo) : null;
      
      if (isNaN(idModulo)) {
        return res.status(400).json({ 
          hasPermission: false,
          message: "El parámetro idModulo debe ser un número válido" 
        });
      }
      
      //console.log("Token payload:", req.user); // Depuración
      const nameUser = req.user.nameUser;
      
      if (!nameUser) {
        return res.status(400).json({
          hasPermission: false,
          message: "Información de usuario incompleta en el token"
        });
      }
      
      const connection = await getConnection();
      
      const [usuarios] = await connection.query(
        'SELECT id_usuario, id_rol FROM usuario WHERE usua = ?',
        [nameUser]
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
         WHERE id_rol = ? AND id_modulo = ? AND (id_submodulo = ? OR (id_submodulo IS NULL AND ? IS NULL))`,
        [idRol, idModulo, idSubmodulo, idSubmodulo]
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

