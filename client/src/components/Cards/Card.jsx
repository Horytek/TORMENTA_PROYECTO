import { Card, Icon } from "@tremor/react";

export function CardComponent({ titleCard, tooltip, contentCard, color, icon, className }) {
  return (
    <Card
      className={`w-full ${className || ""}`} // Se usa el ancho completo y se permite custom styling
      decoration="left"
      decorationColor={color}
    >
      <div className="flex items-center space-x-4"> {/* Ajuste de alineación y espacio */}
        <Icon
          icon={icon}
          color={color}
          tooltip={tooltip}
          variant="solid"
          size="lg"
        />
        <div className="flex flex-col justify-center">
          <p className="text-sm text-tremor-content dark:text-dark-tremor-content">
            {titleCard}
          </p>
          <p className="text-2xl font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            {contentCard}
          </p>
        </div>
      </div>
    </Card>
  );
}
