import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    id: string;
    categoryId: string;
    transactionType: TransactionType;
    accountId: string;
    receiptNote: string;
    date: bigint;
    description: string;
    amount: number;
}
export interface Category {
    id: string;
    categoryType: CategoryType;
    name: string;
}
export interface Account {
    id: string;
    currentBalance: number;
    name: string;
    accountType: AccountType;
    openingBalance: number;
}
export interface StatementFilter {
    accountId?: string;
    toDate?: bigint;
    fromDate?: bigint;
}
export interface Statement {
    totalExpenses: number;
    closingBalance: number;
    openingBalance: number;
    totalCredits: number;
    transactions: Array<Transaction>;
}
export interface UserProfile {
    name: string;
}
export interface SavingsGoal {
    id: string;
    status: string;
    name: string;
    description: string;
    deadline?: bigint;
    targetAmount: number;
    currentAmount: number;
}
export enum AccountType {
    Bank = "Bank",
    Cash = "Cash",
    Savings = "Savings"
}
export enum CategoryType {
    Income = "Income",
    Expense = "Expense"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAccount(accountId: string): Promise<void>;
    deleteCategory(categoryId: string): Promise<void>;
    deleteSavingsGoal(goalId: string): Promise<void>;
    deleteTransaction(transactionId: string): Promise<void>;
    getAccount(accountId: string): Promise<Account | null>;
    getAllAccounts(): Promise<Array<Account>>;
    getAllCategories(): Promise<Array<Category>>;
    getAllSavingsGoals(): Promise<Array<SavingsGoal>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategory(categoryId: string): Promise<Category | null>;
    getSavingsGoal(goalId: string): Promise<SavingsGoal | null>;
    getStatement(filter: StatementFilter): Promise<Statement>;
    getTransaction(transactionId: string): Promise<Transaction | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveAccount(account: Account): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCategory(category: Category): Promise<string>;
    saveSavingsGoal(goal: SavingsGoal): Promise<string>;
    saveTransaction(transaction: Transaction): Promise<string>;
}
