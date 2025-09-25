import { useMemo, useState } from 'react';
import { Button, Chip } from '@heroui/react';
import BarraSearch from '@/components/Search/Search';

function formatDuration(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}

const SAMPLE_CALLS = [
  { id: 'c1', contacto: 'Ana', tipo: 'audio', estado: 'contestada', inicio: '2025-03-20T10:34:00Z', duracion: 312 },
  { id: 'c2', contacto: 'Luis', tipo: 'video', estado: 'perdida', inicio: '2025-03-19T18:05:00Z', duracion: 0 },
  { id: 'c3', contacto: 'Carlos', tipo: 'audio', estado: 'fallida', inicio: '2025-03-19T09:15:00Z', duracion: 0 },
  { id: 'c4', contacto: 'María', tipo: 'video', estado: 'contestada', inicio: '2025-03-18T14:20:00Z', duracion: 1542 },
  { id: 'c5', contacto: 'Sofía', tipo: 'audio', estado: 'contestada', inicio: '2025-03-17T08:50:00Z', duracion: 85 },
];

export default function HistorialLlamadas() {
  const [calls] = useState(SAMPLE_CALLS);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipo, setTipo] = useState('todos'); // todos | audio | video
  const [estado, setEstado] = useState('todos'); // todos | contestada | perdida | fallida
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const filtered = useMemo(() => {
    return calls.filter((c) => {
      if (searchTerm && !c.contacto.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (tipo !== 'todos' && c.tipo !== tipo) return false;
      if (estado !== 'todos' && c.estado !== estado) return false;
      const t = new Date(c.inicio).getTime();
      if (desde) {
        const d = new Date(desde + 'T00:00:00').getTime();
        if (t < d) return false;
      }
      if (hasta) {
        const h = new Date(hasta + 'T23:59:59').getTime();
        if (t > h) return false;
      }
      return true;
    });
  }, [calls, searchTerm, tipo, estado, desde, hasta]);

  const chipForEstado = (est) => {
    const map = {
      contestada: { color: 'success', label: 'Contestada' },
      perdida: { color: 'warning', label: 'Perdida' },
      fallida: { color: 'danger', label: 'Fallida' },
    };
    const cfg = map[est] || { color: 'default', label: est };
    return <Chip size="sm" color={cfg.color}>{cfg.label}</Chip>;
  };

  return (
    <div className="min-h-screen py-8 px-2 sm:px-6">
      <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-2">
        Historial de llamadas
      </h1>
      <p className="text-base text-blue-700/80 mb-4">
        Consulta, filtra y revisa las llamadas realizadas y recibidas.
      </p>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <BarraSearch
            placeholder="Buscar por contacto"
            isClearable
            className="h-9 text-sm w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="h-9 text-sm border rounded-md px-2 bg-white"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="todos">Todos los tipos</option>
            <option value="audio">Solo audio</option>
            <option value="video">Solo video</option>
          </select>
          <select
            className="h-9 text-sm border rounded-md px-2 bg-white"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="contestada">Contestadas</option>
            <option value="perdida">Perdidas</option>
            <option value="fallida">Fallidas</option>
          </select>
          <input
            type="date"
            className="h-9 text-sm border rounded-md px-2 bg-white"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          <input
            type="date"
            className="h-9 text-sm border rounded-md px-2 bg-white"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      
    </div>
  );
}

