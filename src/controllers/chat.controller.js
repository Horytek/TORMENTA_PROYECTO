import { GoogleGenerativeAI } from "@google/generative-ai";
import { getConnection } from "../database/database.js";
import crypto from "crypto";
import { 
  getContextualSuggestions, 
  detectIntent, 
  formatResponse,
  chatMetrics 
} from "../utils/chatHelpers.js";

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

// System prompt optimizado y mejorado
const SYSTEM_PROMPT = `Eres asistente de HoryCore ERP.

CONTEXTO DEL SISTEMA:
- Módulos principales: Ventas, Almacén, Reportes, Clientes, Productos, Notas de Ingreso/Salida
- Ubicaciones: Inicio > Módulo > Submódulo
- Todos los reportes están en la sección "Reportes"

INSTRUCCIONES:
✓ Responde SOLO con información del sistema proporcionado
✓ Si encuentras rutas o módulos en el contexto, úsalos
✓ Sé breve, directo y conversacional
✗ NO inventes módulos, rutas ni cifras
✗ NO respondas preguntas fuera del ámbito del ERP

Si algo no existe en el contexto, sugiere verificar permisos o revisar el menú lateral.`;

// Configuración de mejoras
const CONFIG = {
  MAX_INPUT_LENGTH: 2000,        // Máximo caracteres por mensaje
  REQUEST_TIMEOUT: 15000,        // 15 segundos timeout
  MAX_RETRIES: 3,                // Número de reintentos
  CACHE_TTL: 5 * 60 * 1000,      // 5 minutos de caché
  CACHE_MAX_SIZE: 100,           // Máximo de entradas en caché
  MIN_QUERY_LENGTH: 3,           // Mínimo 3 caracteres
  PROFANITY_FILTER: true         // Filtro de lenguaje inapropiado
};

// Lista de palabras inapropiadas (expandir según necesidad)
const PROFANITY_LIST = [
  'puta', 'puto', 'mierda', 'carajo', 'coño', 'verga',
  'huevon', 'concha', 'cojudo', 'pendejo'
];

// Detectar spam o consultas sin sentido
function isNonsenseQuery(text) {
  if (!text || text.trim().length < CONFIG.MIN_QUERY_LENGTH) return true;
  
  // Detectar repeticiones excesivas (ej: "aaaaaa", "123123123")
  const repeatedChars = /(.)\1{5,}/.test(text);
  const repeatedWords = /(\b\w+\b)(\s+\1){3,}/i.test(text);
  
  // Detectar solo números o símbolos
  const onlyNumbersSymbols = /^[0-9!@#$%^&*()_+=\-\[\]{};:'"\\|,.<>\/?\s]+$/.test(text);
  
  return repeatedChars || repeatedWords || onlyNumbersSymbols;
}

// Filtro de profanidad
function containsProfanity(text) {
  if (!CONFIG.PROFANITY_FILTER) return false;
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
}

// Caché en memoria para respuestas frecuentes
const responseCache = new Map();

// Función para limpiar caché antiguo
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CONFIG.CACHE_TTL) {
      responseCache.delete(key);
    }
  }
  // Limitar tamaño del caché
  if (responseCache.size > CONFIG.CACHE_MAX_SIZE) {
    const keysToDelete = Array.from(responseCache.keys()).slice(0, responseCache.size - CONFIG.CACHE_MAX_SIZE);
    keysToDelete.forEach(key => responseCache.delete(key));
  }
}

// Generar hash para la caché
function getCacheKey(query, tenant) {
  return crypto.createHash('md5').update(`${tenant}:${query.toLowerCase().trim()}`).digest('hex');
}

// Validar y sanitizar input
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  // Eliminar caracteres peligrosos y limitar longitud
  return text
    .trim()
    .replace(/[<>{}]/g, '') // Eliminar caracteres potencialmente peligrosos
    .slice(0, CONFIG.MAX_INPUT_LENGTH);
}

// Función de reintento con backoff exponencial
async function retryWithBackoff(fn, maxRetries = CONFIG.MAX_RETRIES) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // No reintentar en ciertos errores
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw error;
      }
      // Backoff exponencial: 1s, 2s, 4s
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Timeout wrapper
function withTimeout(promise, timeoutMs = CONFIG.REQUEST_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs)
    )
  ]);
}

