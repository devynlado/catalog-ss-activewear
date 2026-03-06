'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Bar,
} from 'recharts';

interface DayData {
  date: string;
  revenue: number;
  cogs: number;
  profit: number;
  orders: number;
  adSpend: number;
  pmaxSpend: number;
  searchSpend: number;
}

export function ProfitChart({ data, hasAdSpend }: { data: DayData[]; hasAdSpend: boolean }) {
  const hasPmaxSpend = data.some(d => d.pmaxSpend > 0);
  const hasSearchSpend = data.some(d => d.searchSpend > 0);
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-md text-xs">
        <p className="mb-1.5 font-medium text-slate-700">{formatDate(label)}</p>
        {payload.map((entry: { name: string; value: number; color: string }) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium">${entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e7e5e4' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.08}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="cogs"
            name="COGS"
            stroke="#94a3b8"
            fill="#94a3b8"
            fillOpacity={0.05}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
          {hasAdSpend && !hasPmaxSpend && !hasSearchSpend && (
            <Bar
              dataKey="adSpend"
              name="Ad Spend"
              fill="#f59e0b"
              fillOpacity={0.6}
              barSize={8}
              radius={[2, 2, 0, 0]}
            />
          )}
          {hasPmaxSpend && (
            <Bar
              dataKey="pmaxSpend"
              name="PMax Spend"
              stackId="ads"
              fill="#3b82f6"
              fillOpacity={0.5}
              barSize={10}
              radius={hasSearchSpend ? [0, 0, 0, 0] : [2, 2, 0, 0]}
            />
          )}
          {hasSearchSpend && (
            <Bar
              dataKey="searchSpend"
              name="Search Spend"
              stackId="ads"
              fill="#94a3b8"
              fillOpacity={0.5}
              barSize={10}
              radius={[2, 2, 0, 0]}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
