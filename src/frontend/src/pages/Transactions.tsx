import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Account, Category, Transaction } from "../backend";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
import { dateToNs, fmt, fmtDate, nowNs, uid } from "../lib/finance";

type TxType = "Income" | "Expense";

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  transactionType: "Income" as TxType,
  accountId: "",
  categoryId: "",
  description: "",
  amount: "",
  receiptNote: "",
};

export default function Transactions() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | TxType>("all");

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

  const save = useMutation({
    mutationFn: (t: Transaction) => actor!.saveTransaction(t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => actor!.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const openAdd = (type?: TxType) => {
    setForm({ ...emptyForm, transactionType: type || "Income" });
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (t: Transaction) => {
    const ms = Number(t.date) / 1_000_000;
    setForm({
      date: new Date(ms).toISOString().split("T")[0],
      transactionType: t.transactionType as TxType,
      accountId: t.accountId,
      categoryId: t.categoryId,
      description: t.description,
      amount: String(t.amount),
      receiptNote: t.receiptNote,
    });
    setEditId(t.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.amount || !form.accountId || !actor) return;
    const tx: Transaction = {
      id: editId || uid(),
      date: form.date ? dateToNs(form.date) : nowNs(),
      transactionType: form.transactionType,
      accountId: form.accountId,
      categoryId: form.categoryId,
      description: form.description.trim(),
      amount: Number.parseFloat(form.amount),
      receiptNote: form.receiptNote.trim(),
    };
    save.mutate(tx);
  };

  const accountMap: Record<string, string> = {};
  for (const a of accounts) accountMap[a.id] = a.name;
  const categoryMap: Record<string, string> = {};
  for (const c of categories) categoryMap[c.id] = c.name;

  const filteredCats = categories.filter(
    (c) => c.categoryType === form.transactionType,
  );
  const sorted = [...transactions].sort(
    (a, b) => Number(b.date) - Number(a.date),
  );
  const filtered =
    filterType === "all"
      ? sorted
      : sorted.filter((t) => t.transactionType === filterType);

  const submitDisabled = save.isPending;
  const submitLabel = save.isPending
    ? "Saving..."
    : editId
      ? "Update"
      : "Add Transaction";

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button
          onClick={() => openAdd("Income")}
          className="bg-green-700 hover:bg-green-800 text-white rounded-none text-[12px] uppercase tracking-wide h-7 px-3"
          data-ocid="transactions.primary_button"
        >
          <Plus size={12} className="mr-1" /> Add Income
        </Button>
        <Button
          onClick={() => openAdd("Expense")}
          className="bg-red-700 hover:bg-red-800 text-white rounded-none text-[12px] uppercase tracking-wide h-7 px-3"
          data-ocid="transactions.secondary_button"
        >
          <Plus size={12} className="mr-1" /> Add Expense
        </Button>
      </div>

      <div className="bg-card border border-border">
        <div className="tally-panel-header flex items-center justify-between">
          <span>Transaction List</span>
          <div className="flex gap-0">
            {(["all", "Income", "Expense"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={`px-3 py-0.5 text-[11px] uppercase tracking-wide rounded-none transition-none ${
                  filterType === f
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-white/60 hover:text-white"
                }`}
                data-ocid="transactions.tab"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p
              className="text-muted-foreground text-[12px] p-3"
              data-ocid="transactions.empty_state"
            >
              No transactions found.
            </p>
          ) : (
            <table
              className="w-full tally-table"
              data-ocid="transactions.table"
            >
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Description</th>
                  <th className="text-left">Account</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, idx) => (
                  <tr key={t.id} data-ocid={`transactions.item.${idx + 1}`}>
                    <td className="mono text-[12px]">{fmtDate(t.date)}</td>
                    <td>{t.description || "-"}</td>
                    <td className="text-muted-foreground">
                      {accountMap[t.accountId] || "-"}
                    </td>
                    <td className="text-muted-foreground">
                      {categoryMap[t.categoryId] || "-"}
                    </td>
                    <td>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 ${
                          t.transactionType === "Income"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.transactionType}
                      </span>
                    </td>
                    <td
                      className={`text-right mono font-semibold ${
                        t.transactionType === "Income"
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {t.transactionType === "Income" ? "+" : "-"}
                      {fmt(t.amount)}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="p-1 text-muted-foreground hover:text-primary"
                          data-ocid={`transactions.edit_button.${idx + 1}`}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete?")) del.mutate(t.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          data-ocid={`transactions.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="text-[13px] uppercase tracking-wide">
              {editId ? "Edit Transaction" : `Add ${form.transactionType}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3" data-ocid="transactions.dialog">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px] uppercase tracking-wide">
                  Type *
                </Label>
                <Select
                  value={form.transactionType}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      transactionType: v as TxType,
                      categoryId: "",
                    }))
                  }
                >
                  <SelectTrigger
                    className="rounded-none h-8 text-[13px]"
                    data-ocid="transactions.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12px] uppercase tracking-wide">
                  Date *
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="rounded-none h-8 text-[13px]"
                  data-ocid="transactions.input"
                />
              </div>
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Account *
              </Label>
              <Select
                value={form.accountId}
                onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}
              >
                <SelectTrigger
                  className="rounded-none h-8 text-[13px]"
                  data-ocid="transactions.select"
                >
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
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
                Category
              </Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger className="rounded-none h-8 text-[13px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {filteredCats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Description
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Enter description"
                className="rounded-none h-8 text-[13px]"
                data-ocid="transactions.input"
              />
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Amount (₹) *
              </Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
                className="rounded-none h-8 text-[13px] mono"
                data-ocid="transactions.input"
              />
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Receipt Note
              </Label>
              <Input
                value={form.receiptNote}
                onChange={(e) =>
                  setForm((f) => ({ ...f, receiptNote: e.target.value }))
                }
                placeholder="Optional note for receipt"
                className="rounded-none h-8 text-[13px]"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-8"
              disabled={submitDisabled}
              data-ocid="transactions.submit_button"
            >
              {submitLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
