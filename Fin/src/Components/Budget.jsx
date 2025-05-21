import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";

const Budget = () => {
  const token = localStorage.getItem("authToken");
  const decodedToken = jwt_decode(token);
  const userId = decodedToken.id;

  // State management for transactions and grouping
  const [transactions, setTransactions] = useState([]);
  const [newExpense, setNewExpense] = useState("");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [timePeriod, setTimePeriod] = useState("per-transaction");
  const [results, setResults] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [transactionRoundingType, setTransactionRoundingType] =
    useState("nearest-decimal");

  // Category options
  const categories = [
    { value: "nearest-decimal", label: "Round to Next 0.1" },
    { value: "nearest-tens", label: "Round to Next 10" },
    { value: "nearest-hundreds", label: "Round to Next 100" },
  ];

  // Fetch transactions from backend on mount
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/transactions/${userId}`)
      .then((res) => {
        setTransactions(res.data);
      })
      .catch((err) => console.error("Error fetching transactions:", err));
  }, [userId]);

  // Add a new transaction with its own rounding option
  const handleAddTransaction = () => {
    if (newExpense && !isNaN(parseFloat(newExpense))) {
      // Force amount to exactly two decimals
      const amountValue = Math.round(parseFloat(newExpense) * 100) / 100;
      axios
        .post("http://localhost:5000/api/transactions", {
          userId,
          amount: amountValue,
          date: newDate,
          roundingType: transactionRoundingType,
        })
        .then((res) => {
          const createdTransaction = res.data;
          setTransactions([...transactions, createdTransaction]);
          setNewExpense("");
        })
        .catch((err) => console.error("Error adding transaction:", err));
    }
  };

  // Rounding functions (always round up)
  const roundToDecimal = (value) => Math.ceil(value * 10) / 10;
  const roundToTens = (value) => Math.ceil(value / 10) * 10;
  const roundToHundreds = (value) => Math.ceil(value / 100) * 100;

  // Compute rounded amount for a single transaction using its own roundingType
  const computeRoundedAmount = (amount, rt) => {
    if (rt === "nearest-decimal") return roundToDecimal(amount);
    if (rt === "nearest-tens") return roundToTens(amount);
    if (rt === "nearest-hundreds") return roundToHundreds(amount);
    return amount;
  };

  // Group transactions by time period
  const groupTransactionsByPeriod = () => {
    if (timePeriod === "per-transaction") {
      return transactions.map((t) => {
        const roundedAmount = computeRoundedAmount(t.amount, t.roundingType);
        const savings = Number((roundedAmount - t.amount).toFixed(2));
        return { ...t, roundedAmount, savings };
      });
    }

    const groups = {};
    transactions.forEach((transaction) => {
      const dateObj = new Date(transaction.date);
      let key;
      switch (timePeriod) {
        case "per-day":
          key = transaction.date.split("T")[0];
          break;
        case "per-week": {
          // Use a simple ISO 8601-like approach
          const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
          const pastDaysOfYear = (dateObj - firstDayOfYear) / 86400000;
          const weekNum = Math.ceil(
            (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
          );
          key = `${dateObj.getFullYear()}-W${weekNum}`;
          break;
        }
        case "per-month":
          key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`;
          break;
        case "per-year":
          key = dateObj.getFullYear().toString();
          break;
        default:
          key = transaction.date.split("T")[0];
      }
      if (!groups[key]) {
        groups[key] = {
          period: key,
          transactionList: [],
          total: 0,
          roundedSum: 0,
        };
      }
      groups[key].transactionList.push(transaction);
      groups[key].total += transaction.amount;
      groups[key].roundedSum += computeRoundedAmount(
        transaction.amount,
        transaction.roundingType
      );
    });

    const result = Object.values(groups).map((group) => {
      const savings = Number((group.roundedSum - group.total).toFixed(2));
      return {
        ...group,
        transactionCount: group.transactionList.length,
        roundedTotal: group.roundedSum,
        savings,
      };
    });
    return result.sort((a, b) => a.period.localeCompare(b.period));
  };

  // Calculate and update results
  const calculateResults = () => {
    const groupedData = groupTransactionsByPeriod();
    setResults(groupedData);
    let savings = 0;
    if (timePeriod === "per-transaction") {
      savings = groupedData.reduce((sum, t) => sum + (t.savings || 0), 0);
    } else {
      savings = groupedData.reduce((sum, g) => sum + (g.savings || 0), 0);
    }
    setTotalSavings(savings);
  };

  useEffect(() => {
    calculateResults();
  }, [transactions, timePeriod]);

  // Format the period label for display
  const formatPeriodLabel = (period) => {
    if (timePeriod === "per-day") {
      return `Day: ${period}`;
    } else if (timePeriod === "per-week") {
      return `Week: ${period}`;
    } else if (timePeriod === "per-month") {
      const [year, month] = period.split("-");
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (timePeriod === "per-year") {
      return `Year: ${period}`;
    }
    return period;
  };

  // Render
  return (
    <div className="p-8 max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Expense Rounding Calculator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Track your expenses and calculate your rounded savings
        </p>
      </div>

      {/* Time Period Selector */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Group By:
          </label>
          <select
            className="w-full md:w-auto px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-200"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option value="per-transaction">Per Transaction</option>
            <option value="per-day">Per Day</option>
            <option value="per-week">Per Week</option>
            <option value="per-month">Per Month</option>
            <option value="per-year">Per Year</option>
          </select>
        </div>
      </div>

      {/* Add Transaction Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Add New Transaction
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-200"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-200"
              value={newExpense}
              onChange={(e) => setNewExpense(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Round To
            </label>
            <select
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-200"
              value={transactionRoundingType}
              onChange={(e) => setTransactionRoundingType(e.target.value)}
            >
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
              onClick={handleAddTransaction}
            >
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Savings Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Savings Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-900">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Original Expenses
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ₹
              {transactions
                .reduce((sum, t) => sum + (t.amount || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-purple-100 dark:border-purple-900">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Rounded Expenses
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ₹
              {(
                transactions.reduce((sum, t) => sum + (t.amount || 0), 0) +
                totalSavings
              ).toFixed(2)}
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-0.5 rounded-xl">
            <div className="bg-white dark:bg-gray-800 h-full rounded-lg flex flex-col justify-center p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Total Savings
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{totalSavings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-bold">Note:</span> Each transaction is rounded
            individually based on the selected "Round To" option.
          </p>
        </div>
      </div>

      {/* Results Display */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          {timePeriod === "per-transaction"
            ? "Transaction Results"
            : `${
                timePeriod.replace("per-", "").charAt(0).toUpperCase() +
                timePeriod.replace("per-", "").slice(1)
              } Results`}
        </h2>

        {results && results.length > 0 ? (
          <div className="max-h-[350px] overflow-y-auto rounded-lg shadow">
            {timePeriod === "per-transaction" ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Original Amount
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rounded Amount
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Savings
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((transaction) => (
                    <tr
                      key={transaction._id || transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        ₹{transaction.amount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        ₹{transaction.roundedAmount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-green-600 dark:text-green-400">
                        ₹{transaction.savings?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Expenses
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rounded Total
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Savings
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((group, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatPeriodLabel(group.period)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs">
                          {group.transactionCount}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        ₹{group.total?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                        ₹{group.roundedTotal?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-green-600 dark:text-green-400">
                        ₹{group.savings?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p>No transactions to display.</p>
          </div>
        )}
      </div>

      {/* All Transactions Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          Recent Transactions
        </h2>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions
                .slice(-5)
                .reverse()
                .map((transaction) => (
                  <tr
                    key={transaction._id || transaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded">
                        {(transaction._id || transaction.id).substring(0, 8)}...
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                      ₹{transaction.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">
          Showing the 5 most recent transactions.
        </p>
      </div>
    </div>
  );
};

export default Budget;
