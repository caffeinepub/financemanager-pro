import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Category, Transaction } from "../backend";
import { useActor } from "../hooks/useActor";
import { fmt } from "../lib/finance";

const COLORS = [
  "#2563EB",
  "#16a34a",
  "#F59E0B",
  "#dc2626",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
];

type ReportTab = "daily" | "monthly" | "yearly";

export default function Reports() {
  const { actor } = useActor();
  const [tab, setTab] = useState<ReportTab>("monthly");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => actor!.getAllTransactions(),
    enabled: !!actor,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
    enabled: !!actor,
  });

  const categoryMap: Record<string, string> = {};
  for (const c of categories) categoryMap[c.id] = c.name;

  const dailyData = (() => {
    const days: Record<
      string,
      { day: string; Income: number; Expense: number }
    > = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days[key] = {
        day: `${d.getDate()}/${d.getMonth() + 1}`,
        Income: 0,
        Expense: 0,
      };
    }
    for (const t of transactions) {
      const ms = Number(t.date) / 1_000_000;
      const key = new Date(ms).toISOString().split("T")[0];
      if (days[key]) {
        if (t.transactionType === "Income") days[key].Income += t.amount;
        else days[key].Expense += t.amount;
      }
    }
    return Object.values(days).filter((d) => d.Income > 0 || d.Expense > 0);
  })();

  const monthlyData = (() => {
    const months: Record<
      string,
      { month: string; Income: number; Expense: number }
    > = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = {
        month: d.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        Income: 0,
        Expense: 0,
      };
    }
    for (const t of transactions) {
      const ms = Number(t.date) / 1_000_000;
      const d = new Date(ms);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) {
        if (t.transactionType === "Income") months[key].Income += t.amount;
        else months[key].Expense += t.amount;
      }
    }
    return Object.values(months);
  })();

  const yearlyData = (() => {
    const years: Record<
      string,
      { year: string; Income: number; Expense: number }
    > = {};
    for (const t of transactions) {
      const ms = Number(t.date) / 1_000_000;
      const y = String(new Date(ms).getFullYear());
      if (!years[y]) years[y] = { year: y, Income: 0, Expense: 0 };
      if (t.transactionType === "Income") years[y].Income += t.amount;
      else years[y].Expense += t.amount;
    }
    return Object.values(years).sort((a, b) => Number(a.year) - Number(b.year));
  })();

  const catBreakdown = (() => {
    const cats: Record<string, number> = {};
    for (const t of transactions.filter(
      (t) => t.transactionType === "Expense",
    )) {
      const name = categoryMap[t.categoryId] || "Uncategorized";
      cats[name] = (cats[name] || 0) + t.amount;
    }
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  })();

  const currentData =
    tab === "daily" ? dailyData : tab === "monthly" ? monthlyData : yearlyData;
  const xKey = tab === "daily" ? "day" : tab === "monthly" ? "month" : "year";

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="bg-card border border-border">
        <div className="tally-panel-header flex items-center justify-between">
          <span>Income vs Expense Report</span>
          <div className="flex gap-0">
            {(["daily", "monthly", "yearly"] as ReportTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-0.5 text-[11px] uppercase tracking-wide rounded-none ${
                  tab === t
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-white/60 hover:text-white"
                }`}
                data-ocid="reports.tab"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3">
          {currentData.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">
              No data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={currentData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.015 255)"
                />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Income" fill="#16a34a" />
                <Bar dataKey="Expense" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {currentData.length > 0 && (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full tally-table">
              <thead>
                <tr>
                  <th className="text-left">
                    {xKey.charAt(0).toUpperCase() + xKey.slice(1)}
                  </th>
                  <th className="text-right" style={{ color: "#16a34a" }}>
                    Income
                  </th>
                  <th className="text-right" style={{ color: "#dc2626" }}>
                    Expense
                  </th>
                  <th className="text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((row) => {
                  const net = (row.Income as number) - (row.Expense as number);
                  const rowKey = row[xKey] as string;
                  return (
                    <tr key={rowKey}>
                      <td className="mono">{rowKey}</td>
                      <td className="text-right mono text-green-700">
                        {fmt(row.Income as number)}
                      </td>
                      <td className="text-right mono text-red-600">
                        {fmt(row.Expense as number)}
                      </td>
                      <td
                        className={`text-right mono font-semibold ${net >= 0 ? "text-green-700" : "text-red-600"}`}
                      >
                        {fmt(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-card border border-border">
        <div className="tally-panel-header">Expense Category Breakdown</div>
        <div className="p-3">
          {catBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-[12px]">
              No expense data to display.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <ResponsiveContainer width={240} height={200}>
                <PieChart>
                  <Pie
                    data={catBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {catBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1">
                <table className="w-full tally-table">
                  <thead>
                    <tr>
                      <th className="text-left">Category</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catBreakdown.map((c, i) => (
                      <tr key={c.name}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            {c.name}
                          </div>
                        </td>
                        <td className="text-right mono font-semibold">
                          {fmt(c.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
