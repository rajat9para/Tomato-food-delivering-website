import { useMemo } from 'react';

interface DataPoint {
    label: string;
    value: number;
}

interface AreaChartProps {
    data: DataPoint[];
    title?: string;
    subtitle?: string;
    height?: number;
    gradientFrom?: string;
    gradientTo?: string;
    lineColor?: string;
    showPoints?: boolean;
    showGrid?: boolean;
    showYAxis?: boolean;
    formatValue?: (value: number) => string;
}

const AreaChart = ({
    data,
    title,
    subtitle,
    height = 280,
    gradientFrom = '#10b981',
    gradientTo = '#10b98100',
    lineColor = '#059669',
    showPoints = true,
    showGrid = true,
    showYAxis = true,
    formatValue = (v) => `₹${v.toLocaleString()}`
}: AreaChartProps) => {
    const chartId = useMemo(() => `area-chart-${Math.random().toString(36).substr(2, 9)}`, []);

    const { pathD, areaD, points, gridLines } = useMemo(() => {
        if (!data || data.length === 0) {
            return { pathD: '', areaD: '', points: [], maxValue: 0, gridLines: [] };
        }

        const maxVal = Math.max(...data.map(d => d.value), 1);
        const padding = { top: 20, right: 20, bottom: 40, left: showYAxis ? 60 : 20 };
        const width = 800;
        const chartHeight = height - padding.top - padding.bottom;
        const chartWidth = width - padding.left - padding.right;

        const pointsArr = data.map((d, i) => ({
            x: padding.left + (i / (data.length - 1 || 1)) * chartWidth,
            y: padding.top + chartHeight - (d.value / maxVal) * chartHeight,
            value: d.value,
            label: d.label
        }));

        // Generate smooth bezier curve path
        let path = `M ${pointsArr[0].x},${pointsArr[0].y}`;
        for (let i = 1; i < pointsArr.length; i++) {
            const prev = pointsArr[i - 1];
            const curr = pointsArr[i];
            const cpx = (prev.x + curr.x) / 2;
            path += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
        }

        // Area path (closed)
        const areaPath = path +
            ` L ${pointsArr[pointsArr.length - 1].x},${padding.top + chartHeight}` +
            ` L ${pointsArr[0].x},${padding.top + chartHeight} Z`;

        // Grid lines (4 horizontal lines)
        const grids = [0, 1, 2, 3, 4].map(i => ({
            y: padding.top + (i / 4) * chartHeight,
            value: Math.round(maxVal * (4 - i) / 4)
        }));

        return { pathD: path, areaD: areaPath, points: pointsArr, maxValue: maxVal, gridLines: grids };
    }, [data, height, showYAxis]);

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200" style={{ height }}>
                <p className="text-gray-400 font-medium">No data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {(title || subtitle) && (
                <div className="mb-6">
                    {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
            )}

            <div className="relative" style={{ height }}>
                <svg
                    viewBox={`0 0 800 ${height}`}
                    className="w-full h-full"
                    preserveAspectRatio="none"
                >
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id={chartId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={gradientTo} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {showGrid && gridLines.map((line, i) => (
                        <line
                            key={i}
                            x1={showYAxis ? 60 : 20}
                            y1={line.y}
                            x2={780}
                            y2={line.y}
                            stroke="#f3f4f6"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Area Fill */}
                    <path
                        d={areaD}
                        fill={`url(#${chartId})`}
                        className="transition-all duration-500"
                    />

                    {/* Line */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500"
                    />

                    {/* Data Points */}
                    {showPoints && points.map((point, i) => (
                        <g key={i} className="group cursor-pointer">
                            {/* Hover area */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="20"
                                fill="transparent"
                                className="group-hover:fill-gray-100/50"
                            />
                            {/* Outer glow */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="8"
                                fill={lineColor}
                                fillOpacity="0.2"
                                className="group-hover:r-12 transition-all"
                            />
                            {/* Inner dot */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="white"
                                stroke={lineColor}
                                strokeWidth="2"
                                className="group-hover:r-6 transition-all"
                            />
                            {/* Tooltip */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <rect
                                    x={point.x - 40}
                                    y={point.y - 45}
                                    width="80"
                                    height="30"
                                    rx="6"
                                    fill="#1f2937"
                                />
                                <text
                                    x={point.x}
                                    y={point.y - 25}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="12"
                                    fontWeight="bold"
                                >
                                    {formatValue(point.value)}
                                </text>
                            </g>
                        </g>
                    ))}
                </svg>

                {/* Y Axis Labels */}
                {showYAxis && (
                    <div className="absolute left-0 top-5 bottom-10 flex flex-col justify-between text-xs text-gray-400 font-medium">
                        {gridLines.map((line, i) => (
                            <span key={i}>{formatValue(line.value)}</span>
                        ))}
                    </div>
                )}

                {/* X Axis Labels */}
                <div className="flex justify-between px-4 mt-2">
                    {data.map((d, i) => (
                        <span key={i} className="text-xs text-gray-500 font-medium">
                            {d.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AreaChart;
