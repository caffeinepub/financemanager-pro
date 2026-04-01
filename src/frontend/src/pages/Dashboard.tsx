import { useQuery } from "@tanstack/react-query";
import {
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Page } from "../App";
import type { Account, Transaction } from "../backend";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import {
  fmt,
  fmtDate,
  isExpenseType,
  isIncomeType,
  txTypeLabel,
} from "../lib/finance";

interface Props {
  setPage: (p: Page) => void;
}

export default function Dashboard({ setPage }: Props) {
  const { actor } = useActor();

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => actor!.getAllTransactions(),
    enabled: !!actor,
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => actor!.getAllAccounts(),
    enabled: !!actor,
  });

  const totalIncome = transactions
    .filter((t) => isIncomeType(t.transactionType))
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => isExpenseType(t.transactionType))
    .reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : "0.0";

  const monthlyData = (() => {
    const months: Record<
      string,
      { month: string; Income: number; Expense: number }
    > = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
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
        if (isIncomeType(t.transactionType)) months[key].Income += t.amount;
        else months[key].Expense += t.amount;
      }
    }
    return Object.values(months);
  })();

  const recent = [...transactions]
    .sort((a, b) => Number(b.date) - Number(a.date))
    .slice(0, 8);

  const accountMap: Record<string, string> = {};
  for (const a of accounts) accountMap[a.id] = a.name;

  const kpiCards = [
    {
      label: "Total Income",
      value: fmt(totalIncome),
      icon: TrendingUp,
      color: "oklch(var(--tally-income))",
    },
    {
      label: "Total Expense",
      value: fmt(totalExpense),
      icon: TrendingDown,
      color: "oklch(var(--tally-expense))",
    },
    {
      label: "Net Balance",
      value: fmt(netBalance),
      icon: Wallet,
      color:
        netBalance >= 0
          ? "oklch(var(--tally-income))"
          : "oklch(var(--tally-expense))",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate}%`,
      icon: PiggyBank,
      color: "oklch(var(--primary))",
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card border border-border border-t-2 p-3"
            style={{ borderTopColor: color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {label}
                </p>
                <p className="mono text-xl font-bold mt-1" style={{ color }}>
                  {value}
                </p>
              </div>
              <Icon size={20} style={{ color, opacity: 0.6 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Account Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-card border border-border">
          <div className="tally-panel-header">
            Income vs Expense — Last 6 Months
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={monthlyData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.015 255)"
                />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Income" fill="#16a34a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Expense" fill="#dc2626" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border">
          <div className="tally-panel-header">Account Balances</div>
          <div className="overflow-x-auto">
            {accounts.length === 0 ? (
              <p className="text-muted-foreground text-[12px] p-3">
                No accounts yet.
              </p>
            ) : (
              <table className="w-full tally-table">
                <thead>
                  <tr>
                    <th className="text-left">Account</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="text-[13px]">{a.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {a.accountType}
                        </div>
                      </td>
                      <td
                        className={`text-right mono font-semibold ${
                          a.currentBalance >= 0
                            ? "text-green-700"
                            : "text-red-600"
                        }`}
                      >
                        {fmt(a.currentBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border">
        <div className="tally-panel-header flex items-center justify-between">
          <span>Recent Transactions</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setPage("transactions")}
              className="bg-green-700 hover:bg-green-800 text-white rounded-none text-[11px] uppercase tracking-wide h-6 px-2"
              data-ocid="dashboard.primary_button"
            >
              <Plus size={10} className="mr-1" /> Income
            </Button>
            <Button
              size="sm"
              onClick={() => setPage("transactions")}
              className="bg-red-700 hover:bg-red-800 text-white rounded-none text-[11px] uppercase tracking-wide h-6 px-2"
              data-ocid="dashboard.secondary_button"
            >
              <Plus size={10} className="mr-1" /> Expense
            </Button>
          </div>
        </div>
        {recent.length === 0 ? (
          <p
            className="text-muted-foreground text-[12px] p-3"
            data-ocid="dashboard.empty_state"
          >
            No transactions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tally-table" data-ocid="dashboard.table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Account</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t, idx) => (
                  <tr key={t.id} data-ocid={`dashboard.item.${idx + 1}`}>
                    <td className="mono text-[12px]">{fmtDate(t.date)}</td>
                    <td>{t.description || "-"}</td>
                    <td className="text-muted-foreground">
                      {accountMap[t.accountId] || "-"}
                    </td>
                    <td>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 ${
                          isIncomeType(t.transactionType)
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {txTypeLabel(t.transactionType)}
                      </span>
                    </td>
                    <td
                      className={`text-right mono font-semibold ${
                        isIncomeType(t.transactionType)
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {isIncomeType(t.transactionType) ? "+" : "-"}
                      {fmt(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
