import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
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
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper function for role assertion
  func assertRole(caller : Principal, requiredRole : AccessControl.UserRole) {
    if (not (AccessControl.hasPermission(accessControlState, caller, requiredRole))) {
      Runtime.trap("Unauthorized: Insufficient permissions");
    };
  };

  //
  // User Profile Functions
  //
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  //
  // Category Functions
  //
  public shared ({ caller }) func saveCategory(category : Category) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save categories");
    };
    categories.add(category.id, category);
    category.id;
  };

  public query ({ caller }) func getCategory(categoryId : Text) : async ?Category {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view categories");
    };
    categories.get(categoryId);
  };

  public query ({ caller }) func getAllCategories() : async [Category] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view categories");
    };
    categories.values().toArray().sort();
  };

  public shared ({ caller }) func deleteCategory(categoryId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete categories");
    };
    ignore categories.remove(categoryId);
  };

  //
  // Account Functions
  //
  public shared ({ caller }) func saveAccount(account : Account) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save accounts");
    };
    accounts.add(account.id, account);
    account.id;
  };

  public query ({ caller }) func getAccount(accountId : Text) : async ?Account {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view accounts");
    };
    accounts.get(accountId);
  };

  public query ({ caller }) func getAllAccounts() : async [Account] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view accounts");
    };
    accounts.values().toArray();
  };

  public shared ({ caller }) func deleteAccount(accountId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete accounts");
    };
    ignore accounts.remove(accountId);
  };

  //
  // Transaction Functions
  //
  public shared ({ caller }) func saveTransaction(transaction : Transaction) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save transactions");
    };
    transactions.add(transaction.id, transaction);
    // Update account balance here (omitted for brevity)
    transaction.id;
  };

  public query ({ caller }) func getTransaction(transactionId : Text) : async ?Transaction {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    transactions.get(transactionId);
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    transactions.values().toArray();
  };

  public shared ({ caller }) func deleteTransaction(transactionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete transactions");
    };
    ignore transactions.remove(transactionId);
  };

  //
  // Savings Goal Functions
  //
  public shared ({ caller }) func saveSavingsGoal(goal : SavingsGoal) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save savings goals");
    };
    savingsGoals.add(goal.id, goal);
    goal.id;
  };

  public query ({ caller }) func getSavingsGoal(goalId : Text) : async ?SavingsGoal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view savings goals");
    };
    savingsGoals.get(goalId);
  };

  public query ({ caller }) func getAllSavingsGoals() : async [SavingsGoal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view savings goals");
    };
    savingsGoals.values().toArray();
  };

  public shared ({ caller }) func deleteSavingsGoal(goalId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete savings goals");
    };
    ignore savingsGoals.remove(goalId);
  };

  //
  // Statement Functions
  //
  public query ({ caller }) func getStatement(filter : StatementFilter) : async Statement {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view statements");
    };
    
    // Filter transactions by accountId and date range
    let filteredTransactions = List.empty<Transaction>();

    for (t in transactions.values()) {
      // Filter by accountId
      if (switch (filter.accountId) {
        case (null) { true };
        case (?id) { t.accountId == id };
      }) {
        // Filter by date range
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

    // Calculate opening and closing balance (simplified for brevity)
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