// Expandir términos de búsqueda para mejorar el RAG
function expandSearchTerms(query) {
  const q = query.toLowerCase();
  
  // Mapeo de sinónimos y variaciones comunes
  const synonymMap = {
    'venta': 'venta|ventas|vender|comprobante|factura',
    'compra': 'compra|compras|comprar|proveedor',
    'reporte': 'reporte|reportes|informe|análisis|estadística',
    'cliente': 'cliente|clientes|consumidor|comprador',
    'producto': 'producto|productos|artículo|item|inventario',
    'almacen': 'almacen|almacén|bodega|stock|existencia',
    'kardex': 'kardex|inventario|movimiento|stock',
    'nota': 'nota|guía|remisión|ingreso|salida',
    'usuario': 'usuario|usuarios|empleado|trabajador',
    'boleta': 'boleta|factura|comprobante|ticket',
    'factura': 'factura|boleta|comprobante',
    'registr': 'registr|crear|añadir|agregar|nuevo',
    'editar': 'editar|modificar|actualizar|cambiar',
    'eliminar': 'eliminar|borrar|quitar|remover',
    'listar': 'listar|ver|mostrar|consultar'
  };
  
  // Buscar coincidencias y expandir
  for (const [key, expansion] of Object.entries(synonymMap)) {
    if (q.includes(key)) {
      return expansion;
    }
  }
  
  return query;
}

async function getRAGSnippetFromDB(queryText, id_tenant) {
  if (!queryText) return "";
  let connection;
  try {
    connection = await getConnection();
    
    // Expandir palabras clave comunes para mejor búsqueda
    const expandedTerms = expandSearchTerms(queryText);
    const searchPattern = `%${expandedTerms}%`;

    const whereM = id_tenant ? " WHERE m.id_tenant = ? " : "";
    const paramsM = id_tenant ? [id_tenant, searchPattern, searchPattern] : [searchPattern, searchPattern];
    const [mods] = await connection.query(
      `
      SELECT m.nombre_modulo AS nombre, m.ruta AS ruta, m.descripcion
      FROM modulo m
      ${whereM} AND (m.nombre_modulo LIKE ? OR m.ruta LIKE ?)
      ORDER BY m.id_modulo LIMIT 8
      `.replace("WHERE  AND", "WHERE"),
      paramsM
    );

    const whereS = id_tenant ? " WHERE s.id_tenant = ? " : "";
    const paramsS = id_tenant ? [id_tenant, searchPattern, searchPattern] : [searchPattern, searchPattern];
    const [subs] = await connection.query(
      `
      SELECT s.nombre_sub AS nombre, s.ruta AS ruta, s.descripcion
      FROM submodulos s
      ${whereS} AND (s.nombre_sub LIKE ? OR s.ruta LIKE ?)
      ORDER BY s.id_submodulo LIMIT 10
      `.replace("WHERE  AND", "WHERE"),
      paramsS
    );

    const items = [...mods, ...subs].slice(0, 12);
    if (!items.length) return "";
    
    // Formatear con más información para el LLM
    const lines = items.map((i) => {
      let info = `• ${i.nombre}`;
      if (i.ruta && i.ruta !== "/") info += ` → Ruta: ${i.ruta}`;
      if (i.descripcion) info += ` | ${i.descripcion}`;
      return info;
    }).join("\n");
    
    return `MÓDULOS Y FUNCIONALIDADES DISPONIBLES:\n${lines}\n\nUsa esta información para guiar al usuario.`;
  } catch (e) {
    return "";
  } finally {
    if (connection) connection.release();
  }
}

// Detectar tablas mencionadas en la consulta del usuario (ampliado)
function detectTables(text = "") {
  const q = (text || "").toLowerCase();
  
  // Mapa de keywords a tablas (para mejor detección)
  const keywordMap = {
    // Usuarios y permisos
    "usuario": ["usuario", "rol", "permisos"],
    "permiso": ["permisos", "rol"],
    "modulo": ["modulo", "submodulos"],
    // Ventas
    "venta": ["venta", "detalle_venta", "comprobante"],
    "factura": ["venta", "comprobante"],
    "boleta": ["venta", "comprobante"],
    "comprobante": ["comprobante", "venta"],
    // Clientes
    "cliente": ["cliente", "venta"],
    // Productos
    "producto": ["producto", "inventario", "marca", "sub_categoria"],
    "inventario": ["inventario", "producto", "kardex"],
    "stock": ["inventario", "producto", "kardex"],
    // Almacén
    "almacen": ["almacen", "sucursal_almacen", "kardex"],
    "kardex": ["kardex", "detalle_kardex", "producto"],
    "nota": ["nota", "detalle_nota"],
    // Otros
    "guia": ["guia_remision", "destinatario"],
    "vendedor": ["vendedor", "usuario"],
    "sucursal": ["sucursal", "sucursal_almacen"]
  };
  
  const detected = new Set();
  
  // Buscar por keywords
  for (const [keyword, tables] of Object.entries(keywordMap)) {
    if (q.includes(keyword)) {
      tables.forEach(t => detected.add(t));
    }
  }
  
  // Si no se detectó nada, buscar directamente
  if (detected.size === 0) {
    const allTables = [
      "usuario","rol","permisos","modulo","submodulos",
      "cliente","venta","detalle_venta","comprobante",
      "producto","marca","sub_categoria","inventario","categoria",
      "almacen","sucursal","nota","detalle_nota",
      "guia_remision","destinatario","kardex","detalle_kardex"
    ];
    
    allTables.forEach(t => {
      const normalized = t.replace(/_/g, " ");
      if (q.includes(t) || q.includes(normalized)) {
        detected.add(t);
      }
    });
  }
  
  return Array.from(detected).slice(0, 8);
}

