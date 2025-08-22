import { cleanOldLogs } from '../controllers/logs.controller.js';
import cron from 'node-cron';

/**
 * Servicio de mantenimiento de logs
 * Ejecuta tareas de limpieza automática de logs antiguos
 */
class LogMaintenanceService {
  constructor() {
    this.isRunning = false;
    this.lastCleanup = null;
    this.schedule = null;
  }

  /**
   * Inicia el servicio de mantenimiento
   * Se ejecuta diariamente a las 2:00 AM
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Servicio de mantenimiento de logs ya está ejecutándose');
      return;
    }

    // Ejecutar diariamente a las 2:00 AM
    this.schedule = cron.schedule('0 2 * * *', async () => {
      await this.performMaintenance();
    }, {
      scheduled: true,
      timezone: 'America/Lima' // Ajustar según tu zona horaria
    });

    this.isRunning = true;
    console.log('🚀 Servicio de mantenimiento de logs iniciado - Se ejecutará diariamente a las 2:00 AM');

    // Ejecutar una limpieza inicial si han pasado más de 24 horas desde la última
    if (!this.lastCleanup || Date.now() - this.lastCleanup > 24 * 60 * 60 * 1000) {
      setTimeout(() => this.performMaintenance(), 30000); // Esperar 30 segundos después del inicio
    }
  }

  /**
   * Detiene el servicio de mantenimiento
   */
  stop() {
    if (this.schedule) {
      this.schedule.destroy();
      this.schedule = null;
    }
    this.isRunning = false;
    console.log('🛑 Servicio de mantenimiento de logs detenido');
  }

  /**
   * Ejecuta las tareas de mantenimiento
   */
  async performMaintenance() {
    try {
      console.log('🧹 Iniciando mantenimiento de logs...');
      
      const result = await cleanOldLogs(90, 180); // 90 días para logs normales, 180 para críticos
      
      this.lastCleanup = Date.now();
      
      if (result.totalDeleted > 0) {
        console.log(`✅ Mantenimiento completado: ${result.totalDeleted} logs eliminados`);
      } else {
        console.log('✅ Mantenimiento completado: No hay logs antiguos para eliminar');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error durante el mantenimiento de logs:', error);
      throw error;
    }
  }

  /**
   * Fuerza una ejecución manual del mantenimiento
   */
  async forceCleanup() {
    console.log('🔧 Ejecutando limpieza manual de logs...');
    return await this.performMaintenance();
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCleanup: this.lastCleanup,
      nextRun: this.schedule ? this.schedule.getStatus() : null
    };
  }
}

// Exportar instancia singleton
export const logMaintenanceService = new LogMaintenanceService();

// Función helper para uso directo
export const startLogMaintenance = () => {
  logMaintenanceService.start();
};

export const stopLogMaintenance = () => {
  logMaintenanceService.stop();
};

export const forceLogCleanup = () => {
  return logMaintenanceService.forceCleanup();
};

export default logMaintenanceService;
