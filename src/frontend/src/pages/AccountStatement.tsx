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
import { dateToNs, fmt, fmtDate, isIncomeType } from "../lib/finance";

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
    const isIncome = isIncomeType(t.transactionType);
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

  const totalCredits = tableRows.reduce((s, r) => s + r.credit, 0);
  const totalDebits = tableRows.reduce((s, r) => s + r.debit, 0);

  const handlePrint = () => {
    if (!statement) return;
    const accountName = selectedAccount ? selectedAccount.name : "All Accounts";
    const dateRange =
      fromDate || toDate
        ? `${fromDate || "Beginning"} to ${toDate || "Today"}`
        : "All Dates";

    const rowsHtml = tableRows
      .map(
        (r) => `
      <tr>
        <td>${r.date}</td>
        <td>${r.description || "-"}</td>
        <td style="text-align:right">${r.credit > 0 ? fmt(r.credit) : ""}</td>
        <td style="text-align:right">${r.debit > 0 ? fmt(r.debit) : ""}</td>
        <td style="text-align:right">${fmt(r.balance)}</td>
      </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Account Statement – ${accountName}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; margin: 5px; color: #111; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 16px; margin: 0 0 3px; font-weight: normal; }
    .subtitle { font-size: 12px; color: #555; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
    th.right, td.right { text-align: right; }
    td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
    tr.opening td { background: #f5f5f5; font-weight: bold; }
    tr:nth-child(even) td { background: #fafafa; }
    @page { size: A4; margin: 15mm; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>FinanceManager Pro</h1>
  <h2>Account Statement – ${accountName}</h2>
  <div class="subtitle">Period: ${dateRange}</div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Description</th>
        <th class="right">Credit</th><th class="right">Debit</th><th class="right">Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr class="opening">
        <td colspan="4">Opening Balance</td>
        <td style="text-align:right">${fmt(statement.openingBalance)}</td>
      </tr>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) {
      alert("Please allow popups for this site to print the statement.");
      return;
    }
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

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
          {/* Summary Cards — screen only */}
          <div className="no-print grid grid-cols-4 gap-3">
            {[
              {
                label: "Opening Balance",
                value: statement.openingBalance,
                color: "text-foreground",
              },
              {
                label: "Total Credits",
                value: totalCredits,
                color: "text-green-700",
              },
              {
                label: "Total Debits",
                value: totalDebits,
                color: "text-red-600",
              },
              {
                label: "Closing Balance",
                value: runningBalance,
                color: runningBalance >= 0 ? "text-foreground" : "text-red-600",
              },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border">
                <div className="tally-panel-header text-[11px]">
                  {card.label}
                </div>
                <div className="p-3">
                  <span className={`mono text-[15px] font-bold ${card.color}`}>
                    {fmt(card.value)}
                  </span>
                </div>
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
                onClick={handlePrint}
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
