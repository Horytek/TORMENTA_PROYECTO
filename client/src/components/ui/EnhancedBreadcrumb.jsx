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
import { NAVIGATION_DATA } from '../Navbar/NavigationData';

const EnhancedBreadcrumb = () => {
  const location = useLocation();
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);

  useEffect(() => {
    const { pathname } = location;
    const items = [];

    // 1. Always add Inicio
    items.push({
      name: 'Inicio',
      path: '/inicio', // Changed from '/' to match Dashboard url usually, or '/'
      isLast: pathname === '/inicio' || pathname === '/'
    });

    if (pathname === '/' || pathname === '/inicio') {
      setBreadcrumbItems(items);
      return;
    }

    // 2. Find Category and Item from NAVIGATION_DATA
    let foundCategory = null;
    let foundItem = null;

    // Search in NAVIGATION_DATA
    Object.entries(NAVIGATION_DATA).forEach(([key, category]) => {
      // Check top level
      if (category.url && pathname.startsWith(category.url) && category.url !== '/inicio') {
        foundCategory = category;
      }

      // Check items
      if (category.items) {
        const match = category.items.find(item => pathname.startsWith(item.url));
        if (match) {
          foundCategory = category;
          foundItem = match;
        }
      }
    });

    // 3. Construct Breadcrumb
    // Add Category if found and it's not "Inicio" (Dashboard)
    if (foundCategory && foundCategory.title !== 'Dashboard') {
      items.push({
        name: foundCategory.title,
        path: foundCategory.url || '#', // Some categories don't have a URL
        isClickable: !!foundCategory.url,
        isLast: !foundItem && pathname === foundCategory.url
      });
    }

    // Add Item if found
    if (foundItem) {
      // If the current path is exactly the item URL
      items.push({
        name: foundItem.title,
        path: foundItem.url,
        isLast: pathname === foundItem.url
      });

      // If path is deeper (e.g. /ventas/registro_venta/details), add simple segments?
      // For this specific 'register_venta' case, it matches foundItem.url usually.
    } else if (!foundCategory) {
      // Fallback: Use segments if no match in NavigationData
      const pathSegments = pathname.split('/').filter(Boolean);
      let currentPath = '';
      pathSegments.forEach((segment) => {
        // skip 'inicio' if it was part of path
        if (segment === 'inicio') return;

        currentPath += `/${segment}`;
        items.push({
          name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ').replace(/_/g, ' '),
          path: currentPath,
          isLast: currentPath === pathname
        });
      });
    }

    // If we found an item but there are still segments left (deeper navigation)
    // E.g. foundItem = "Nueva Venta" (/ventas/registro_venta), but path is /ventas/registro_venta/123
    if (foundItem && pathname.length > foundItem.url.length) {
      const remainingPath = pathname.slice(foundItem.url.length);
      const segments = remainingPath.split('/').filter(Boolean);
      let currentPath = foundItem.url;

      segments.forEach((segment, idx) => {
        currentPath += `/${segment}`;
        items.push({
          name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          path: currentPath,
          isLast: idx === segments.length - 1
        });
      });
    }

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
                item.isClickable !== false ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.path}>{item.name}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="font-medium hover:text-foreground transition-colors opacity-50 cursor-default">{item.name}</span>
                )
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default EnhancedBreadcrumb;