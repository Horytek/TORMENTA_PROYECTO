import React from "react";
import { Button, Tooltip, Popover, PopoverTrigger, PopoverContent, Card } from "@heroui/react";
import { HelpCircle } from "lucide-react";

export function LogotipoPopoverInfo() {
    return (
        <Popover placement="bottom" showArrow={true}>
            <PopoverTrigger>
                <Button
                    isIconOnly
                    variant="bordered"
                    color="primary"
                    className="rounded-xl shadow-sm w-8 h-8 min-w-8 border-blue-500 text-blue-600"
                    aria-label="Ayuda logotipo"
                >
                    <HelpCircle className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none shadow-none bg-transparent">
                <Card className="max-w-[340px] bg-white dark:bg-zinc-900 text-slate-900 dark:text-gray-100 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 px-4 py-3">
                    <div className="font-semibold text-base mb-2 text-blue-600 dark:text-blue-400">Guía rápida</div>
                    <ul className="list-none space-y-2 text-sm mb-2">
                        <li>Convierte tu logotipo a <b>JPG</b>.</li>
                        <li>Sube la imagen a <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">imgbb.com</a>.</li>
                        <li>Marca <b>"No eliminar automáticamente"</b> antes de subir.</li>
                        <li>Elige <b>BBCode completo enlazado</b> en "Códigos de inserción".</li>
                        <li>Copia la URL que inicia con <span className="font-mono text-blue-600 dark:text-blue-400">https://i.ibb.co/...</span> y termina en <span className="font-mono text-blue-600 dark:text-blue-400">.jpg</span>.</li>
                    </ul>
                    <div className="bg-blue-50 dark:bg-zinc-800 rounded-lg p-2 text-xs font-mono text-blue-600 dark:text-blue-400 mb-2 border border-blue-100 dark:border-zinc-700 break-all">
                        Ejemplo:<br />
                        [url=https://ibb.co/V0m4rSk2][img]https://i.ibb.co/qL5QXs2k/wallhaven-z81jry-1920x1080.jpg[/img][/url]
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Solo usa la URL directa de la imagen (la segunda <span className="font-mono">https://i.ibb.co/...</span>).
                    </div>
                </Card>
            </PopoverContent>
        </Popover>
    );
}
