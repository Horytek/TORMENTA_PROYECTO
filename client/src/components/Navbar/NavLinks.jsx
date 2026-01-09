import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button
} from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useNavPermissions } from "./useNavPermissions";

export default function NavLinks() {
    const location = useLocation();
    const filteredNav = useNavPermissions();

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="hidden lg:flex items-center gap-1">
            {Object.entries(filteredNav).map(([key, data]) => {
                // Single Link
                if (!data.items) {
                    const Icon = data.icon;
                    return (
                        <Link
                            key={key}
                            to={data.url}
                            className={`group inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive(data.url)
                                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-zinc-800"
                                }`}
                        >
                            {Icon && <Icon size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />}
                            {data.title}
                        </Link>
                    );
                }

                // Dropdown
                return (
                    <Dropdown key={key}>
                        <DropdownTrigger>
                            <Button
                                disableRipple
                                className={`p-0 bg-transparent data-[hover=true]:bg-transparent text-sm font-medium gap-1 min-w-0 h-auto px-3 py-2 rounded-md transition-colors ${Object.values(data.items).some(sub => isActive(sub.url))
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-zinc-800"
                                    }`}
                                endContent={<ChevronDown size={14} className="opacity-50" />}
                            >
                                {data.title}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label={data.title}
                            className="w-[340px]"
                            itemClasses={{
                                base: "gap-4",
                            }}
                        >
                            {data.items.map((item) => (
                                <DropdownItem
                                    key={item.url || item.title}
                                    description={item.description}
                                    startContent={
                                        <div className="bg-slate-50 dark:bg-zinc-800 p-2 rounded-lg">
                                            {item.icon && <item.icon size={20} className="text-slate-500" />}
                                        </div>
                                    }
                                    href={item.url}
                                    as={Link}
                                    to={item.url}
                                >
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{item.title}</span>
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                );
            })}
        </div>
    );
}
