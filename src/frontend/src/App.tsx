import { useState } from "react";
import Layout from "./components/Layout";
import AccountStatement from "./pages/AccountStatement";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Receipts from "./pages/Receipts";
import Reports from "./pages/Reports";
import SavingsGoals from "./pages/SavingsGoals";
import Transactions from "./pages/Transactions";

export type Page =
  | "dashboard"
  | "accounts"
  | "transactions"
  | "receipts"
  | "statement"
  | "reports"
  | "goals"
  | "categories";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard setPage={setPage} />;
      case "accounts":
        return <Accounts />;
      case "transactions":
        return <Transactions />;
      case "receipts":
        return <Receipts />;
      case "statement":
        return <AccountStatement />;
      case "reports":
        return <Reports />;
      case "goals":
        return <SavingsGoals />;
      case "categories":
        return <Categories />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <Layout currentPage={page} setPage={setPage}>
      {renderPage()}
    </Layout>
  );
}
