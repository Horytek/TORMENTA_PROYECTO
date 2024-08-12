import { Card, Icon } from '@tremor/react';

export function CardComponent ({titleCard,tooltip, contentCard, color, icon}) {
  return (
    <Card
      className="mx-auto max-w-sm"
      decoration="left"
      decorationColor={color}
    >
        <div className="flex items-start space-x-6">
            <Icon
            icon={icon}
            color={color}
            tooltip={tooltip}
            variant="solid"
            size="lg"
            />
            <div>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">{titleCard}</p>
                <p className="text-3xl text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">{contentCard}</p>
            </div>
        </div>
      
    </Card>
  );
}