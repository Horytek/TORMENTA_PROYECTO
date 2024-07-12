import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
function Registro_Ingresos() {

    return (
    <div>
        <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de ingreso', href: '/almacen/nota_ingreso' }, { name: 'Nueva nota de ingreso', href: '/almacen/nota_ingreso/registro_ingreso' }]} />
        <hr className="mb-4" />
        <div className="flex justify-between mt-5 mb-4">
          Registro Nota de ingresos
      </div>
    </div>
     
    );
  }
  
  export default Registro_Ingresos;