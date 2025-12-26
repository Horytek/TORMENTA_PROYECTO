import React, { useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Tooltip } from "@heroui/react";
import { Legend, LineChart } from '@tremor/react';
import { BarChart2 } from "lucide-react";
import useAnalisisGananciasSucursales from '@/services/reports/data_ganancias_sucr';

const valueFormatter = (number) =>
    'S/. ' + new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);

const COLORS = ['indigo', 'cyan', 'red', 'green', 'orange'];

const LineChartUsageExampleAxisLabel = () => {
    const { data, loading, error } = useAnalisisGananciasSucursales();

    const currentYear = new Date().getFullYear().toString().slice(-2);

    const months = [
        `Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`,
        `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`,
        `Jul ${currentYear}`, `Aug ${currentYear}`, `Sep ${currentYear}`,
        `Oct ${currentYear}`, `Nov ${currentYear}`, `Dec ${currentYear}`
    ];

    const monthTranslations = {
        [`Jan ${currentYear}`]: `Ene'${currentYear}`,
        [`Feb ${currentYear}`]: `Feb'${currentYear}`,
        [`Mar ${currentYear}`]: `Mar'${currentYear}`,
        [`Apr ${currentYear}`]: `Abr'${currentYear}`,
        [`May ${currentYear}`]: `May'${currentYear}`,
        [`Jun ${currentYear}`]: `Jun'${currentYear}`,
        [`Jul ${currentYear}`]: `Jul'${currentYear}`,
        [`Aug ${currentYear}`]: `Ago'${currentYear}`,
        [`Sep ${currentYear}`]: `Sep'${currentYear}`,
        [`Oct ${currentYear}`]: `Oct'${currentYear}`,
        [`Nov ${currentYear}`]: `Nov'${currentYear}`,
        [`Dec ${currentYear}`]: `Dic'${currentYear}`,
    };

    // Organizar los datos y calcular el máximo para la escala
    const { organizedData, maxValue, total } = useMemo(() => {
        let max = 0;
        let total = 0;
        const orgData = months.map(month => {
            const entry = {
                date: monthTranslations[month] || month,
            };
            data.forEach(item => {
                if (item.mes === month) {
                    const val = parseFloat(item.ganancias);
                    entry[item.sucursal] = val;
                    if (val > max) max = val;
                    total += val;
                }
            });
            return entry;
        });
        // Escala máxima: redondear hacia arriba al diezmil más cercano
        const roundedMax = Math.ceil((max || 10000) / 10000) * 10000;
        return { organizedData: orgData, maxValue: roundedMax, total };
    }, [data, months, monthTranslations]);

    const categories = [...new Set(data.map(item => item.sucursal))];

    return (
        <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
            <CardHeader className="flex flex-col gap-2 items-start">
                <div className="flex items-center gap-3">
                    <BarChart2 className="text-blue-500" size={22} />
                    <h3 className="text-lg font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                        Análisis general de las ventas en las sucursales
                    </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Chip color="primary" variant="flat">
                        Total: {valueFormatter(total)}
                    </Chip>
                    <Tooltip content="Escala máxima del gráfico">
                        <Chip color="default" variant="flat">
                            Escala máx: {valueFormatter(maxValue)}
                        </Chip>
                    </Tooltip>
                </div>
                <p className="text-sm text-default-400">
                    Ganancias generadas por sucursal (12 meses)
                </p>
            </CardHeader>
            <Divider />
            <CardBody>
                {loading ? (
                    <div className="text-center py-8 text-default-500">Cargando...</div>
                ) : error ? (
                    <div className="text-center text-red-500 py-8">{error}</div>
                ) : (
                    <>
                        <LineChart
                            className="mt-2 h-[340px]"
                            data={organizedData}
                            index="date"
                            yAxisWidth={80}
                            categories={categories}
                            colors={COLORS}
                            valueFormatter={valueFormatter}
                            xAxisLabel="Meses"
                            yAxisLabel="Ganancias (S/.)"
                            showAnimation={true}
                            showLegend={false}
                            curveType="monotone"
                            connectNulls={true}
                            showDots={true}
                            minValue={0}
                            maxValue={maxValue}

                            customTooltip={({ payload, active, label }) =>
                                active && payload && payload.length ? (
                                    <Card
                                        shadow="md"
                                        radius="md"
                                        className="min-w-[200px] max-w-[320px] border border-default-200 bg-white/95 px-3 py-2 shadow-xl"
                                    >
                                        <CardBody className="space-y-1 p-0">
                                            <div className="font-semibold text-xs text-default-900 mb-1">{label}</div>
                                            {payload.map((entry, idx) => (
                                                <div
                                                    key={entry.dataKey}
                                                    className="flex items-center gap-2 py-0.5"
                                                >
                                                    <span
                                                        className={`inline-block w-3 h-3 rounded-full border border-default-200 bg-${COLORS[idx % COLORS.length]}-400`}
                                                        style={{
                                                            backgroundColor: undefined,
                                                            filter: "brightness(1.1) saturate(0.85)",
                                                            minWidth: 12,
                                                            minHeight: 12,
                                                        }}
                                                    ></span>
                                                    <span className="font-medium text-xs text-default-800">{entry.dataKey}</span>
                                                    <span className="ml-auto font-bold text-xs text-default-900">{valueFormatter(entry.value)}</span>
                                                </div>
                                            ))}
                                        </CardBody>
                                    </Card>
                                ) : null
                            }
                        />
                        <div className="mt-4">
                            <Legend
                                categories={categories}
                                colors={COLORS}
                                className="flex-wrap"
                            />
                        </div>
                    </>
                )}
            </CardBody>
            <Divider />
            <CardFooter>
                <span className="text-xs text-default-400">
                    Datos actualizados mensualmente. Haz hover en los puntos para ver el detalle por sucursal.
                </span>
            </CardFooter>
        </Card>
    );
};

export default LineChartUsageExampleAxisLabel;