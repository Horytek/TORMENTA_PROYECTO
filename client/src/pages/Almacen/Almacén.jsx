import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';

function Almacén() {

  const breadcrumbPaths = [
    { name: 'Inicio', href: '/inicio' },
    { name: 'Almacén', href: '/almacen' },
  ];
    return (
      <div className="bg-white p-4 flex justify-between items-center relative">
              <Breadcrumb paths={breadcrumbPaths} />

          HOLA ES ALMACEN
      </div>
    );
  }
  
  export default Almacén;
  