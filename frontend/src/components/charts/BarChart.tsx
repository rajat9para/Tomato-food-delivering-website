import { useMemo } from 'react';

interface DataPoint {
    label: string;
    value: number;
    secondaryValue?: number;
    color?: string;
}

interface BarChartProps {
    data: DataPoint[];
    title?: string;
    subtitle?: string;
    height?: number;
    barColor?: string;
    secondaryBarColor?: string;
    showValues?: boolean;
    showGrid?: boolean;
    formatValue?: (value: number) => string;
}

const BarChart = ({
    data,
    title,
    subtitle,
    height = 280,
    barColor = '#10b981',
    secondaryBarColor = '#3b82f6',
    showValues = true,
    showGrid = true,
    formatValue = (v) => v.toLocaleString()
}: BarChartProps) => {
    const { bars, gridLines } = useMemo(() => {
        if (!data || data.length === 0) {
            return { bars: [], maxValue: 0, gridLines: [] };
        }

        const allValues = data.flatMap(d => [d.value, d.secondaryValue || 0]);
        const maxVal = Math.max(...allValues, 1);
        const hasSecondary = data.some(d => d.secondaryValue !== undefined);

        const barsData = data.map((d, i) => ({
            ...d,
            heightPercent: (d.value / maxVal) * 100,
            secondaryHeightPercent: d.secondaryValue ? (d.secondaryValue / maxVal) * 100 : 0,
            color: d.color || barColor,
            index: i
        }));

        // Grid lines (5 lines)
        const grids = [0, 1, 2, 3, 4].map(i => ({
            percent: i * 25,
            value: Math.round(maxVal * (4 - i) / 4)
        }));

        return { bars: barsData, maxValue: maxVal, gridLines: grids, hasSecondary };
    }, [data, barColor]);

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200" style={{ height }}>
                <p className="text-gray-400 font-medium">No data available</p>
            </div>
        );
    }

    const hasSecondary = data.some(d => d.secondaryValue !== undefined);
    const barWidth = hasSecondary ? 24 : 36;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {(title || subtitle) && (
                <div className="mb-6">
                    {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
            )}

            <div className="relative" style={{ height }}>
                {/* Grid Lines */}
                {showGrid && (
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {gridLines.map((line, i) => (
                            <div key={i} className="w-full border-t border-gray-100 relative">
                                <span className="absolute -left-1 -translate-x-full text-[10px] text-gray-400 font-medium -top-2">
                                    {formatValue(line.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bars */}
                <div className="absolute inset-0 pl-12 flex items-end justify-around">
                    {bars.map((bar, i) => (
                        <div key={i} className="flex items-end gap-1 h-full group relative">
                            {/* Primary Bar */}
                            <div
                                className="rounded-t-lg transition-all duration-500 hover:opacity-80 relative"
                                style={{
                                    width: barWidth,
                                    height: `${bar.heightPercent}%`,
                                    backgroundColor: bar.color,
                                    minHeight: bar.value > 0 ? 4 : 0
                                }}
                            >
                                {/* Value Label */}
                                {showValues && bar.value > 0 && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap">
                                            {formatValue(bar.value)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Secondary Bar */}
                            {bar.secondaryValue !== undefined && (
                                <div
                                    className="rounded-t-lg transition-all duration-500 hover:opacity-80"
                                    style={{
                                        width: barWidth,
                                        height: `${bar.secondaryHeightPercent}%`,
                                        backgroundColor: secondaryBarColor,
                                        minHeight: bar.secondaryValue > 0 ? 4 : 0
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* X Axis Labels */}
                <div className="absolute bottom-0 left-12 right-0 flex justify-around -mb-6">
                    {bars.map((bar, i) => (
                        <span key={i} className="text-[10px] text-gray-500 font-medium text-center truncate max-w-16">
                            {bar.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Legend for grouped bars */}
            {hasSecondary && (
                <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: barColor }} />
                        <span className="text-xs font-medium text-gray-600">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: secondaryBarColor }} />
                        <span className="text-xs font-medium text-gray-600">Secondary</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarChart;
