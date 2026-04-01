import { Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Page } from "../App";

const navItems = [
  { id: "dashboard" as Page, label: "Gateway of Tally", shortcut: "F1" },
  { id: "accounts" as Page, label: "Accounts", shortcut: "F4" },
  { id: "transactions" as Page, label: "Transactions", shortcut: "F6" },
  { id: "receipts" as Page, label: "Receipts", shortcut: "F7" },
  { id: "statement" as Page, label: "Account Statement", shortcut: "F9" },
  { id: "reports" as Page, label: "Reports", shortcut: "F5" },
  { id: "goals" as Page, label: "Savings Goals", shortcut: "F8" },
  { id: "categories" as Page, label: "Categories", shortcut: "F10" },
];

const pageTitles: Record<Page, string> = {
  dashboard: "Gateway of Tally",
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Company name box */}
      <div
        className="px-3 py-2 border-b"
        style={{ borderColor: "oklch(var(--sidebar-border))" }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "oklch(var(--primary))" }}
        >
          FinanceManager Pro
        </p>
        <p className="text-[10px] text-white/40 mt-0.5">Company: Default</p>
      </div>

      {/* MAIN MENU label */}
      <div
        className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/30"
        style={{ borderBottom: "1px solid oklch(var(--sidebar-border))" }}
      >
        Main Menu
      </div>

      <nav className="flex-1 py-0 overflow-y-auto">
        {navItems.map(({ id, label, shortcut }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setPage(id);
              setMobileOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] transition-none ${
              currentPage === id
                ? "font-bold"
                : "text-white/80 hover:text-white"
            }`}
            style={{
              backgroundColor:
                currentPage === id
                  ? "oklch(var(--sidebar-primary))"
                  : undefined,
              color:
                currentPage === id
                  ? "oklch(var(--sidebar-primary-foreground))"
                  : undefined,
            }}
          >
            <span className="text-left leading-tight">{label}</span>
            <span
              className="text-[10px] ml-2 shrink-0"
              style={{
                color:
                  currentPage === id
                    ? "oklch(var(--sidebar-primary-foreground))"
                    : "oklch(var(--sidebar-primary))",
                opacity: currentPage === id ? 0.8 : 1,
              }}
            >
              {shortcut}
            </span>
          </button>
        ))}
      </nav>

      {/* Caffeine footer inside sidebar */}
      <div
        className="px-3 py-2 border-t text-[9px] text-white/25"
        style={{ borderColor: "oklch(var(--sidebar-border))" }}
      >
        © {new Date().getFullYear()}{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white/50"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* TOP HEADER BAR */}
      <header
        className="no-print shrink-0 flex items-stretch"
        style={{
          backgroundColor: "oklch(var(--tally-header))",
          borderBottom: "1px solid oklch(0.12 0.04 255)",
        }}
      >
        {/* Left: app name */}
        <div
          className="flex items-center px-3 gap-2"
          style={{ minWidth: "208px" }}
        >
          <button
            type="button"
            className="md:hidden text-white/60 hover:text-white mr-1"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={15} />
          </button>
          <span
            className="text-[13px] font-bold tracking-tight"
            style={{ color: "oklch(var(--primary))" }}
          >
            FinanceManager Pro
          </span>
        </div>

        {/* Center: navigation links */}
        <div
          className="hidden md:flex items-stretch border-l"
          style={{ borderColor: "oklch(0.22 0.06 255)" }}
        >
          {[
            { label: "Gateway", page: "dashboard" as Page },
            { label: "Accounts", page: "accounts" as Page },
            { label: "Reports", page: "reports" as Page },
            { label: "Transactions", page: "transactions" as Page },
          ].map(({ label, page }) => (
            <button
              key={page}
              type="button"
              onClick={() => setPage(page)}
              className="px-4 h-full flex items-center text-[12px] border-r"
              style={{
                borderColor: "oklch(0.22 0.06 255)",
                color:
                  currentPage === page
                    ? "oklch(var(--primary))"
                    : "rgba(255,255,255,0.7)",
                backgroundColor:
                  currentPage === page ? "oklch(0.19 0.06 255)" : "transparent",
                fontWeight: currentPage === page ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: date */}
        <div className="ml-auto flex items-center px-4">
          <span
            className="text-[11px] font-mono"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {today}
          </span>
        </div>
      </header>

      {/* MIDDLE: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className="no-print hidden md:flex w-52 shrink-0 flex-col"
          style={{ backgroundColor: "oklch(var(--sidebar))" }}
        >
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
            <aside
              className="relative w-52 h-full flex flex-col"
              style={{ backgroundColor: "oklch(var(--sidebar))" }}
            >
              <button
                type="button"
                className="absolute top-2 right-2 text-white/60 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <X size={15} />
              </button>
              <SidebarContent />
            </aside>
          </div>
        )}

        <main
          className="flex-1 overflow-y-auto p-3"
          style={{ backgroundColor: "oklch(var(--background))" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "oklch(var(--foreground))" }}
            >
              {pageTitles[currentPage]}
            </span>
            <span
              className="text-[10px]"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              |
            </span>
            <span
              className="text-[10px]"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              FinanceManager Pro
            </span>
          </div>
          {children}
        </main>
      </div>

      {/* BOTTOM STATUS BAR — Tally Prime style F-key hints */}
      <footer
        className="no-print shrink-0 flex items-center px-2"
        style={{
          backgroundColor: "oklch(var(--tally-header))",
          height: "22px",
          borderTop: "1px solid oklch(0.12 0.04 255)",
        }}
      >
        <div
          className="flex items-center gap-0 text-[10px] divide-x overflow-x-auto"
          style={{}}
        >
          {[
            { key: "F1", label: "Help" },
            { key: "F2", label: "Period" },
            { key: "F3", label: "Company" },
            { key: "F4", label: "Accounts" },
            { key: "F5", label: "Reports" },
            { key: "F6", label: "Transactions" },
            { key: "F7", label: "Receipts" },
            { key: "F8", label: "Goals" },
            { key: "F9", label: "Statement" },
            { key: "F10", label: "Categories" },
            { key: "ESC", label: "Quit" },
          ].map(({ key, label }, i) => (
            <span
              key={key}
              className="flex items-center gap-0.5 px-2"
              style={{
                borderLeft: i === 0 ? "none" : "1px solid oklch(0.25 0.05 255)",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              <span
                style={{
                  color: "oklch(var(--primary))",
                  fontWeight: 700,
                  marginRight: "2px",
                }}
              >
                {key}
              </span>
              {label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
