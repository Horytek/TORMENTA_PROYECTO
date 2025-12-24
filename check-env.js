#!/usr/bin/env node

/**
 * Script para verificar la configuración del entorno
 * Ejecutar con: node check-env.js
 */

import { config } from 'dotenv';
import fs from 'fs';
import { createConnection } from 'mysql2/promise';

// Cargar variables de entorno
config();

console.log('🔍 Verificando configuración del entorno...\n');

// Verificar si existe el archivo .env
const envExists = fs.existsSync('.env');
if (!envExists) {
    console.error('❌ El archivo .env NO existe');
    console.log('   Por favor, crea un archivo .env siguiendo las instrucciones en CONFIGURACION_ENV.md\n');
} else {
    console.log('✅ Archivo .env encontrado\n');
}

// Variables requeridas
const requiredVars = [
    { name: 'DB_HOST', value: process.env.DB_HOST, critical: true },
    { name: 'DB_USERNAME', value: process.env.DB_USERNAME, critical: true },
    { name: 'DB_PASSWORD', value: process.env.DB_PASSWORD, critical: false },
    { name: 'DB_DATABASE', value: process.env.DB_DATABASE, critical: true },
    { name: 'DB_PORT', value: process.env.DB_PORT, critical: false },
    { name: 'TOKEN_SECRET', value: process.env.TOKEN_SECRET, critical: true },
    { name: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY, critical: false },
    { name: 'PORT', value: process.env.PORT, critical: false },
];

let hasErrors = false;
let hasWarnings = false;

console.log('📋 Verificando variables de entorno:\n');

requiredVars.forEach(({ name, value, critical }) => {
    if (!value || value === '' || value === 'tu_contraseña_mysql' || value === 'tu_clave_secreta_aqui_cambiar_en_produccion' || value.includes('xxx')) {
        if (critical) {
            console.error(`❌ ${name}: NO configurada (REQUERIDA)`);
            hasErrors = true;
        } else {
            console.warn(`⚠️  ${name}: NO configurada (opcional pero recomendada)`);
            hasWarnings = true;
        }
    } else {
        // Ocultar valores sensibles
        let displayValue = value;
        if (name.includes('PASSWORD') || name.includes('SECRET') || name.includes('API_KEY')) {
            displayValue = value.substring(0, 4) + '****';
        }
        console.log(`✅ ${name}: ${displayValue}`);
    }
});

console.log('\n📊 Verificando conexión a la base de datos...\n');

// Procesar certificado SSL si existe
const DB_SSL_CA = process.env.DB_SSL_CA;
const sslCA = DB_SSL_CA
    ? Buffer.from(
        DB_SSL_CA
            .replace(/^"+|"+$/g, "") // quita comillas al inicio/fin
            .replace(/\\n/g, "\n"),
        "utf-8"
    )
    : undefined;

// Verificar conexión a la base de datos
if (process.env.DB_HOST && process.env.DB_USERNAME && process.env.DB_DATABASE) {
    try {
        const connectionConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT || 3306,
            ...(sslCA && {
                ssl: { ca: sslCA }
            })
        };

        const connection = await createConnection(connectionConfig);

        console.log('✅ Conexión a MySQL exitosa');

        // Verificar si la base de datos existe
        const [rows] = await connection.execute('SELECT DATABASE() as db');
        console.log(`✅ Base de datos activa: ${rows[0].db}`);

        await connection.end();
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error.message);
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('   La base de datos especificada no existe. Créala con:');
            console.log(`   CREATE DATABASE ${process.env.DB_DATABASE};`);
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('   Credenciales incorrectas. Verifica DB_USERNAME y DB_PASSWORD');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('   MySQL no está ejecutándose o el host/puerto son incorrectos');
        }
        hasErrors = true;
    }
} else {
    console.error('❌ Faltan configuraciones de base de datos');
    hasErrors = true;
}

// Verificar OpenAI
console.log('\n🤖 Verificando configuración de OpenAI...\n');

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('xxx')) {
    console.warn('⚠️  OpenAI API key NO configurada');
    console.log('   El servicio de chat no estará disponible');
    console.log('   Obtén tu API key en: https://platform.openai.com/api-keys');
} else {
    console.log('✅ OpenAI API key configurada');
    console.log(`✅ Modelo configurado: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
}

// Resumen final
console.log('\n' + '='.repeat(50));
console.log('📈 RESUMEN DE CONFIGURACIÓN');
console.log('='.repeat(50));

if (hasErrors) {
    console.error('\n❌ Hay errores críticos en la configuración');
    console.log('   Por favor, revisa el archivo CONFIGURACION_ENV.md');
    process.exit(1);
} else if (hasWarnings) {
    console.warn('\n⚠️  La configuración tiene advertencias pero es funcional');
    console.log('   Algunos servicios pueden no estar disponibles');
} else {
    console.log('\n✅ ¡Configuración completa y correcta!');
    console.log('   Puedes iniciar el servidor con: npm run dev');
}

console.log('\n');

