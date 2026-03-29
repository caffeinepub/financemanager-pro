import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Tag,
  Target,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  {
    id: "dashboard" as Page,
    label: "Dashboard",
    icon: LayoutDashboard,
    shortcut: "F1",
  },
  {
    id: "accounts" as Page,
    label: "Accounts",
    icon: Building2,
    shortcut: "F4",
  },
  {
    id: "transactions" as Page,
    label: "Transactions",
    icon: ArrowLeftRight,
    shortcut: "F6",
  },
  { id: "receipts" as Page, label: "Receipts", icon: Receipt, shortcut: "F7" },
  {
    id: "statement" as Page,
    label: "Account Statement",
    icon: FileText,
    shortcut: "F9",
  },
  { id: "reports" as Page, label: "Reports", icon: BarChart3, shortcut: "F5" },
  { id: "goals" as Page, label: "Savings Goals", icon: Target, shortcut: "F8" },
  { id: "categories" as Page, label: "Categories", icon: Tag, shortcut: "F10" },
];

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  accounts: "Accounts",
  transactions: "Transactions",
  receipts: "Receipts",
  statement: "Account Statement",
  reports: "Reports",
  goals: "Savings Goals",
  categories: "Categories",
};

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  setPage: (p: Page) => void;
}

export default function Layout({
  children,
  currentPage,
  setPage,
}: LayoutProps) {
  const { clear } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-sidebar-border">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          MAIN MENU
        </p>
      </div>
      <nav className="flex-1 py-1 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon, shortcut }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setPage(id);
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-none transition-none ${
              currentPage === id
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon size={14} className="shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            <span className="text-[10px] opacity-50">{shortcut}</span>
          </button>
        ))}
      </nav>
      <div className="border-t border-sidebar-border">
        <button
          type="button"
          onClick={clear}
          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent rounded-none transition-none"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* TOP BAR */}
      <header
        className="no-print h-9 flex items-center justify-between px-4 shrink-0"
        style={{ backgroundColor: "oklch(var(--tally-header))" }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden text-white/60 hover:text-white mr-1"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={16} />
          </button>
          <span className="text-white font-bold text-[13px] tracking-tight">
            FinanceManager Pro
          </span>
          <span className="text-white/40 text-[13px]">|</span>
          <span className="text-primary text-[13px] font-semibold">
            {pageTitles[currentPage]}
          </span>
        </div>
        <div className="text-white/70 text-[11px] font-mono">{today}</div>
      </header>

      {/* MIDDLE: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="no-print hidden md:flex w-52 shrink-0 flex-col bg-sidebar">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="no-print fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="Close menu"
            />
            <aside className="relative w-52 h-full flex flex-col bg-sidebar">
              <button
                type="button"
                className="absolute top-2 right-2 text-white/60 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <X size={16} />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 bg-background">
          {children}
        </main>
      </div>

      {/* BOTTOM STATUS BAR */}
      <footer
        className="no-print h-7 flex items-center px-4 shrink-0"
        style={{ backgroundColor: "oklch(var(--tally-header))" }}
      >
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-white/80">
            <span className="text-primary font-bold">F2</span>: Income
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">
            <span className="text-primary font-bold">F3</span>: Expense
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">
            <span className="text-primary font-bold">F5</span>: Reports
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">
            <span className="text-primary font-bold">F9</span>: Statement
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">
            <span className="text-primary font-bold">F4</span>: Accounts
          </span>
        </div>
        <div className="ml-auto text-white/40 text-[10px]">
          © {new Date().getFullYear()} Built with{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
