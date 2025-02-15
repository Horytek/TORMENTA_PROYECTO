import { getConnection } from "./../database/database";

const getFunciones = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_funciones, funcion, estado_funcion FROM funciones`);
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const getFuncion = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_funciones, funcion, estado_funcion FROM funciones WHERE id_funciones = ?`, id);
        
        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Función no encontrada" });
        }
    
        res.json({ code: 1, data: result, message: "Función encontrada" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const addFuncion = async (req, res) => {
    let connection;
    try {
        const { funcion, estado_funcion } = req.body;

        if (funcion === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { funcion: funcion.trim(), estado_funcion };
        connection = await getConnection();
        await connection.query("INSERT INTO funciones SET ? ", usuario);

        res.json({ code: 1, message: "Función añadida" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const updateFuncion = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { funcion, estado_funcion, plan, updatePlan } = req.body;

    if (estado_funcion === undefined || (updatePlan && plan === undefined)) {
      return res.status(400).json({ message: "Bad Request. Please fill all fields." });
    }

    connection = await getConnection();
    await connection.beginTransaction();

    if (!updatePlan) {
      const usuario = { funcion: funcion.trim(), estado_funcion };
      const [result] = await connection.query("UPDATE funciones SET ? WHERE id_funciones = ?", [usuario, id]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ code: 0, message: "Función no encontrada" });
      }
    }

    if (updatePlan && plan !== undefined) {
      // Actualizar el campo funciones en la tabla plan_pago
      const [planPagoResult] = await connection.query(
        "SELECT funciones FROM plan_pago WHERE id_plan = ?",
        [plan]
      );

      if (planPagoResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({ code: 0, message: "Plan de pago no encontrado" });
      }

      const funcionesArray = planPagoResult[0].funciones ? planPagoResult[0].funciones.split(',').map(Number) : [];
      const index = funcionesArray.indexOf(parseInt(id));

      if (estado_funcion && index === -1) {
        funcionesArray.push(parseInt(id));
      } else if (!estado_funcion && index !== -1) {
        funcionesArray.splice(index, 1);
      }

      const funcionesString = funcionesArray.join(',');
      await connection.query("UPDATE plan_pago SET funciones = ? WHERE id_plan = ?", [funcionesString, plan]);
    }

    await connection.commit();
    res.json({ code: 1, message: "Función modificada y plan de pago actualizado" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    res.status(500).send({ code: 0, message: error.message });
  } finally {
    if (connection) {
      connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
    }
  }
};

  
export const methods = {
    getFunciones,
    getFuncion,
    addFuncion,
    updateFuncion,
};