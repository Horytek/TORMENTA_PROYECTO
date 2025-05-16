import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from './breadcrumb';
import { moduleComponentMap, submoduleComponentMap } from '../../utils/componentMapping';

const createComponentNameMap = () => {
  const moduleNames = {
    1: { name: 'Inicio', path: '/' },
    2: { name: 'Productos', path: '/productos' },
    3: { name: 'Almacenes', path: '/almacenes' },
    4: { name: 'Clientes', path: '/clientes' },
    5: { name: 'Empleados', path: '/empleados' },
    6: { name: 'Ventas', path: '/ventas' },
    7: { name: 'Reportes de Ventas', path: '/reportes-ventas' },
    8: { name: 'Sucursal', path: '/sucursal' },
    10: { name: 'Almacén', path: '/almacen' },
    12: { name: 'Proveedores', path: '/proveedores' },
    13: { name: 'SUNAT', path: '/sunat' }
  };

  const submoduleNames = {
    1: { name: 'Marcas', path: '/marcas', parent: 2 },
    2: { name: 'Categorías', path: '/categorias', parent: 2 },
    3: { name: 'Subcategorías', path: '/subcategorias', parent: 2 },
    4: { name: 'Registro de Venta', path: '/ventas/registro', parent: 6 },
    5: { name: 'Libro de Ventas', path: '/ventas/libro', parent: 6 },
    6: { name: 'Usuarios', path: '/usuarios', parent: null },
    7: { name: 'Roles', path: '/roles', parent: null },
    8: { name: 'Módulos', path: '/modulos', parent: null },
    9: { name: 'Historial', path: '/ventas/historial', parent: 6 },
    10: { name: 'Nota de Ingreso', path: '/almacen/nota-ingreso', parent: 10 },
    11: { name: 'Nota de Salida', path: '/almacen/nota-salida', parent: 10 },
    12: { name: 'Nueva Nota de Salida', path: '/almacen/nota-salida/nueva', parent: 11 },
    13: { name: 'Guía de Remisión', path: '/almacen/guia-remision', parent: 10 },
    14: { name: 'Registro de Guía', path: '/almacen/guia-remision/registro', parent: 13 },
    15: { name: 'Nueva Nota de Ingreso', path: '/almacen/nota-ingreso/nueva', parent: 10 },
    16: { name: 'Histórico', path: '/almacen/kardex/historico', parent: 10 }
  };

  return { moduleNames, submoduleNames };
};

const createPathNameMap = () => {
  const { moduleNames, submoduleNames } = createComponentNameMap();
  const pathMap = {};
  
  Object.entries(moduleNames).forEach(([id, { name, path }]) => {
    pathMap[path] = name;
  });
  
  Object.entries(submoduleNames).forEach(([id, { name, path }]) => {
    pathMap[path] = name;
  });
  
  return pathMap;
};

const pathNameMap = createPathNameMap();

const EnhancedBreadcrumb = () => {
  const location = useLocation();
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  
  useEffect(() => {
    const { pathname } = location;
    const pathSegments = pathname.split('/').filter(Boolean);
    
    const items = [];
    let currentPath = '';
    
    items.push({
      name: 'Inicio',
      path: '/',
      isLast: pathSegments.length === 0
    });
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      let name = pathNameMap[currentPath];
      
      if (!name) {
        name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      }
      
      items.push({
        name,
        path: currentPath,
        isLast
      });
    });
    
    setBreadcrumbItems(items);
  }, [location]);
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.path}>{item.name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default EnhancedBreadcrumb;