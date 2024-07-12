import PropTypes from 'prop-types';

const Table = ({ columns, data, renderActions }) => {
  const getEstadoClassName = (estado) => {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'estado-activo text-center';
      case 'inactivo':
        return 'estado-inactivo text-center';
      default:
        return '';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {renderActions && (
              <th
                className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-6 py-4 ${
                    column.key === 'estado' ? getEstadoClassName(row[column.key]) : ''
                  }`}
                >
                  {row[column.key]}
                </td>
              ))}
              {renderActions && (
                <td className="px-6 py-4">
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Definición de PropTypes para el componente Table
Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired, // Nombre a mostrar en la columna
      key: PropTypes.string.isRequired // Key correspondiente en el JSON
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired, // Array de objetos requerido para los datos de las filas
  renderActions: PropTypes.func, // Función opcional para renderizar acciones
};

export default Table;