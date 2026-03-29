import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Account, AccountType } from "../backend";
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
import { fmt, uid } from "../lib/finance";
import { getActorAsync } from "../utils/actorStore";

const emptyForm = {
  name: "",
  accountType: "Bank" as AccountType,
  openingBalance: "",
};

export default function Accounts() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => actor!.getAllAccounts(),
    enabled: !!actor,
  });

  const save = useMutation({
    mutationFn: async (a: Account) => {
      const backendActor = actor || (await getActorAsync());
      return backendActor.saveAccount(a);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save account. Please try again.";
      setDialogError(msg);
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const backendActor = actor || (await getActorAsync());
      return backendActor.deleteAccount(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
    onError: () => {
      alert("Failed to delete account. Please try again.");
    },
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setDialogError(null);
    setOpen(true);
  };
  const openEdit = (a: Account) => {
    setForm({
      name: a.name,
      accountType: a.accountType,
      openingBalance: String(a.openingBalance),
    });
    setEditId(a.id);
    setDialogError(null);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setDialogError("Account name is required.");
      return;
    }
    setDialogError(null);
    const ob = Number.parseFloat(form.openingBalance) || 0;
    const acc: Account = {
      id: editId || uid(),
      name: form.name.trim(),
      accountType: form.accountType,
      openingBalance: ob,
      currentBalance: ob,
    };
    save.mutate(acc);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const submitDisabled = save.isPending;
  const submitLabel = save.isPending
    ? "Saving..."
    : editId
      ? "Update Account"
      : "Add Account";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-muted-foreground">
          Total across all accounts:{" "}
          <span className="mono font-bold text-foreground">
            {fmt(totalBalance)}
          </span>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-7 px-3"
          data-ocid="accounts.open_modal_button"
        >
          <Plus size={12} className="mr-1" /> Add Account
        </Button>
      </div>

      <div className="bg-card border border-border">
        <div className="tally-panel-header">Accounts List</div>
        {accounts.length === 0 ? (
          <p
            className="text-muted-foreground text-[12px] p-4"
            data-ocid="accounts.empty_state"
          >
            No accounts yet. Add your first account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tally-table" data-ocid="accounts.table">
              <thead>
                <tr>
                  <th className="text-left">Account Name</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Opening Balance</th>
                  <th className="text-right">Current Balance</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, idx) => (
                  <tr key={a.id} data-ocid={`accounts.item.${idx + 1}`}>
                    <td className="font-medium">{a.name}</td>
                    <td>
                      <span className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground font-semibold">
                        {a.accountType}
                      </span>
                    </td>
                    <td className="text-right mono">{fmt(a.openingBalance)}</td>
                    <td
                      className={`text-right mono font-bold ${
                        a.currentBalance >= 0
                          ? "text-green-700"
                          : "text-red-600"
                      }`}
                    >
                      {fmt(a.currentBalance)}
                    </td>
                    <td className="text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="p-1 text-muted-foreground hover:text-primary"
                          data-ocid={`accounts.edit_button.${idx + 1}`}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete this account?"))
                              del.mutate(a.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          data-ocid={`accounts.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="text-[13px] uppercase tracking-wide">
              {editId ? "Edit Account" : "Add Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3" data-ocid="accounts.dialog">
            {dialogError && (
              <div
                className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-3 py-2"
                data-ocid="accounts.error_state"
              >
                {dialogError}
              </div>
            )}
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Account Name *
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. HDFC Bank"
                className="rounded-none h-8 text-[13px]"
                data-ocid="accounts.input"
              />
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Account Type *
              </Label>
              <Select
                value={form.accountType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, accountType: v as AccountType }))
                }
              >
                <SelectTrigger
                  className="rounded-none h-8 text-[13px]"
                  data-ocid="accounts.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Opening Balance (₹)
              </Label>
              <Input
                type="number"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm((f) => ({ ...f, openingBalance: e.target.value }))
                }
                placeholder="0.00"
                className="rounded-none h-8 text-[13px] mono"
                data-ocid="accounts.input"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-8"
              disabled={submitDisabled}
              data-ocid="accounts.submit_button"
            >
              {submitLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
