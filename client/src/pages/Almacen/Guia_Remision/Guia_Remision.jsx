import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';

function GuiaRemision() {

    return (
      <div >
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Guia de remision', href: '/almacen/guia_remision' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Guia de Remision
          <div>

          </div>
        </h1>
      </div>
    </div>
      
    );
  }
  
  export default GuiaRemision;