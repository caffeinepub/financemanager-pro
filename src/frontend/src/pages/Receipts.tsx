import { useQuery } from "@tanstack/react-query";
import { Printer, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { Account, Category, Transaction } from "../backend";
import { useActor } from "../hooks/useActor";
import { fmt, fmtDate } from "../lib/finance";

export default function Receipts() {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");

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
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
    enabled: !!actor,
  });

  const accountMap: Record<string, string> = {};
  for (const a of accounts) accountMap[a.id] = a.name;
  const categoryMap: Record<string, string> = {};
  for (const c of categories) categoryMap[c.id] = c.name;

  const sorted = [...transactions].sort(
    (a, b) => Number(b.date) - Number(a.date),
  );
  const income = sorted.filter((t) => t.transactionType === "Income");
  const expense = sorted.filter((t) => t.transactionType === "Expense");

  const handlePrintAll = () => {
    const receiptRows = income
      .map(
        (t, i) => `
    <div style="margin-bottom:32px;page-break-inside:avoid">
      <div style="display:inline-block;background:#dcfce7;color:#166534;padding:3px 12px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">INCOME RECEIPT</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <tbody>
          <tr><td style="color:#666;padding:4px 0;width:40%">RECEIPT NO</td><td style="text-align:right;font-weight:700">#${String(i + 1).padStart(4, "0")}</td></tr>
          <tr><td colspan="2"><div style="border-bottom:1px dotted #ccc"></div></td></tr>
          <tr><td style="color:#666;padding:4px 0">DATE</td><td style="text-align:right;font-weight:700">${fmtDate(t.date)}</td></tr>
          <tr><td colspan="2"><div style="border-bottom:1px dotted #ccc"></div></td></tr>
          <tr><td style="color:#666;padding:4px 0">DESCRIPTION</td><td style="text-align:right">${t.description || "-"}</td></tr>
          <tr><td colspan="2"><div style="border-bottom:1px dotted #ccc"></div></td></tr>
          <tr><td style="color:#666;padding:4px 0">ACCOUNT</td><td style="text-align:right">${accountMap[t.accountId] || "-"}</td></tr>
          <tr><td colspan="2"><div style="border-bottom:1px dotted #ccc"></div></td></tr>
          <tr><td style="color:#666;padding:4px 0">CATEGORY</td><td style="text-align:right">${categoryMap[t.categoryId] || "-"}</td></tr>
          ${t.receiptNote ? `<tr><td colspan="2"><div style="border-bottom:1px dotted #ccc"></div></td></tr><tr><td style="color:#666;padding:4px 0">NOTE</td><td style="text-align:right">${t.receiptNote}</td></tr>` : ""}
          <tr><td colspan="2"><div style="border-top:2px dashed #333;margin-top:10px;padding-top:8px"></div></td></tr>
          <tr>
            <td style="color:#555;font-weight:700;letter-spacing:1px;font-size:12px">TOTAL</td>
            <td style="text-align:right;font-size:18px;font-weight:900;color:#166534">+${fmt(t.amount)}</td>
          </tr>
        </tbody>
      </table>
      ${i < income.length - 1 ? '<div style="border-bottom:2px dashed #999;margin-top:20px;margin-bottom:4px"></div>' : ""}
    </div>`,
      )
      .join("");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Income Receipts - FinanceManager Pro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: white; color: black; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div style="max-width:480px;margin:0 auto;font-family:'Courier New',monospace;background:white;color:black;padding:32px 28px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:16px;font-weight:900;letter-spacing:2px;text-transform:uppercase">FinanceManager Pro</div>
      <div style="font-size:10px;color:#888;margin-top:2px">Income &amp; Expense Manager</div>
      <div style="border-bottom:2px dashed #333;margin-top:10px"></div>
    </div>
    ${receiptRows}
    <div style="text-align:center;margin-top:16px;border-top:1px dashed #ccc;padding-top:10px">
      <div style="font-size:10px;color:#aaa;letter-spacing:2px">* * * THANK YOU * * *</div>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  <\/script>
</body>
</html>`;

    const printWindow = window.open(
      "",
      "_blank",
      "width=650,height=900,scrollbars=yes",
    );
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
    } else {
      alert(
        "Please allow popups for this site to print receipts, then try again.",
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center gap-0 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("income")}
          data-ocid="receipts.tab"
          className={`px-4 py-2 text-[11px] uppercase tracking-widest font-bold transition-none border-b-2 ${
            activeTab === "income"
              ? "border-green-400 text-green-400"
              : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expense")}
          data-ocid="receipts.tab"
          className={`px-4 py-2 text-[11px] uppercase tracking-widest font-bold transition-none border-b-2 ${
            activeTab === "expense"
              ? "border-red-400 text-red-400"
              : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Expense
        </button>
      </div>

      {/* Income Tab */}
      {activeTab === "income" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-[13px] uppercase tracking-widest font-bold text-green-400">
                Income Receipts
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono bg-green-800 text-green-200">
                {income.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold mono text-green-400">
                Total: {fmt(income.reduce((s, t) => s + t.amount, 0))}
              </span>
              {income.length > 0 && (
                <button
                  type="button"
                  onClick={handlePrintAll}
                  className="flex items-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-widest font-bold rounded-none border border-green-600 text-green-400 hover:bg-green-950/40 transition-none"
                  data-ocid="receipts.primary_button"
                >
                  <Printer size={12} />
                  Print Income Receipts
                </button>
              )}
            </div>
          </div>

          {income.length === 0 ? (
            <p
              className="text-muted-foreground text-[12px] p-4"
              data-ocid="receipts.empty_state"
            >
              No income receipts found.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {income.map((t, i) => (
                <div
                  key={t.id}
                  data-ocid={`receipts.item.${i + 1}`}
                  className="flex flex-col"
                  style={{
                    fontFamily: "'Courier New', monospace",
                    background: "oklch(0.16 0.04 255)",
                    border: "1px solid oklch(0.35 0.12 145)",
                  }}
                >
                  <div
                    className="px-3 py-2 flex items-center justify-between"
                    style={{ background: "oklch(0.25 0.1 145)" }}
                  >
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                      style={{ color: "#86efac" }}
                    >
                      <TrendingUp size={11} />
                      INCOME RECEIPT
                    </span>
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: "#86efac" }}
                    >
                      #{String(i + 1).padStart(4, "0")}
                    </span>
                  </div>
                  <div
                    className="mx-3 my-0"
                    style={{
                      borderBottom: "1.5px dashed oklch(0.35 0.12 145)",
                    }}
                  />
                  <div className="px-3 py-3 flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Date
                      </span>
                      <span className="text-[13px] font-bold text-white mono">
                        {fmtDate(t.date)}
                      </span>
                    </div>
                    <div
                      style={{
                        borderBottom: "1px dotted rgba(255,255,255,0.1)",
                      }}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">
                        Desc
                      </span>
                      <span className="text-[12px] text-white/90 text-right">
                        {t.description || "(No description)"}
                      </span>
                    </div>
                    <div
                      style={{
                        borderBottom: "1px dotted rgba(255,255,255,0.1)",
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Account
                      </span>
                      <span className="text-[12px] text-white/80">
                        {accountMap[t.accountId] || "-"}
                      </span>
                    </div>
                    <div
                      style={{
                        borderBottom: "1px dotted rgba(255,255,255,0.1)",
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Category
                      </span>
                      <span className="text-[12px] text-white/80">
                        {categoryMap[t.categoryId] || "-"}
                      </span>
                    </div>
                    {t.receiptNote && (
                      <>
                        <div
                          style={{
                            borderBottom: "1px dotted rgba(255,255,255,0.1)",
                          }}
                        />
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">
                            Note
                          </span>
                          <span className="text-[11px] italic text-white/60 text-right">
                            {t.receiptNote}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    className="mx-3"
                    style={{ borderTop: "1.5px dashed oklch(0.35 0.12 145)" }}
                  />
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-white/30">
                        Total Amount
                      </div>
                      <div
                        className="text-[18px] font-black mono leading-tight"
                        style={{ color: "#86efac" }}
                      >
                        +{fmt(t.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expense Tab */}
      {activeTab === "expense" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <TrendingDown size={14} className="text-red-400" />
              <span className="text-[13px] uppercase tracking-widest font-bold text-red-400">
                Expense Receipts
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-mono bg-red-900 text-red-200">
                {expense.length}
              </span>
            </div>
            <span className="text-[12px] font-bold mono text-red-400">
              Total: -{fmt(expense.reduce((s, t) => s + t.amount, 0))}
            </span>
          </div>

          {expense.length === 0 ? (
            <p
              className="text-muted-foreground text-[12px] p-4"
              data-ocid="receipts.empty_state"
            >
              No expense receipts found.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expense.map((t, i) => (
                <div
                  key={t.id}
                  data-ocid={`receipts.item.${i + 1}`}
                  className="flex flex-col"
                  style={{
                    fontFamily: "'Courier New', monospace",
                    background: "oklch(0.14 0.04 20)",
                    border: "1px solid oklch(0.35 0.12 25)",
                  }}
                >
                  <div
                    className="px-3 py-2 flex items-center justify-between"
                    style={{ background: "oklch(0.22 0.1 25)" }}
                  >
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                      style={{ color: "#fca5a5" }}
                    >
                      <TrendingDown size={11} />
                      EXPENSE RECEIPT
                    </span>
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: "#fca5a5" }}
                    >
                      #{String(i + 1).padStart(4, "0")}
                    </span>
                  </div>
                  <div
                    className="mx-3 my-0"
                    style={{
                      borderBottom: "1.5px dashed oklch(0.35 0.12 25)",
                    }}
                  />
                  <div className="px-3 py-3 flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Date
                      </span>
                      <span className="text-[13px] font-bold text-white mono">
                        {fmtDate(t.date)}
                      </span>
                    </div>
                    <div
                      style={{
                        borderBottom: "1px dotted rgba(255,255,255,0.1)",
                      }}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">
                        Desc
                      </span>
                      <span className="text-[12px] text-white/90 text-right">
                        {t.description || "(No description)"}
                      </span>
                    </div>
                    <div
                      style={{
                        borderBottom: "1px dotted rgba(255,255,255,0.1)",
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Account
                      </span>
                      <span className="text-[12px] text-white/80">
                        {accountMap[t.accountId] || "-"}
                      </span>
                    </div>
                    <div
                      style={{
                        borderBottom: "1px dotted rgba(255,255,255,0.1)",
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Category
                      </span>
                      <span className="text-[12px] text-white/80">
                        {categoryMap[t.categoryId] || "-"}
                      </span>
                    </div>
                    {t.receiptNote && (
                      <>
                        <div
                          style={{
                            borderBottom: "1px dotted rgba(255,255,255,0.1)",
                          }}
                        />
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">
                            Note
                          </span>
                          <span className="text-[11px] italic text-white/60 text-right">
                            {t.receiptNote}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    className="mx-3"
                    style={{ borderTop: "1.5px dashed oklch(0.35 0.12 25)" }}
                  />
                  <div className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-white/30">
                        Total Amount
                      </div>
                      <div
                        className="text-[18px] font-black mono leading-tight"
                        style={{ color: "#fca5a5" }}
                      >
                        -{fmt(t.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
