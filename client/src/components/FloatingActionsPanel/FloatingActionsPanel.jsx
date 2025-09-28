import { Card, Button, Tooltip, Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { MessageCircle, Search, Settings, Info } from "lucide-react";

export default function FloatingActionsPanel({
  onChatClick,
  onSearchClick,
  onSettingsOption,
  onInfoClick,
  unread = 0,
  extraOptions = [],
}) {
  return (
    <Card
      className="flex flex-col items-end gap-2 p-3 shadow-xl border border-blue-100/60 bg-white/95 dark:bg-zinc-900/90"
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 9998,
        width: "auto",
        maxWidth: 320,
      }}
    >
      <Tooltip content="Buscar en el sistema" placement="left">
        <Button
          isIconOnly
          variant="flat"
          className="rounded-xl shadow-md border border-blue-100/60 bg-gradient-to-br from-blue-50 via-white to-blue-100 hover:from-blue-100 hover:to-blue-200 w-10 h-10"
          style={{
            boxShadow: "0 4px 12px 0 rgba(59,130,246,0.10)",
            backdropFilter: "blur(2px)",
          }}
          onClick={onSearchClick}
          aria-label="Buscar"
        >
          <Search className="w-5 h-5 text-blue-500" />
        </Button>
      </Tooltip>

      <Tooltip content="Abrir asistente especializado" placement="left">
        <div className="relative">
          <Button
            isIconOnly
            variant="flat"
            color="default"
            className="rounded-xl shadow-sm border border-blue-100/60 bg-white/90 dark:bg-zinc-900/85 hover:bg-white w-10 h-10"
            onClick={onChatClick}
            aria-label="Asistente ERP"
          >
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </Button>
          {unread > 0 && (
            <span
              aria-label={`${unread} notificaciones sin leer`}
              title={`${unread} sin leer`}
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #e0ecff, #c7dbff)",
                color: "#1e3a8a",
                fontSize: 10,
                fontWeight: 700,
                lineHeight: "16px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,.12)",
              }}
            >
              {unread}
            </span>
          )}
        </div>
      </Tooltip>

      <Dropdown>
        <DropdownTrigger>
          <Tooltip content="Configuración" placement="left">
            <Button
              isIconOnly
              variant="flat"
              color="secondary"
              className="rounded-xl shadow-sm border border-blue-100/60 w-10 h-10"
              aria-label="Configuración"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </Tooltip>
        </DropdownTrigger>
        <DropdownMenu aria-label="Opciones de configuración">
          <DropdownItem key="perfil" onClick={() => onSettingsOption?.("perfil")}>Perfil</DropdownItem>
          <DropdownItem key="preferencias" onClick={() => onSettingsOption?.("preferencias")}>Preferencias</DropdownItem>
          <DropdownItem key="cerrar-sesion" onClick={() => onSettingsOption?.("cerrar-sesion")}>Cerrar sesión</DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Tooltip content="Información" placement="left">
        <Button
          isIconOnly
          variant="flat"
          color="primary"
          className="rounded-xl shadow-sm border border-blue-100/60 w-10 h-10"
          onClick={onInfoClick}
          aria-label="Información"
        >
          <Info className="w-5 h-5" />
        </Button>
      </Tooltip>

      {extraOptions.length > 0 && (
        <>
          <Divider className="my-2" />
          {extraOptions.map((opt, idx) => (
            <div key={idx}>{opt}</div>
          ))}
        </>
      )}
    </Card>
  );
}