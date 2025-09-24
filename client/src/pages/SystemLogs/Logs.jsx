import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import TablaLogs from './ComponentsLogs/TablaLogs';
import { Pagination } from '@heroui/react';
import { getSystemLogs } from '../../api/api.logs';
import { Tabs, Tab, Select, SelectItem } from "@heroui/react";


export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const [loading, setLoading] = useState(false);

  const load = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const data = await getSystemLogs(currentPage, limit);

      // El backend retorna data: { code, data, total, ... }
      // Por lo tanto, hay que extraer data.data y data.total
      const logsArray = Array.isArray(data.data?.data) ? data.data.data : [];
      setLogs(logsArray);
      setTotal(data.data?.total || 0);
    } catch (e) {
      console.error('❌ Error loading logs:', e);
      console.error('❌ Error details:', {
        name: e.name,
        message: e.message,
        stack: e.stack
      });

      if (e.name === 'SyntaxError' && e.message.includes('JSON')) {
        toast.error('Error de autenticación o el servidor devolvió HTML en lugar de JSON');
      } else {
        toast.error(`Error cargando logs: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    /* eslint-disable-next-line */ 
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">
          Logs del sistema
        </h1>
        <p className="text-base text-blue-700/80 mb-2">
          Aquí puedes ver los registros de actividad del sistema.
        </p>
      </div>
      <div className="bg-white/70 border border-blue-100 rounded-xl shadow-sm px-2 py-2 mb-4 flex flex-col">
              <Tabs
              
              >
                <Tab key="24h" title="Ult. 24hrs" />
                <Tab key="semana" title="Ult. Semana" />
                <Tab key="mes" title="Ult. mes" />
                <Tab key="anio" title="Ult. año" />
              </Tabs>
            </div>
      
      <TablaLogs
        logs={logs}
        loading={loading}
      />
      <div className="flex justify-between items-center mt-2 px-4 pb-2">
        <Pagination
          showControls
          page={page}
          total={totalPages}
          onChange={setPage}
          color="primary"
          size="sm"
        />
        <div />
      </div>
    </div>
  );
}
