import React, { useEffect, useState } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";

const SavingsReport = () => {
  const token = localStorage.getItem("authToken");
  const decodedToken = jwt_decode(token);
  const userId = decodedToken.id;

  const [transactions, setTransactions] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [timePeriod, setTimePeriod] = useState("per-month");
  const [totalSavings, setTotalSavings] = useState(0);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/transactions/${userId}`)
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error("Error fetching transactions:", err));
  }, [userId]);

  const roundToDecimal = (value) => Math.ceil(value * 10) / 10;
  const roundToTens = (value) => Math.ceil(value / 10) * 10;
  const roundToHundreds = (value) => Math.ceil(value / 100) * 100;

  const computeRoundedAmount = (amount, rt) => {
    if (rt === "nearest-decimal") return roundToDecimal(amount);
    if (rt === "nearest-tens") return roundToTens(amount);
    if (rt === "nearest-hundreds") return roundToHundreds(amount);
    return amount;
  };

  const groupTransactionsByPeriod = () => {
    const groups = {};
    transactions.forEach((transaction) => {
      const dateObj = new Date(transaction.date);
      let key;
      switch (timePeriod) {
        case "per-day":
          key = transaction.date.split("T")[0];
          break;
        case "per-week": {
          const firstDay = new Date(dateObj.getFullYear(), 0, 1);
          const dayDiff = (dateObj - firstDay) / 86400000;
          const weekNum = Math.ceil((dayDiff + firstDay.getDay() + 1) / 7);
          key = `${dateObj.getFullYear()}-W${weekNum}`;
          break;
        }
        case "per-month":
          key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`;
          break;
        case "per-year":
          key = `${dateObj.getFullYear()}`;
          break;
        default:
          key = transaction.date.split("T")[0];
      }

      if (!groups[key]) {
        groups[key] = {
          period: key,
          total: 0,
          roundedTotal: 0,
          count: 0,
        };
      }

      const rounded = computeRoundedAmount(
        transaction.amount,
        transaction.roundingType
      );
      groups[key].total += transaction.amount;
      groups[key].roundedTotal += rounded;
      groups[key].count += 1;
    });

    const result = Object.values(groups).map((g) => {
      return {
        ...g,
        savings: Number((g.roundedTotal - g.total).toFixed(2)),
        total: Number(g.total.toFixed(2)),
        roundedTotal: Number(g.roundedTotal.toFixed(2)),
        label: formatPeriodLabel(g.period),
      };
    });

    const savingsSum = result.reduce((acc, r) => acc + r.savings, 0);
    setTotalSavings(Number(savingsSum.toFixed(2)));

    return result.sort((a, b) => a.period.localeCompare(b.period));
  };

  useEffect(() => {
    const grouped = groupTransactionsByPeriod();
    setGroupedData(grouped);
  }, [transactions, timePeriod]);

  const formatPeriodLabel = (period) => {
    if (timePeriod === "per-month") {
      const [year, month] = period.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return period;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Savings Report
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Track your savings progress over time
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group By:
            </label>
            <select
              className="w-full md:w-auto px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 dark:text-gray-200"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="per-day">Per Day</option>
              <option value="per-week">Per Week</option>
              <option value="per-month">Per Month</option>
              <option value="per-year">Per Year</option>
            </select>
          </div>
          <div className="flex-grow"></div>
          <div className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 p-0.5 rounded-lg">
            <div className="bg-white dark:bg-gray-800 rounded-md p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Savings
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{totalSavings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto rounded-lg shadow">
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
                Original Total (₹)
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rounded Total (₹)
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Savings (₹)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {groupedData.map((row) => (
              <tr
                key={row.period}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {row.label}
                </td>
                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                  <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs">
                    {row.count}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                  ₹{row.total.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                  ₹{row.roundedTotal.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-sm">
                  <span
                    className={`font-semibold ${
                      row.savings > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    ₹{row.savings.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Savings Overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupedData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.1}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6B7280" }}
                  axisLine={{ stroke: "#9CA3AF" }}
                />
                <YAxis
                  tick={{ fill: "#6B7280" }}
                  axisLine={{ stroke: "#9CA3AF" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F9FAFB",
                    borderColor: "#E5E7EB",
                    borderRadius: "0.5rem",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                />
                <Legend />
                <Bar dataKey="savings" name="Savings ₹" radius={[4, 4, 0, 0]}>
                  {groupedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.savings > 0 ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Original vs Rounded
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={groupedData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.1}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6B7280" }}
                  axisLine={{ stroke: "#9CA3AF" }}
                />
                <YAxis
                  tick={{ fill: "#6B7280" }}
                  axisLine={{ stroke: "#9CA3AF" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F9FAFB",
                    borderColor: "#E5E7EB",
                    borderRadius: "0.5rem",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ fill: "#4F46E5", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Original ₹"
                />
                <Line
                  type="monotone"
                  dataKey="roundedTotal"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: "#F59E0B", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Rounded ₹"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsReport;