async function getSchemaSnippetFromDB(tableList = []) {
  if (!tableList.length) return "";
  let connection;
  try {
    connection = await getConnection();
    const [[{ db }]] = await connection.query(`SELECT DATABASE() AS db`);
    if (!db) return "";

    const placeholders = tableList.map(() => "?").join(",");

    const [cols] = await connection.query(
      `
      SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, COLUMN_KEY AS columnKey
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
      ORDER BY TABLE_NAME, ORDINAL_POSITION
      `,
      [db, ...tableList]
    );

    const [fks] = await connection.query(
      `
      SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, REFERENCED_TABLE_NAME AS refTable, REFERENCED_COLUMN_NAME AS refColumn
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders}) AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      [db, ...tableList]
    );

    const fkMap = {};
    for (const fk of fks) {
      fkMap[`${fk.tableName}.${fk.columnName}`] = `${fk.refTable}.${fk.refColumn}`;
    }

    const byTable = {};
    for (const c of cols) (byTable[c.tableName] ||= []).push(c);

    const blocks = [];
    for (const t of tableList) {
      const colsT = (byTable[t] || []).map(c => {
        const k = c.columnKey === "PRI" ? "PK" : c.columnKey === "UNI" ? "UQ" : fkMap[`${t}.${c.columnName}`] ? `FK→${fkMap[`${t}.${c.columnName}`]}` : "";
        return `${c.columnName} ${c.columnType}${k ? ` [${k}]` : ""}`;
      });
      if (colsT.length) blocks.push(`Tabla ${t}:\n  - ${colsT.join("\n  - ")}`);
    }

    let text = blocks.join("\n\n");
    if (text.length > 800) text = text.slice(0, 800) + "\n…";
    return text ? `Esquema relevante:\n${text}` : "";
  } catch {
    return "";
  } finally {
    if (connection) connection.release();
  }
}

export const chat = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Limpiar caché periódicamente
    if (Math.random() < 0.1) cleanCache();

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const safeMessages = messages.slice(-20).map(m => ({
      role: m.role === "system" || m.role === "assistant" ? m.role : "user",
      content: sanitizeInput(m.content)
    }));

    const lastUser = [...safeMessages].reverse().find(m => m.role === "user");
    const queryText = lastUser?.content?.slice(-1000) || "";

    // Validar input
    if (!queryText.trim()) {
      return res.status(400).json({ 
        error: "Mensaje vacío",
        choices: [{ message: { content: "Por favor escribe tu pregunta sobre HoryCore ERP." } }]
      });
    }

    // Filtro de consultas sin sentido
    if (isNonsenseQuery(queryText)) {
      return res.status(400).json({
        error: "Consulta inválida",
        choices: [{ message: { content: "Por favor escribe una pregunta coherente sobre el sistema HoryCore ERP." } }]
      });
    }

    // Filtro de lenguaje inapropiado
    if (containsProfanity(queryText)) {
      return res.status(400).json({
        error: "Lenguaje inapropiado",
        choices: [{ message: { content: "Por favor mantén un lenguaje profesional. ¿En qué puedo ayudarte con el sistema?" } }]
      });
    }

    // Verificar caché
    const cacheKey = getCacheKey(queryText, req.id_tenant || 'default');
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_TTL)) {
      const elapsed = Date.now() - startTime;
      console.log(`✅ CACHE_HIT: ${elapsed}ms - ${queryText.slice(0, 50)}...`);
      chatMetrics.recordQuery(elapsed, true, false);
      
      return res.json({ 
        choices: [{ message: { content: cached.response } }],
        cached: true,
        responseTime: elapsed
      });
    }

    // RAG: posibles rutas del sistema
    const rag = await getRAGSnippetFromDB(queryText, req.id_tenant);

    // RAG: esquema de tablas mencionadas
    const tables = detectTables(queryText);
    const schemaSnippet = await getSchemaSnippetFromDB(tables);

    // Construir contexto del sistema (más compacto)
    let systemContext = SYSTEM_PROMPT;
    if (rag) systemContext += `\n\n${rag}`;
    if (schemaSnippet) systemContext += `\n\n${schemaSnippet}`;

    // Preparar historial para Gemini (DEBE comenzar con 'user')
    const history = [];
    for (let i = 0; i < safeMessages.length - 1; i++) {
      const msg = safeMessages[i];
      if (msg.role === "user") {
        history.push({ role: "user", parts: [{ text: msg.content }] });
      } else if (msg.role === "assistant") {
        history.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }

    // CRÍTICO: Gemini requiere que el historial comience con 'user'
    // Si el primer mensaje es 'model', eliminarlo o agregar un user dummy
    if (history.length > 0 && history[0].role === "model") {
      history.shift(); // Eliminar el primer mensaje si es 'model'
    }

    // Llamada a Gemini con reintentos y timeout
    const content = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ 
        model: MODEL,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400,
        },
        systemInstruction: {
          parts: [{ text: systemContext }],
          role: "user"
        }
      });

      const chat = model.startChat({ history });
      
      // Aplicar timeout
      const result = await withTimeout(
        chat.sendMessage(queryText),
        CONFIG.REQUEST_TIMEOUT
      );
      
      return result.response.text();
    });

    // Detectar intención y formatear respuesta
    const intent = detectIntent(queryText);
    const formattedContent = formatResponse(content, intent);
    
    // Obtener sugerencias contextuales
    const suggestions = getContextualSuggestions(queryText);

    // Guardar en caché
    responseCache.set(cacheKey, {
      response: formattedContent,
      timestamp: Date.now()
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ CHAT_SUCCESS: ${elapsed}ms - Intent: ${intent} - ${queryText.slice(0, 50)}...`);
    chatMetrics.recordQuery(elapsed, false, false);

    return res.json({ 
      choices: [{ message: { content: formattedContent } }],
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      intent,
      responseTime: elapsed
    });

  } catch (e) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ CHAT_ERR (${elapsed}ms):`, e.message || e);
    chatMetrics.recordQuery(elapsed, false, true);

    // Mensaje de fallback según el tipo de error
    let fallbackMessage = "Lo siento, no pude procesar tu solicitud en este momento.";
    
    if (e.message === 'REQUEST_TIMEOUT') {
      fallbackMessage = "⏱️ La solicitud tardó demasiado. Por favor, intenta con una pregunta más específica.";
    } else if (e.status === 429) {
      fallbackMessage = "⚠️ Límite de solicitudes alcanzado. Por favor, espera un momento e intenta nuevamente.";
    } else if (e.status === 401 || e.status === 403) {
      fallbackMessage = "🔒 Error de autenticación. Por favor, contacta al administrador.";
    } else if (e.status === 404) {
      fallbackMessage = "⚙️ Modelo no disponible. Verifica la configuración del sistema.";
    }

    fallbackMessage += "\n\n💡 **Sugerencias:**\n- Verifica los módulos disponibles en el menú lateral\n- Revisa tus permisos de acceso\n- Consulta la documentación del sistema";

    return res.status(500).json({ 
      error: e.message || "CHAT_FAILED",
      choices: [{ message: { content: fallbackMessage } }],
      responseTime: elapsed
    });
  }
};

/**
 * Obtener métricas del chatbot
 * GET /api/chat/metrics
 */
export const getChatMetrics = (req, res) => {
  try {
    const stats = chatMetrics.getStats();
    const cacheSize = responseCache.size;
    
    return res.json({
      ...stats,
      cache: {
        size: cacheSize,
        maxSize: CONFIG.CACHE_MAX_SIZE,
        ttl: CONFIG.CACHE_TTL / 1000 + 's'
      },
      config: {
        model: MODEL,
        maxInputLength: CONFIG.MAX_INPUT_LENGTH,
        timeout: CONFIG.REQUEST_TIMEOUT / 1000 + 's'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error obteniendo métricas' });
  }
};

/**
 * Limpiar caché manualmente
 * POST /api/chat/clear-cache
 */
export const clearCache = (req, res) => {
  try {
    const previousSize = responseCache.size;
    responseCache.clear();
    
    console.log(`🗑️ Cache cleared: ${previousSize} entries removed`);
    
    return res.json({
      success: true,
      message: `Caché limpiado: ${previousSize} entradas eliminadas`,
      cleared: previousSize
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error limpiando caché' });
  }
};