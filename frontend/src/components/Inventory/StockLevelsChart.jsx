import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StockLevelsChart = ({ inventory, height = 320 }) => {
  const formatKg = (v) => `${Number(v || 0).toFixed(3)} Kg`;
  const formatKgTick = (v) => Number(v || 0).toFixed(3);

  const barData = useMemo(() => {
    return (inventory || [])
      .map((item) => ({ name: item.name, stock: Number(item.stock) || 0 }))
      .sort((a, b) => b.stock - a.stock);
  }, [inventory]);

  const renderNameTick = (props) => {
    const { x, y, payload } = props;
    const name = String(payload?.value ?? "");
    const maxLen = 16;
    const display = name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          dy={12}
          textAnchor="end"
          fill="#0f172a"
          fontSize={12}
          fontWeight={500}
          transform="rotate(-30)"
        >
          {display}
        </text>
        <title>{name}</title>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="name"
          type="category"
          allowDuplicatedCategory={false}
          interval={0}
          tick={renderNameTick}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          height={70}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          label={{ value: 'Kg', angle: -90, position: 'insideLeft', offset: 8, style: { fill: '#64748b', fontSize: 12 } }}
          tickFormatter={formatKgTick}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value, name) => name === 'stock' ? [formatKg(value), 'Stock'] : [value, name]}
        />
        <Bar dataKey="stock" fill="url(#stockGradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StockLevelsChart;
