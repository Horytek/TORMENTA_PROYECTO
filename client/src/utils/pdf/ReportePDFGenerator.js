import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateReportePDF = (ventas = [], filters = {}, reportType = 'executive') => {
    const { startDate, endDate, sucursalName } = filters;

    // --- Helpers ---
    const formatMoney = (amount) => `S/ ${Number(amount).toFixed(2)}`;
    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es });
        } catch (e) {
            return dateStr.substring(0, 10);
        }
    };

    // --- Data Processing ---
    const totalVentas = ventas.reduce((acc, v) => acc + (Number(v.total) || Number(v.mtoImpVenta) || 0), 0);
    const totalIGV = ventas.reduce((acc, v) => acc + (Number(v.igv) || Number(v.mtoIGV) || 0), 0);
    const ticketPromedio = ventas.length ? totalVentas / ventas.length : 0;

    // Process details if available
    const allDetails = ventas.flatMap(v => Array.isArray(v.detalles) ? v.detalles : []);

    // Top Products
    const productStats = {};
    allDetails.forEach(d => {
        const name = d.producto || d.nombre || 'Desconocido';
        if (!productStats[name]) productStats[name] = { qty: 0, total: 0 };
        productStats[name].qty += Number(d.cantidad || 0);
        productStats[name].total += Number(d.total || 0);
    });
    const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    // Categories
    const catStats = {};
    allDetails.forEach(d => {
        const cat = d.categoria || 'Otros';
        if (!catStats[cat]) catStats[cat] = 0;
        catStats[cat] += Number(d.total || 0);
    });
    const topCategories = Object.entries(catStats)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);

    // Clients
    const clientStats = {};
    ventas.forEach(v => {
        const name = v.cliente_n || v.cliente_r || v.nombre_cliente || 'Cliente General';
        if (!clientStats[name]) clientStats[name] = { count: 0, total: 0 };
        clientStats[name].count += 1;
        clientStats[name].total += (Number(v.total) || Number(v.mtoImpVenta) || 0);
    });
    const topClients = Object.entries(clientStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);


    // --- Render Sections ---

    const renderHeader = (title, subtitle) => `
    <div class="header">
      <h1 class="title">${title}</h1>
      <p class="subtitle">${subtitle}</p>
      <div class="meta-grid">
        <div><strong>Sucursal:</strong> ${sucursalName || 'Todas'}</div>
        <div><strong>Periodo:</strong> ${startDate} al ${endDate}</div>
      </div>
    </div>
  `;

    const renderKPIs = () => `
    <div class="kpi-container">
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Total Ventas</div>
        <div class="kpi-value">${formatMoney(totalVentas)}</div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-label">IGV Total</div>
        <div class="kpi-value">${formatMoney(totalIGV)}</div>
      </div>
      <div class="kpi-card kpi-amber">
        <div class="kpi-label">Transacciones</div>
        <div class="kpi-value">${ventas.length}</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label">Ticket Promedio</div>
        <div class="kpi-value">${formatMoney(ticketPromedio)}</div>
      </div>
    </div>
  `;

    const renderExecutiveContent = () => `
    ${renderKPIs()}
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
      <div>
        <h3 style="font-size: 14px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Top 5 Productos</h3>
        <table style="margin-bottom: 0;">
          <thead>
            <tr><th>Producto</th><th class="text-right">Total</th></tr>
          </thead>
          <tbody>
            ${topProducts.map(p => `
              <tr>
                <td>${p.name} <span style="font-size:9px; color:#64748b">(${p.qty} und)</span></td>
                <td class="text-right font-medium">${formatMoney(p.total)}</td>
              </tr>
            `).join('')}
            ${topProducts.length === 0 ? '<tr><td colspan="2" class="text-gray">No hay datos de productos</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div>
        <h3 style="font-size: 14px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Ventas por Categoría</h3>
        <table style="margin-bottom: 0;">
          <thead>
            <tr><th>Categoría</th><th class="text-right">Total</th></tr>
          </thead>
          <tbody>
            ${topCategories.map(c => `
              <tr>
                <td>${c.name}</td>
                <td class="text-right font-medium">${formatMoney(c.total)}</td>
              </tr>
            `).join('')}
             ${topCategories.length === 0 ? '<tr><td colspan="2" class="text-gray">No hay datos de categorías</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>

    <div class="usage-guide">
      <h3>Indicaciones de Uso</h3>
      <p>Este reporte ejecutivo está diseñado para la toma de decisiones gerenciales. 
      El <strong>Ticket Promedio</strong> indica el valor medio de compra por cliente. 
      Los <strong>Top Productos</strong> deben ser priorizados en reposición de stock.
      Las variaciones en <strong>Ventas por Categoría</strong> pueden indicar cambios en la demanda estacional.</p>
    </div>
  `;

    const renderDetailedContent = () => `
    <table>
      <thead>
        <tr>
          <th style="width: 12%">Fecha</th>
          <th style="width: 12%">Comp.</th>
          <th style="width: 25%">Cliente</th>
          <th style="width: 15%">Vendedor</th>
          <th style="width: 12%">Pago</th>
          <th class="text-right" style="width: 12%">Estado</th>
          <th class="text-right" style="width: 12%">Total</th>
        </tr>
      </thead>
      <tbody>
        ${ventas.map(v => {
        const tipo = (v.tipoComprobante || v.tipo || '').toLowerCase();
        let badgeClass = 'badge-nota';
        if (tipo.includes('factura')) badgeClass = 'badge-factura';
        if (tipo.includes('boleta')) badgeClass = 'badge-boleta';

        return `
            <tr>
              <td>
                <div class="font-medium">${formatDate(v.fecha || v.f_venta)}</div>
                <div style="font-size: 9px; color: #94a3b8">${(v.fecha || v.f_venta || '').substring(11, 16)}</div>
              </td>
              <td>
                <span class="badge ${badgeClass}">
                  ${v.tipoComprobante || v.tipo || 'Nota'}
                </span>
                <div style="font-size: 9px; margin-top: 2px; color: #64748b">
                  ${v.serieNum || ''}-${v.num || ''}
                </div>
              </td>
              <td>
                <div class="font-medium" style="font-size: 10px;">${v.cliente_n || v.cliente_r || v.nombre_cliente || 'Cliente General'}</div>
                <div style="font-size: 9px; color: #94a3b8">
                  ${v.dni || v.ruc || 'Sin doc.'}
                </div>
              </td>
              <td style="font-size: 10px;">${v.cajero || v.usuario || '---'}</td>
              <td style="font-size: 10px;">${v.metodo_pago || '---'}</td>
              <td class="text-right">
                <span style="font-size: 9px; padding: 2px 4px; border-radius: 4px; background: ${v.estado_sunat === 1 ? '#dcfce7' : '#fee2e2'}; color: ${v.estado_sunat === 1 ? '#166534' : '#991b1b'}">
                  ${v.estado_sunat === 1 ? 'ACEPTADO' : 'PENDIENTE'}
                </span>
              </td>
              <td class="text-right font-medium">${formatMoney(Number(v.total) || Number(v.mtoImpVenta) || 0)}</td>
            </tr>
          `;
    }).join('')}
      </tbody>
    </table>
    <div class="usage-guide">
      <h3>Nota de Auditoría</h3>
      <p>Este reporte detalla todas las transacciones registradas. Verifique el estado SUNAT para confirmación fiscal. 
      Los comprobantes marcados como 'PENDIENTE' pueden requerir revisión manual.</p>
    </div>
  `;

    const renderClientsContent = () => `
    <div class="kpi-container" style="grid-template-columns: repeat(2, 1fr);">
      <div class="kpi-card kpi-blue">
        <div class="kpi-label">Total Clientes Únicos</div>
        <div class="kpi-value">${topClients.length}</div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-label">Venta Promedio por Cliente</div>
        <div class="kpi-value">${formatMoney(topClients.length ? totalVentas / topClients.length : 0)}</div>
      </div>
    </div>

    <h3 style="font-size: 14px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Top Clientes por Volumen de Compra</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 50%">Cliente</th>
          <th class="text-right" style="width: 25%">Transacciones</th>
          <th class="text-right" style="width: 25%">Total Comprado</th>
        </tr>
      </thead>
      <tbody>
        ${topClients.map(c => `
          <tr>
            <td>
              <div class="font-medium">${c.name}</div>
            </td>
            <td class="text-right">${c.count}</td>
            <td class="text-right font-medium">${formatMoney(c.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
     <div class="usage-guide">
      <h3>Estrategia de Clientes</h3>
      <p>Los clientes listados representan el mayor volumen de facturación. Considere programas de fidelización para el top 10.</p>
    </div>
  `;

    // --- Main Render Logic ---
    let content = '';
    let title = 'Reporte de Ventas';
    let subtitle = 'Resumen Ejecutivo';

    switch (reportType) {
        case 'detailed':
            title = 'Detalle de Operaciones';
            subtitle = 'Listado completo de transacciones';
            content = renderDetailedContent();
            break;
        case 'clients':
            title = 'Análisis de Clientes';
            subtitle = 'Rendimiento por cartera de clientes';
            content = renderClientsContent();
            break;
        case 'executive':
        default:
            title = 'Resumen Ejecutivo';
            subtitle = 'Indicadores clave y rendimiento';
            content = renderExecutiveContent();
            break;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          margin: 0;
          padding: 20px;
        }
        
        .header {
          margin-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
        }
        
        .title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 5px 0;
          letter-spacing: -0.5px;
        }
        
        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
          font-size: 12px;
          color: #475569;
        }

        .kpi-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .kpi-card {
          padding: 15px;
          border-radius: 12px;
          border: 1px solid;
        }

        .kpi-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .kpi-value {
          font-size: 18px;
          font-weight: 700;
        }

        /* KPI Colors */
        .kpi-blue { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
        .kpi-green { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .kpi-amber { background: #fffbeb; border-color: #fde68a; color: #92400e; }
        .kpi-purple { background: #faf5ff; border-color: #e9d5ff; color: #6b21a8; }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 20px;
        }

        th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        td {
          padding: 10px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .text-right { text-align: right; }
        .font-medium { font-weight: 500; }
        .text-gray { color: #94a3b8; }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }

        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
        }
        .badge-factura { background: #e0e7ff; color: #3730a3; }
        .badge-boleta { background: #dcfce7; color: #166534; }
        .badge-nota { background: #f1f5f9; color: #475569; }

        .usage-guide {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          page-break-inside: avoid;
        }
        .usage-guide h3 {
          font-size: 12px;
          color: #334155;
          margin: 0 0 5px 0;
          text-transform: uppercase;
        }
        .usage-guide p {
          font-size: 10px;
          color: #64748b;
          margin: 0;
        }

      </style>
    </head>
    <body>
      ${renderHeader(title, subtitle)}
      ${content}
      <div class="footer">
        <div>Generado el ${new Date().toLocaleString('es-PE')}</div>
        <div>Tormenta Proyecto - Sistema de Gestión</div>
      </div>
    </body>
    </html>
  `;
};
