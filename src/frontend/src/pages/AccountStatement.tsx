import { useQuery } from "@tanstack/react-query";
import { Printer, Search } from "lucide-react";
import { useState } from "react";
import type { Account, Statement, StatementFilter } from "../backend";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useActor } from "../hooks/useActor";
import { dateToNs, fmt, fmtDate } from "../lib/finance";

export default function AccountStatement() {
  const { actor } = useActor();
  const [accountId, setAccountId] = useState("__all__");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filter, setFilter] = useState<StatementFilter | null>(null);

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => actor!.getAllAccounts(),
    enabled: !!actor,
  });

  const { data: statement, isLoading } = useQuery<Statement>({
    queryKey: ["statement", filter],
    queryFn: () => actor!.getStatement(filter!),
    enabled: !!actor && !!filter,
  });

  const handleSearch = () => {
    const f: StatementFilter = {};
    if (accountId && accountId !== "__all__") f.accountId = accountId;
    if (fromDate) f.fromDate = dateToNs(fromDate);
    if (toDate) f.toDate = dateToNs(toDate);
    setFilter(f);
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const rows = statement?.transactions
    ? [...statement.transactions].sort(
        (a, b) => Number(a.date) - Number(b.date),
      )
    : [];

  let runningBalance = statement?.openingBalance ?? 0;
  const tableRows = rows.map((t) => {
    const isIncome = t.transactionType === "Income";
    if (isIncome) runningBalance += t.amount;
    else runningBalance -= t.amount;
    return {
      date: fmtDate(t.date),
      description: t.description,
      credit: isIncome ? t.amount : 0,
      debit: !isIncome ? t.amount : 0,
      balance: runningBalance,
    };
  });

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="bg-card border border-border">
        <div className="tally-panel-header">Filter Statement</div>
        <div className="p-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <Label className="text-[12px] uppercase tracking-wide">
                Account
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger
                  className="rounded-none h-8 text-[13px]"
                  data-ocid="statement.select"
                >
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="__all__">All Accounts</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                From Date
              </Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40 rounded-none h-8 text-[13px]"
                data-ocid="statement.input"
              />
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                To Date
              </Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40 rounded-none h-8 text-[13px]"
                data-ocid="statement.input"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-8"
              data-ocid="statement.submit_button"
            >
              <Search size={12} className="mr-1" /> Get Statement
            </Button>
          </div>
        </div>
      </div>

      {isLoading && (
        <p
          className="text-muted-foreground text-[12px]"
          data-ocid="statement.loading_state"
        >
          Loading statement...
        </p>
      )}

      {!filter && !isLoading && (
        <div
          className="bg-card border border-border p-6 text-center"
          data-ocid="statement.empty_state"
        >
          <Search size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-[12px]">
            Select filters and click "Get Statement" to view.
          </p>
        </div>
      )}

      {statement && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Opening Balance",
                value: statement.openingBalance,
                color: "text-foreground",
              },
              {
                label: "Total Credits",
                value: statement.totalCredits,
                color: "text-green-700",
              },
              {
                label: "Total Expenses",
                value: statement.totalExpenses,
                color: "text-red-600",
              },
              {
                label: "Closing Balance",
                value: statement.closingBalance,
                color:
                  statement.closingBalance >= 0
                    ? "text-green-700"
                    : "text-red-600",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-card border border-border border-t-2 border-t-primary p-3"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className={`mono text-lg font-bold mt-1 ${color}`}>
                  {fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Statement Table */}
          <div className="bg-card border border-border">
            <div className="tally-panel-header flex items-center justify-between">
              <span>
                {selectedAccount ? selectedAccount.name : "All Accounts"} —
                Statement
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white"
                data-ocid="statement.button"
              >
                <Printer size={12} /> Print
              </button>
            </div>
            {tableRows.length === 0 ? (
              <p
                className="text-muted-foreground text-[12px] p-3"
                data-ocid="statement.empty_state"
              >
                No transactions in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full tally-table"
                  data-ocid="statement.table"
                >
                  <thead>
                    <tr>
                      <th className="text-left">Date</th>
                      <th className="text-left">Description</th>
                      <th className="text-right">Credit</th>
                      <th className="text-right">Debit</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={4}
                        className="text-[11px] text-muted-foreground font-semibold bg-secondary"
                      >
                        Opening Balance
                      </td>
                      <td className="text-right mono font-bold bg-secondary">
                        {fmt(statement.openingBalance)}
                      </td>
                    </tr>
                    {tableRows.map((r, i) => (
                      <tr
                        key={`row-${r.date}-${r.description}-${i}`}
                        data-ocid={`statement.item.${i + 1}`}
                      >
                        <td className="mono text-[12px]">{r.date}</td>
                        <td>{r.description || "-"}</td>
                        <td className="text-right mono text-green-700">
                          {r.credit > 0 ? fmt(r.credit) : ""}
                        </td>
                        <td className="text-right mono text-red-600">
                          {r.debit > 0 ? fmt(r.debit) : ""}
                        </td>
                        <td
                          className={`text-right mono font-semibold ${
                            r.balance >= 0 ? "text-foreground" : "text-red-600"
                          }`}
                        >
                          {fmt(r.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
