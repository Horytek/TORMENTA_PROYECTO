import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';

function NotaSalida() {

    return (
      <div >
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de salida', href: '/almacen/nota_salida' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de salida
          <div>

          </div>
        </h1>
      </div>
    </div>
      
    );
  }
  
  export default NotaSalida;