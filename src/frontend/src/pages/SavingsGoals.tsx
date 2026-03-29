import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SavingsGoal } from "../backend";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useActor } from "../hooks/useActor";
import { dateToNs, fmt, uid } from "../lib/finance";

const emptyForm = {
  name: "",
  targetAmount: "",
  currentAmount: "",
  deadline: "",
  description: "",
};

const getStatus = (g: SavingsGoal): string => {
  if (g.currentAmount >= g.targetAmount) return "Completed";
  if (g.deadline) {
    const ms = Number(g.deadline) / 1_000_000;
    if (new Date(ms) < new Date()) return "Overdue";
  }
  return "Active";
};

export default function SavingsGoals() {
  const { actor, isFetching: actorLoading } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: goals = [] } = useQuery<SavingsGoal[]>({
    queryKey: ["goals"],
    queryFn: () => actor!.getAllSavingsGoals(),
    enabled: !!actor,
  });

  const save = useMutation({
    mutationFn: (g: SavingsGoal) => actor!.saveSavingsGoal(g),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      setOpen(false);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => actor!.deleteSavingsGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (g: SavingsGoal) => {
    const dl = g.deadline
      ? new Date(Number(g.deadline) / 1_000_000).toISOString().split("T")[0]
      : "";
    setForm({
      name: g.name,
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount),
      deadline: dl,
      description: g.description,
    });
    setEditId(g.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.targetAmount || !actor) return;
    const g: SavingsGoal = {
      id: editId || uid(),
      name: form.name.trim(),
      targetAmount: Number.parseFloat(form.targetAmount),
      currentAmount: Number.parseFloat(form.currentAmount) || 0,
      deadline: form.deadline ? dateToNs(form.deadline) : undefined,
      description: form.description.trim(),
      status: "Active",
    };
    save.mutate(g);
  };

  const statusStyle: Record<string, string> = {
    Active: "bg-blue-100 text-blue-800",
    Completed: "bg-green-100 text-green-800",
    Overdue: "bg-red-100 text-red-800",
  };

  const submitDisabled = save.isPending || !actor || actorLoading;
  const submitLabel =
    actorLoading || !actor
      ? "Connecting..."
      : save.isPending
        ? "Saving..."
        : editId
          ? "Update Goal"
          : "Add Goal";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-7 px-3"
          data-ocid="goals.open_modal_button"
        >
          <Plus size={12} className="mr-1" /> Add Goal
        </Button>
      </div>

      <div className="bg-card border border-border">
        <div className="tally-panel-header">Savings Goals</div>
        {goals.length === 0 ? (
          <p
            className="text-muted-foreground text-[12px] p-4"
            data-ocid="goals.empty_state"
          >
            No savings goals yet. Set your first goal!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tally-table" data-ocid="goals.table">
              <thead>
                <tr>
                  <th className="text-left">Goal Name</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Saved</th>
                  <th className="text-right">Remaining</th>
                  <th className="text-right">Progress</th>
                  <th className="text-left">Deadline</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g, idx) => {
                  const status = getStatus(g);
                  const pct = Math.min(
                    (g.currentAmount / g.targetAmount) * 100,
                    100,
                  );
                  const dl = g.deadline
                    ? new Date(
                        Number(g.deadline) / 1_000_000,
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";
                  return (
                    <tr key={g.id} data-ocid={`goals.item.${idx + 1}`}>
                      <td>
                        <div className="font-medium">{g.name}</div>
                        {g.description && (
                          <div className="text-[11px] text-muted-foreground">
                            {g.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 ${
                            statusStyle[status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="text-right mono font-semibold">
                        {fmt(g.targetAmount)}
                      </td>
                      <td className="text-right mono text-green-700">
                        {fmt(g.currentAmount)}
                      </td>
                      <td className="text-right mono text-red-600">
                        {fmt(Math.max(g.targetAmount - g.currentAmount, 0))}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-secondary h-2 relative">
                            <div
                              className="h-2 bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="mono text-[11px]">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="mono text-[12px]">{dl}</td>
                      <td className="text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => openEdit(g)}
                            className="p-1 text-muted-foreground hover:text-primary"
                            data-ocid={`goals.edit_button.${idx + 1}`}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Delete goal?")) del.mutate(g.id);
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive"
                            data-ocid={`goals.delete_button.${idx + 1}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="text-[13px] uppercase tracking-wide">
              {editId ? "Edit Goal" : "Add Savings Goal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3" data-ocid="goals.dialog">
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Goal Name *
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Emergency Fund"
                className="rounded-none h-8 text-[13px]"
                data-ocid="goals.input"
              />
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Target Amount (₹) *
              </Label>
              <Input
                type="number"
                value={form.targetAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetAmount: e.target.value }))
                }
                placeholder="50000"
                className="rounded-none h-8 text-[13px] mono"
                data-ocid="goals.input"
              />
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Current Saved (₹)
              </Label>
              <Input
                type="number"
                value={form.currentAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentAmount: e.target.value }))
                }
                placeholder="0"
                className="rounded-none h-8 text-[13px] mono"
              />
            </div>
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Deadline
              </Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className="rounded-none h-8 text-[13px]"
              />
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
                placeholder="Optional details"
                className="rounded-none h-8 text-[13px]"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-8"
              disabled={submitDisabled}
              data-ocid="goals.submit_button"
            >
              {submitLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
