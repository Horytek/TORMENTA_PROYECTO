import PropTypes from 'prop-types';

const TablaKardex = ({ kardex }) => {

  const handleSelectClick = () => {
    // Implement the select click handler logic
  };

  const renderEntradaRow = (kardex) => (
    <tr key={kardex.id} className='tr-tabla-kardex'>
      <td className="text-center px-2">{kardex.codigo}</td>
      <td className="text-center px-2">{kardex.descripcion}</td>
      <td className="text-center px-2">{kardex.marca}</td>
      <td className="text-center px-2">{kardex.stock}</td>
      <td className="text-center px-2">{kardex.um}</td>
      <td className="text-center px-2">{kardex.marca}</td>
      <td className="text-center px-2">NOT</td>
      <td className='text-center px-2'>
        <select className='b text-center custom-select border border-gray-300 p-1.5 text-gray-900 text-sm rounded-lg' name="select" onClick={handleSelectClick} defaultValue="">
          <option value="">...</option>
          <option value="value1">Lotes</option>
          <option value="value2">Almacenes</option>
          <option value="value3">Kardex</option>
        </select>
      </td>
    </tr>
  );

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">CÓDIGO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">DESCRIPCIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">MARCA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">STOCK ACTUAL</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">UM</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">TRÁNSITO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">BARRA</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {kardex.map(renderEntradaRow)}
        </tbody>
      </table>
    </div>
  );
};

TablaKardex.propTypes = {
  kardex: PropTypes.array.isRequired,
};

export default TablaKardex;
