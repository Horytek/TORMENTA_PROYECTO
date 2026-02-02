import { useMemo } from 'react';
import { useAuth } from '@/context/Auth/AuthProvider';
import { useUserStore } from '@/store/useStore';
import { NAVIGATION_DATA } from './NavigationData';

/**
 * Hook to filter navigation based on user's actual permissions from database.
 * No more hardcoded role IDs - works with any role created by the company.
 * 
 * Developer accounts ONLY see developer-specific modules, not all modules.
 */
export function useNavPermissions() {
    const { user } = useAuth();
    const permissions = useUserStore(state => state.permissions);

    const filteredNav = useMemo(() => {
        if (!user) return {};

        const userRole = parseInt(user.rol, 10);
        const isDeveloper = userRole === 10 || user.usuario === 'desarrollador';

        // If user is a developer, only show developer-only sections
        if (isDeveloper) {
            const result = {};
            Object.entries(NAVIGATION_DATA).forEach(([key, section]) => {
                if (section.developerOnly) {
                    result[key] = section;
                }
            });
            return result;
        }

        // For non-developer users, filter based on permissions from database
        const allowedRoutes = new Set();

        if (Array.isArray(permissions)) {
            permissions.forEach(p => {
                // Add module route if user has 'ver' permission
                if (p.ver === 1 || p.ver === true) {
                    // Add main module route
                    if (p.modulo_ruta) {
                        allowedRoutes.add(p.modulo_ruta.toLowerCase());
                    }
                    // Add submodule route
                    if (p.submodulo_ruta) {
                        allowedRoutes.add(p.submodulo_ruta.toLowerCase());
                    }
                }
            });
        }

        // Helper to check if a route is allowed
        const hasAccess = (resourceKey) => {
            if (!resourceKey) return true; // No key = always show (e.g., dashboard)

            if (Array.isArray(resourceKey)) {
                return resourceKey.some(key => allowedRoutes.has(key.toLowerCase()));
            }

            return allowedRoutes.has(resourceKey.toLowerCase());
        };

        const result = {};

        Object.entries(NAVIGATION_DATA).forEach(([key, section]) => {
            // Skip developer-only sections for non-developers
            if (section.developerOnly) {
                return;
            }

            // Single link (no items)
            if (!section.items) {
                // Dashboard is always visible for authenticated users
                if (key === 'dashboard' || hasAccess(section.resourceKey)) {
                    result[key] = section;
                }
                return;
            }

            // Dropdown with items - filter items based on permissions
            const allowedItems = section.items.filter(item => hasAccess(item.resourceKey));

            // Only add section if at least one item is accessible
            if (allowedItems.length > 0) {
                result[key] = {
                    ...section,
                    items: allowedItems
                };
            }
        });

        return result;
    }, [user, permissions]);

    return filteredNav;
}
