
import React from 'react';
import { Card } from '@tremor/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const data = [
  {
    name: 'Unique visitors',
    stat: '10,450',
    change: '-12.5%',
    changeType: 'negative',
  },
  {
    name: 'Bounce rate',
    stat: '56.1%',
    change: '+1.8%',
    changeType: 'positive',
  },
  {
    name: 'Visit duration',
    stat: '5.2min',
    change: '+19.7%',
    changeType: 'positive',
  },
];

export default function KPIS() {
  return (
    <>
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <Card key={item.name} className="border rounded-md p-4 shadow-sm">
            <dt className="text-gray-500 font-medium">
              {item.name}
            </dt>
            <dd className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-gray-900">
                {item.stat}
              </span>
              <span
                className={classNames(
                  item.changeType === 'positive'
                    ? 'text-green-500'
                    : 'text-red-500',
                  'ml-2 text-sm font-medium',
                )}
              >
                {item.change}
              </span>
            </dd>
          </Card>
        ))}
      </dl>
    </>
  );
}
