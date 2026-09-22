"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { OptimizeResponse } from "@sandbox/shared";

export function ComparisonChart({ response }: { response: OptimizeResponse }) {
  const data = [
    {
      metric: "Avg waiting time (sec)",
      baseline: response.baseline.average_waiting_time_sec,
      optimized: response.optimized.average_waiting_time_sec,
    },
    {
      metric: "Throughput (vehicles)",
      baseline: response.baseline.throughput_vehicles,
      optimized: response.optimized.throughput_vehicles,
    },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="metric" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="baseline" fill="#94a3b8" name="Baseline" />
          <Bar dataKey="optimized" fill="#2563eb" name="Optimized" />
        </BarChart>
      </ResponsiveContainer>
      <p>
        Waiting time improvement: {response.improvement.waiting_time_percent.toFixed(1)}% —
        Throughput improvement: {response.improvement.throughput_percent.toFixed(1)}%
      </p>
    </div>
  );
}
