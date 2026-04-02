import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
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
import { isExpenseType, isIncomeType, txTypeLabel } from "../lib/finance";
import { getActorAsync } from "../utils/actorStore";

const emptyForm = { name: "", categoryType: "Income" as CategoryType };

export default function Categories() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");

  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState("");
  const inlineInputRef = useRef<HTMLInputElement>(null);

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
      setEditId(null);
    },
  });

  const inlineSave = useMutation({
    mutationFn: async (c: Category) => {
      const backendActor = actor || (await getActorAsync());
      return backendActor.saveCategory(c);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setInlineEditId(null);
      setInlineName("");
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
      id: editId ?? crypto.randomUUID(),
      name: form.name.trim(),
      categoryType: form.categoryType,
    });
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setForm({ name: c.name, categoryType: c.categoryType });
    setEditId(c.id);
    setOpen(true);
  };

  const startInlineEdit = (c: Category) => {
    setInlineEditId(c.id);
    setInlineName(c.name);
    setTimeout(() => inlineInputRef.current?.focus(), 0);
  };

  const commitInlineEdit = (c: Category) => {
    const trimmed = inlineName.trim();
    if (!trimmed || trimmed === c.name) {
      cancelInlineEdit();
      return;
    }
    inlineSave.mutate({
      id: c.id,
      name: trimmed,
      categoryType: c.categoryType,
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineName("");
  };

  const income = categories.filter((c) => isIncomeType(c.categoryType));
  const expense = categories.filter((c) => isExpenseType(c.categoryType));
  const list = activeTab === "income" ? income : expense;

  const submitDisabled = save.isPending;
  const submitLabel = save.isPending
    ? "Saving..."
    : editId
      ? "Save Changes"
      : "Add Category";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={openAdd}
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
                {list.map((c, idx) => {
                  const isInlineEditing = inlineEditId === c.id;
                  return (
                    <tr key={c.id} data-ocid={`categories.item.${idx + 1}`}>
                      <td className="font-medium">
                        {isInlineEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              ref={inlineInputRef}
                              type="text"
                              value={inlineName}
                              onChange={(e) => setInlineName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitInlineEdit(c);
                                if (e.key === "Escape") cancelInlineEdit();
                              }}
                              className="rounded-none h-7 text-[13px] border border-primary px-1 bg-background text-foreground outline-none focus:ring-0 w-full min-w-0"
                              data-ocid={`categories.input.${idx + 1}`}
                              disabled={inlineSave.isPending}
                            />
                            <button
                              type="button"
                              onClick={() => commitInlineEdit(c)}
                              className="p-0.5 text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="Save"
                              disabled={inlineSave.isPending}
                              data-ocid={`categories.save_button.${idx + 1}`}
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelInlineEdit}
                              className="p-0.5 text-muted-foreground hover:text-destructive"
                              title="Cancel"
                              data-ocid={`categories.cancel_button.${idx + 1}`}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="cursor-pointer hover:text-primary bg-transparent border-none p-0 text-left font-medium text-[13px] w-full"
                            title="Click to edit name"
                            onClick={() => startInlineEdit(c)}
                          >
                            {c.name}
                          </button>
                        )}
                      </td>
                      <td>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 ${
                            isIncomeType(c.categoryType)
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {txTypeLabel(c.categoryType)}
                        </span>
                      </td>
                      <td className="text-center">
                        {!isInlineEditing && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="p-1 text-muted-foreground hover:text-primary"
                              title="Edit (full)"
                              data-ocid={`categories.edit_button.${idx + 1}`}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Delete category?"))
                                  del.mutate(c.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive"
                              title="Delete"
                              data-ocid={`categories.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditId(null);
        }}
      >
        <DialogContent className="max-w-sm rounded-none">
          <DialogHeader>
            <DialogTitle className="text-[13px] uppercase tracking-wide">
              {editId ? "Edit Category" : "Add Category"}
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
