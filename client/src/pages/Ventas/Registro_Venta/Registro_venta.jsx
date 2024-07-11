import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';

function Registro_Venta() {

  return (
    <div >
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Ventas', href: '/ventas' }, { name: 'Registrar', href: '/ventas/registro_venta' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Registrar Venta
          <div>

          </div>
        </h1>
      </div>
    </div>
  );
}

export default Registro_Venta;
