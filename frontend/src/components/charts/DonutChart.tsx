import { useMemo } from 'react';

interface DataPoint {
    label: string;
    value: number;
    color?: string;
}

interface DonutChartProps {
    data: DataPoint[];
    title?: string;
    subtitle?: string;
    size?: number;
    strokeWidth?: number;
    colors?: string[];
    showLegend?: boolean;
    centerLabel?: string;
    centerValue?: string | number;
    formatValue?: (value: number) => string;
}

const defaultColors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
];

const DonutChart = ({
    data,
    title,
    subtitle,
    size = 200,
    strokeWidth = 32,
    colors = defaultColors,
    showLegend = true,
    centerLabel,
    centerValue,
    formatValue = (v) => v.toLocaleString()
}: DonutChartProps) => {
    const { segments } = useMemo(() => {
        if (!data || data.length === 0) {
            return { segments: [], total: 0 };
        }

        const totalVal = data.reduce((sum, d) => sum + d.value, 0);
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        let currentOffset = circumference / 4; // Start from top

        const segs = data.map((d, i) => {
            const percentage = d.value / totalVal;
            const dashLength = percentage * circumference;
            const segment = {
                ...d,
                color: d.color || colors[i % colors.length],
                dashArray: `${dashLength} ${circumference - dashLength}`,
                dashOffset: currentOffset,
                percentage: Math.round(percentage * 100),
                radius
            };
            currentOffset -= dashLength;
            return segment;
        });

        return { segments: segs, total: totalVal };
    }, [data, size, strokeWidth, colors]);

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6">
                <p className="text-gray-400 font-medium">No data available</p>
            </div>
        );
    }

    const center = size / 2;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
            )}

            <div className="flex items-center gap-6">
                {/* Chart */}
                <div className="relative" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="transform -rotate-90">
                        {segments.map((seg, i) => (
                            <circle
                                key={i}
                                cx={center}
                                cy={center}
                                r={seg.radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={seg.dashArray}
                                strokeDashoffset={seg.dashOffset}
                                strokeLinecap="round"
                                className="transition-all duration-500 hover:opacity-80"
                            />
                        ))}
                    </svg>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {centerValue !== undefined && (
                            <span className="text-2xl font-black text-gray-900">
                                {typeof centerValue === 'number' ? formatValue(centerValue) : centerValue}
                            </span>
                        )}
                        {centerLabel && (
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {centerLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Legend */}
                {showLegend && (
                    <div className="flex-1 space-y-2">
                        {segments.map((seg, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: seg.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700 truncate">
                                            {seg.label}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 ml-2">
                                            {seg.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DonutChart;
