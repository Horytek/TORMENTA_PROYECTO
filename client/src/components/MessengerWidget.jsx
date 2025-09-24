import React, { useState } from 'react';
import { Card, Button, Tooltip } from '@heroui/react';
import { MessageSquare, Phone, Video } from 'lucide-react';
import Messenger from '@/pages/Messenger/Messenger';

export default function MessengerWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante para abrir el Messenger */}
      {!isOpen && (
        <div style={{ position: 'fixed', right: 84, bottom: 24, zIndex: 9998 }}>
          <Tooltip content="Mensajería interna" placement="left">
            <Button
              isIconOnly
              variant="flat"
              color="default"
              className="rounded-xl shadow-sm border border-blue-100/60 bg-white/90 hover:bg-white/100 w-10 h-10"
              onPress={() => setIsOpen(true)}
              aria-label="Abrir mensajería interna"
            >
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </Button>
          </Tooltip>
        </div>
      )}
      {/* Ventana tipo widget del Messenger */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-[9998] overflow-hidden p-0 shadow-2xl border border-blue-100/70 rounded-2xl bg-white/95 backdrop-blur-md transition-all duration-200" style={{ width: 'min(95vw, 1100px)', height: 'min(92vh, 860px)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-50/70 bg-gradient-to-r from-blue-50/80 via-white/90 to-blue-100/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-500/90 text-white w-8 h-8 shadow">
                <MessageSquare className="w-5 h-5" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-blue-900 text-base">
                  Mensajería interna
                </span>
                <span className="text-xs text-blue-800/80">
                  Chat entre empleados
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Tooltip content="Llamar" placement="bottom">
                <Button
                  isIconOnly
                  variant="light"
                  color="primary"
                  size="sm"
                  aria-label="Llamar"
                  className="rounded-full"
                >
                  <Phone className="w-4 h-4 text-blue-700" />
                </Button>
              </Tooltip>
              
              <Button
                isIconOnly
                variant="light"
                color="danger"
                size="sm"
                onPress={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="rounded-full"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Button>
            </div>
          </div>
          {/* Messenger como widget */}
          <div style={{ width: '100%', height: 'calc(100% - 56px)', overflow: 'hidden' }}>
            <Messenger embedded />
          </div>
        </Card>
      )}
    </>
  );
}
