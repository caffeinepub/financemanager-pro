import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Category, CategoryType } from "../backend";
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
import { uid } from "../lib/finance";
import { getActorAsync } from "../utils/actorStore";

const emptyForm = { name: "", categoryType: "Income" as CategoryType };

export default function Categories() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
    enabled: !!actor,
  });

  const save = useMutation({
    mutationFn: async (c: Category) => {
      const backendActor = actor || (await getActorAsync());
      return backendActor.saveCategory(c);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const backendActor = actor || (await getActorAsync());
      return backendActor.deleteCategory(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    save.mutate({
      id: uid(),
      name: form.name.trim(),
      categoryType: form.categoryType,
    });
  };

  const income = categories.filter((c) => c.categoryType === "Income");
  const expense = categories.filter((c) => c.categoryType === "Expense");
  const list = activeTab === "income" ? income : expense;

  const submitDisabled = save.isPending;
  const submitLabel = save.isPending ? "Saving..." : "Add Category";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setForm(emptyForm);
            setOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-7 px-3"
          data-ocid="categories.open_modal_button"
        >
          <Plus size={12} className="mr-1" /> Add Category
        </Button>
      </div>

      <div className="bg-card border border-border">
        <div className="tally-panel-header flex items-center justify-between">
          <span>Categories</span>
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => setActiveTab("income")}
              className={`px-3 py-0.5 text-[11px] uppercase tracking-wide rounded-none ${
                activeTab === "income"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/60 hover:text-white"
              }`}
              data-ocid="categories.tab"
            >
              Income ({income.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("expense")}
              className={`px-3 py-0.5 text-[11px] uppercase tracking-wide rounded-none ${
                activeTab === "expense"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-white/60 hover:text-white"
              }`}
              data-ocid="categories.tab"
            >
              Expense ({expense.length})
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <p
            className="text-muted-foreground text-[12px] p-4"
            data-ocid="categories.empty_state"
          >
            No categories yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tally-table" data-ocid="categories.table">
              <thead>
                <tr>
                  <th className="text-left">Category Name</th>
                  <th className="text-left">Type</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, idx) => (
                  <tr key={c.id} data-ocid={`categories.item.${idx + 1}`}>
                    <td className="font-medium">{c.name}</td>
                    <td>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 ${
                          c.categoryType === "Income"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.categoryType}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete category?")) del.mutate(c.id);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive mx-auto"
                        data-ocid={`categories.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={12} />
                      </button>
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
              Add Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4" data-ocid="categories.dialog">
            <div>
              <Label className="text-[12px] uppercase tracking-wide">
                Category Type *
              </Label>
              <Select
                value={form.categoryType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, categoryType: v as CategoryType }))
                }
              >
                <SelectTrigger
                  className="rounded-none h-8 text-[13px]"
                  data-ocid="categories.select"
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
                Category Name *
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Salary, Rent, Food"
                className="rounded-none h-8 text-[13px]"
                data-ocid="categories.input"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 rounded-none text-[12px] uppercase tracking-wide h-8"
              disabled={submitDisabled}
              data-ocid="categories.submit_button"
            >
              {submitLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
