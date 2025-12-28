import { useMemo } from 'react';
import { useAuth } from '@/context/Auth/AuthProvider';
import { NAVIGATION_DATA } from './NavigationData';

export function useNavPermissions() {
    const { user } = useAuth();

    const filteredNav = useMemo(() => {
        if (!user) return {};

        // Get user role as a number (handle string case "1")
        const userRole = parseInt(user.rol, 10);
        const allowed = {};

        Object.entries(NAVIGATION_DATA).forEach(([key, section]) => {
            // If no allowedRoles defined, assume public (or default allow)
            // If defined, check if userRole is included
            if (!section.allowedRoles || section.allowedRoles.includes(userRole)) {
                allowed[key] = section;
            }
        });

        return allowed;
    }, [user]);

    return filteredNav;
}
