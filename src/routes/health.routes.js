import { Router } from 'express';
import { getConnection } from '../database/database.js';

const router = Router();

router.get('/', async (req, res) => {
    const start = Date.now();
    try {
        const connection = await getConnection();
        // Simple query to check DB connectivity
        await connection.query('SELECT 1');
        connection.release();

        const duration = Date.now() - start;

        res.json({
            status: 'operational',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: 'up',
                    latency: `${duration}ms`
                },
                server: {
                    status: 'up',
                    uptime: process.uptime()
                }
            }
        });
    } catch (error) {
        console.error('Health Check Failed:', error);
        res.status(503).json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: 'down',
                    error: error.message
                },
                server: {
                    status: 'up',
                    uptime: process.uptime()
                }
            }
        });
    }
});

export default router;
