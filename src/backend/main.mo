import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

import List "mo:core/List";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type AccountType = {
    #Bank;
    #Cash;
    #Savings;
  };

  type TransactionType = {
    #Income;
    #Expense;
  };

  type CategoryType = {
    #Income;
    #Expense;
  };

  type Account = {
    id : Text;
    name : Text;
    accountType : AccountType;
    openingBalance : Float;
    currentBalance : Float;
  };

  type Transaction = {
    id : Text;
    date : Nat;
    accountId : Text;
    categoryId : Text;
    description : Text;
    amount : Float;
    transactionType : TransactionType;
    receiptNote : Text;
  };

  type Category = {
    id : Text;
    name : Text;
    categoryType : CategoryType;
  };

  type SavingsGoal = {
    id : Text;
    name : Text;
    targetAmount : Float;
    currentAmount : Float;
    deadline : ?Nat;
    description : Text;
    status : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  module Category {
    public func compare(lhs : Category, rhs : Category) : Order.Order {
      Text.compare(lhs.name, rhs.name);
    };
  };

  type StatementFilter = {
    accountId : ?Text;
    fromDate : ?Nat;
    toDate : ?Nat;
  };

  type Statement = {
    transactions : [Transaction];
    totalCredits : Float;
    totalExpenses : Float;
    openingBalance : Float;
    closingBalance : Float;
  };

  // Persistent state
  let accounts = Map.empty<Text, Account>();
  let transactions = Map.empty<Text, Transaction>();
  let categories = Map.empty<Text, Category>();
  let savingsGoals = Map.empty<Text, SavingsGoal>();

  // Retained for upgrade compatibility (previously used for authorization)
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  //
  // Category Functions
  //
  public shared func saveCategory(category : Category) : async Text {
    categories.add(category.id, category);
    category.id;
  };

  public query func getCategory(categoryId : Text) : async ?Category {
    categories.get(categoryId);
  };

  public query func getAllCategories() : async [Category] {
    categories.values().toArray().sort();
  };

  public shared func deleteCategory(categoryId : Text) : async () {
    ignore categories.remove(categoryId);
  };

  //
  // Account Functions
  //
  public shared func saveAccount(account : Account) : async Text {
    accounts.add(account.id, account);
    account.id;
  };

  public query func getAccount(accountId : Text) : async ?Account {
    accounts.get(accountId);
  };

  public query func getAllAccounts() : async [Account] {
    accounts.values().toArray();
  };

  public shared func deleteAccount(accountId : Text) : async () {
    ignore accounts.remove(accountId);
  };

  //
  // Transaction Functions
  //
  public shared func saveTransaction(transaction : Transaction) : async Text {
    transactions.add(transaction.id, transaction);
    transaction.id;
  };

  public query func getTransaction(transactionId : Text) : async ?Transaction {
    transactions.get(transactionId);
  };

  public query func getAllTransactions() : async [Transaction] {
    transactions.values().toArray();
  };

  public shared func deleteTransaction(transactionId : Text) : async () {
    ignore transactions.remove(transactionId);
  };

  //
  // Savings Goal Functions
  //
  public shared func saveSavingsGoal(goal : SavingsGoal) : async Text {
    savingsGoals.add(goal.id, goal);
    goal.id;
  };

  public query func getSavingsGoal(goalId : Text) : async ?SavingsGoal {
    savingsGoals.get(goalId);
  };

  public query func getAllSavingsGoals() : async [SavingsGoal] {
    savingsGoals.values().toArray();
  };

  public shared func deleteSavingsGoal(goalId : Text) : async () {
    ignore savingsGoals.remove(goalId);
  };

  //
  // Statement Functions
  //
  public query func getStatement(filter : StatementFilter) : async Statement {
    let filteredTransactions = List.empty<Transaction>();

    for (t in transactions.values()) {
      if (switch (filter.accountId) {
        case (null) { true };
        case (?id) { t.accountId == id };
      }) {
        if (
          (switch (filter.fromDate) {
            case (null) { true };
            case (?fromDate) { t.date >= fromDate };
          }) and (switch (filter.toDate) {
            case (null) { true };
            case (?toDate) { t.date <= toDate };
          })
        ) {
          filteredTransactions.add(t);
        };
      };
    };

    let totalCredits = filteredTransactions.values().filter(func(t) { t.transactionType == #Income }).map(func(t) { t.amount }).foldLeft(0.0, func(acc, amount) { acc + amount });

    let totalExpenses = filteredTransactions.values().filter(func(t) { t.transactionType == #Expense }).map(func(t) { t.amount }).foldLeft(0.0, func(acc, amount) { acc + amount });

    let openingBalance = 0.0;
    let closingBalance = openingBalance + totalCredits - totalExpenses;

    {
      transactions = filteredTransactions.toArray();
      totalCredits;
      totalExpenses;
      openingBalance;
      closingBalance;
    };
  };
};
