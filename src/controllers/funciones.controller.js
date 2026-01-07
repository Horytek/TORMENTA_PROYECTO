import { getConnection } from "./../database/database.js";

const getFunciones = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.query(`SELECT id_funciones, funcion, estado_funcion, codigo, tipo_valor, seccion FROM funciones`);
    res.json({ code: 1, data: result });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getFuncion = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await getConnection();
    const [result] = await connection.query(`SELECT id_funciones, funcion, estado_funcion, codigo, tipo_valor, seccion FROM funciones WHERE id_funciones = ?`, [id]);

    if (result.length === 0) {
      return res.status(404).json({ code: 0, message: "Función no encontrada" });
    }

    res.json({ code: 1, data: result, message: "Función encontrada" });
  } catch (error) {
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const addFuncion = async (req, res) => {
  let connection;
  try {
    const { funcion, estado_funcion, codigo, tipo_valor, seccion } = req.body;

    if (funcion === undefined) {
      return res.status(400).json({ message: "Bad Request. Please fill all fields." });
    }

    const newFuncion = {
      funcion: funcion.trim(),
      estado_funcion: estado_funcion !== undefined ? estado_funcion : 1,
      id_tenant: 1, // Default to 1 or req.id_tenant if available
      codigo: codigo || null,
      tipo_valor: tipo_valor || 'boolean',
      seccion: seccion || 'General' // Default section
    };

    connection = await getConnection();

    if (codigo) {
      const [exists] = await connection.query("SELECT 1 FROM funciones WHERE codigo = ?", [codigo]);
      if (exists.length > 0) return res.status(400).json({ message: "Código already exists" });
    }

    await connection.query("INSERT INTO funciones SET ?", newFuncion);

    res.json({ code: 1, message: "Función añadida correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const updateFuncion = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { funcion, estado_funcion, plan, updatePlan, valor, codigo, tipo_valor, seccion } = req.body;

    connection = await getConnection();
    await connection.beginTransaction();

    if (!updatePlan) {
      // Just update the function definition
      const updates = [];
      const params = [];
      if (funcion !== undefined) { updates.push('funcion = ?'); params.push(funcion.trim()); }
      if (estado_funcion !== undefined) { updates.push('estado_funcion = ?'); params.push(estado_funcion); }
      if (codigo !== undefined) { updates.push('codigo = ?'); params.push(codigo || null); }
      if (tipo_valor !== undefined) { updates.push('tipo_valor = ?'); params.push(tipo_valor); }
      if (seccion !== undefined) { updates.push('seccion = ?'); params.push(seccion); }

      if (updates.length > 0) {
        params.push(id);
        await connection.query(`UPDATE funciones SET ${updates.join(', ')} WHERE id_funciones = ?`, params);
      }
    }

    if (updatePlan && plan !== undefined) {
      // Update specific plan assignment in plan_funciones
      const [exists] = await connection.query("SELECT id_plan_funcion FROM plan_funciones WHERE id_plan = ? AND id_funcion = ?", [plan, id]);

      if (estado_funcion) { // Adding/Updating assignment
        // If valor is provided, use it. If not, default to 'true' (for boolean toggles that don't send valor)
        // But be careful: if checking a checkbox, we want 'true'.
        const val = valor !== undefined ? String(valor) : 'true';

        if (exists.length > 0) {
          await connection.query("UPDATE plan_funciones SET valor = ? WHERE id_plan_funcion = ?", [val, exists[0].id_plan_funcion]);
        } else {
          await connection.query("INSERT INTO plan_funciones (id_plan, id_funcion, valor) VALUES (?, ?, ?)", [plan, id, val]);
        }
      } else { // Removing assignment
        if (exists.length > 0) {
          await connection.query("DELETE FROM plan_funciones WHERE id_plan_funcion = ?", [exists[0].id_plan_funcion]);
        }
      }
    }

    await connection.commit();
    res.json({ code: 1, message: "Función actualizada correctamente" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error(error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const methods = {
  getFunciones,
  getFuncion,
  addFuncion,
  updateFuncion,
};