import type {
  Account,
  AccountType,
  Category,
  CategoryType,
  SavingsGoal,
  Transaction,
} from "../backend";

export const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

export const fmtDate = (ts: bigint) => {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const fmtDateInput = (ts: bigint) => {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toISOString().split("T")[0];
};

export const dateToNs = (dateStr: string): bigint => {
  const ms = new Date(dateStr).getTime();
  return BigInt(ms) * BigInt(1_000_000);
};

export const nowNs = (): bigint => BigInt(Date.now()) * BigInt(1_000_000);

export const uid = () => crypto.randomUUID();

export const accountTypeLabel = (t: AccountType) => t;

export const categoryTypeLabel = (t: CategoryType) => t;

export type {
  Transaction,
  Account,
  Category,
  SavingsGoal,
  AccountType,
  CategoryType,
};
