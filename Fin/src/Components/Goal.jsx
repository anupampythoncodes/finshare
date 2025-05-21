import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";

const Goal = () => {
  // Get the token from localStorage
  const token = localStorage.getItem("authToken");

  const decodedToken = jwt_decode(token); // Decode the token

  const userId = decodedToken.id;

  // For monthly goals
  const [goals, setGoals] = useState({ expenditure: 0, savings: 0 });
  const [currentAmounts, setCurrentAmounts] = useState({
    expenditure: 0,
    savings: 0,
  });
  const [showGoalForm, setShowGoalForm] = useState(true);

  // For category-based expenditure
  const [expenditureData, setExpenditureData] = useState({
    medical: [],
    home: [],
    investment: [],
    emergency: [],
    others: [],
  });
  const [selectedExpenditureCategory, setSelectedExpenditureCategory] =
    useState("home");
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const [newExpenditure, setNewExpenditure] = useState("");
  const [newExpenditureDesc, setNewExpenditureDesc] = useState("");

  // For category-based savings
  const [savingsData, setSavingsData] = useState({
    medical: [],
    home: [],
    investment: [],
    emergency: [],
    others: [],
  });
  const [selectedSavingsCategory, setSelectedSavingsCategory] =
    useState("home");
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [newSavingsAmount, setNewSavingsAmount] = useState("");
  const [newSavingsDesc, setNewSavingsDesc] = useState("");

  // Category options
  const categories = [
    { value: "medical", label: "Medical" },
    { value: "home", label: "Home" },
    { value: "investment", label: "Investment" },
    { value: "emergency", label: "Emergency" },
    { value: "others", label: "Others" },
  ];

  // 1) Load data on mount
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/goals/${userId}`)
      .then((res) => {
        const data = res.data;
        setGoals({
          expenditure: data.expenditureGoal,
          savings: data.savingsGoal,
        });
        setCurrentAmounts({
          expenditure: data.currentExpenditure,
          savings: data.currentSavings,
        });
        setExpenditureData(data.expenditureData);
        setSavingsData(data.savingsData);
        setShowGoalForm(false); // If you want to show progress by default
      })
      .catch((err) => console.error("Error loading goal data:", err));
  }, [userId]);

  // 2) Set or update monthly goals
  const handleSetGoals = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:5000/api/goals", {
        userId,
        expenditureGoal: goals.expenditure,
        savingsGoal: goals.savings,
      })
      .then((res) => {
        const data = res.data;
        setGoals({
          expenditure: data.expenditureGoal,
          savings: data.savingsGoal,
        });
        setShowGoalForm(false);
      })
      .catch((err) => console.error("Error setting goals:", err));
  };

  // 3) Add new expenditure
  const handleAddExpenditure = (e) => {
    e.preventDefault();
    if (newExpenditure) {
      axios
        .post("http://localhost:5000/api/expenditure", {
          userId,
          category: selectedExpenditureCategory,
          amount: parseFloat(newExpenditure),
          description: newExpenditureDesc,
        })
        .then((res) => {
          const data = res.data;
          setExpenditureData(data.expenditureData);
          setCurrentAmounts((prev) => ({
            ...prev,
            expenditure: data.currentExpenditure,
          }));
          // Reset form
          setNewExpenditure("");
          setNewExpenditureDesc("");
          setShowExpenditureForm(false);
        })
        .catch((err) => console.error("Error adding expenditure:", err));
    }
  };

  // 4) Add new savings
  const handleAddSavings = (e) => {
    e.preventDefault();
    if (newSavingsAmount) {
      axios
        .post("http://localhost:5000/api/savings", {
          userId,
          category: selectedSavingsCategory,
          amount: parseFloat(newSavingsAmount),
          description: newSavingsDesc,
        })
        .then((res) => {
          const data = res.data;
          setSavingsData(data.savingsData);
          setCurrentAmounts((prev) => ({
            ...prev,
            savings: data.currentSavings,
          }));
          // Reset form
          setNewSavingsAmount("");
          setNewSavingsDesc("");
          setShowSavingsForm(false);
        })
        .catch((err) => console.error("Error adding savings:", err));
    }
  };

  // 5) Helper functions
  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    setGoals((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const calculatePercentage = (current, goal) => {
    if (goal === 0) return 0;
    const percentage = (current / goal) * 100;
    return Math.min(percentage, 100);
  };

  const getExpenditureBarColor = () => {
    if (goals.expenditure === 0) return "bg-gray-300";
    const ratio = currentAmounts.expenditure / goals.expenditure;
    if (ratio >= 1) return "bg-red-600";
    if (ratio >= 0.6) return "bg-red-400";
    return "bg-red-200";
  };

  const getSavingsBarColor = () => {
    if (goals.savings === 0) return "bg-gray-300";
    const ratio = currentAmounts.savings / goals.savings;
    if (ratio >= 1) return "bg-green-600";
    if (ratio >= 0.6) return "bg-green-400";
    return "bg-green-200";
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-white drop-shadow-sm">
          Financial Goal Tracker
        </h1>

        {/* --------------- GOAL SETTING FORM --------------- */}
        {showGoalForm ? (
          <div className="mb-8 p-6 bg-white rounded-xl border border-indigo-100 shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700">
              Set Your Monthly Goals
            </h2>
            <form onSubmit={handleSetGoals}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-lg font-medium mb-2 text-gray-700"
                    htmlFor="expenditure"
                  >
                    Monthly Expenditure Goal (₹):
                  </label>
                  <input
                    type="number"
                    id="expenditure"
                    name="expenditure"
                    value={goals.expenditure}
                    onChange={handleGoalChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label
                    className="block text-lg font-medium mb-2 text-gray-700"
                    htmlFor="savings"
                  >
                    Monthly Savings Goal (₹):
                  </label>
                  <input
                    type="number"
                    id="savings"
                    name="savings"
                    value={goals.savings}
                    onChange={handleGoalChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-md"
                >
                  Set Goals
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* --------------- GOAL PROGRESS --------------- */
          <div className="mb-8 p-6 bg-white rounded-xl border border-indigo-100 shadow-md">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold text-indigo-700">
                Goal Progress
              </h2>
              <button
                onClick={() => setShowGoalForm(true)}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-1 rounded-lg font-medium text-sm transition-colors duration-200"
              >
                Edit Goals
              </button>
            </div>

            {/* Expenditure Progress */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  Expenditure
                </h3>
                <span className="font-medium text-gray-700">
                  ₹{currentAmounts.expenditure.toFixed(2)} of ₹
                  {goals.expenditure.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
                <div
                  className={`h-6 rounded-full ${getExpenditureBarColor()} transition-all duration-500 ease-in-out`}
                  style={{
                    width: `${calculatePercentage(
                      currentAmounts.expenditure,
                      goals.expenditure
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Savings Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-700">Savings</h3>
                <span className="font-medium text-gray-700">
                  ₹{currentAmounts.savings.toFixed(2)} of ₹
                  {goals.savings.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
                <div
                  className={`h-6 rounded-full ${getSavingsBarColor()} transition-all duration-500 ease-in-out`}
                  style={{
                    width: `${calculatePercentage(
                      currentAmounts.savings,
                      goals.savings
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* --------------- EXPENDITURE BREAKDOWN --------------- */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2 text-white">
            Expenditure Breakdown:
          </label>
          <select
            value={selectedExpenditureCategory}
            onChange={(e) => setSelectedExpenditureCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold capitalize text-indigo-700">
              {selectedExpenditureCategory} Expenditure
            </h2>
            <button
              onClick={() => setShowExpenditureForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Add Expenditure
            </button>
          </div>

          {/* Add Expenditure Form */}
          {showExpenditureForm && (
            <div className="mb-6 p-5 border border-indigo-100 rounded-lg bg-indigo-50 shadow-md">
              <h4 className="font-medium mb-3 text-black">
                Add New Expenditure
              </h4>
              <form onSubmit={handleAddExpenditure}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Amount (₹):
                    </label>
                    <input
                      type="number"
                      value={newExpenditure}
                      onChange={(e) => setNewExpenditure(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Description:
                    </label>
                    <input
                      type="text"
                      value={newExpenditureDesc}
                      onChange={(e) => setNewExpenditureDesc(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenditureForm(false)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Expenditure Table for the Selected Category */}
          {expenditureData[selectedExpenditureCategory]?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="p-3 text-left border border-indigo-100 text-white">
                      Date
                    </th>
                    <th className="p-3 text-left border border-indigo-100 text-white">
                      Description
                    </th>
                    <th className="p-3 text-left border border-indigo-100 text-white">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenditureData[selectedExpenditureCategory].map(
                    (item, index) => (
                      <tr
                        key={index}
                        className="border-b border-indigo-100 hover:bg-indigo-50 transition-colors duration-150"
                      >
                        <td className="p-3 border border-indigo-100">
                          {new Date(item.date).toLocaleDateString()}{" "}
                          {new Date(item.date).toLocaleTimeString()}
                        </td>
                        <td className="p-3 border border-indigo-100">
                          {item.description || "—"}
                        </td>
                        <td className="p-3 border border-indigo-100">
                          ₹{item.amount?.toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-100 font-bold">
                    <td className="p-3 border border-indigo-100" colSpan="2">
                      Total
                    </td>
                    <td className="p-3 border border-indigo-100">
                      ₹
                      {expenditureData[selectedExpenditureCategory]
                        .reduce((sum, item) => sum + (item.amount || 0), 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 italic">
                No expenditures in {selectedExpenditureCategory} yet. Click "Add
                Expenditure" to get started.
              </p>
            </div>
          )}
        </div>

        {/* --------------- SAVINGS BREAKDOWN --------------- */}
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2 text-white">
            Savings Breakdown:
          </label>
          <select
            value={selectedSavingsCategory}
            onChange={(e) => setSelectedSavingsCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold capitalize text-indigo-700">
              {selectedSavingsCategory} Savings
            </h2>
            <button
              onClick={() => setShowSavingsForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Add Savings
            </button>
          </div>

          {/* Add Savings Form */}
          {showSavingsForm && (
            <div className="mb-6 p-5 border border-indigo-100 rounded-lg bg-indigo-50 shadow-md">
              <h4 className="font-medium mb-3 text-black">Add New Savings</h4>
              <form onSubmit={handleAddSavings}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Amount (₹):
                    </label>
                    <input
                      type="number"
                      value={newSavingsAmount}
                      onChange={(e) => setNewSavingsAmount(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Description:
                    </label>
                    <input
                      type="text"
                      value={newSavingsDesc}
                      onChange={(e) => setNewSavingsDesc(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      placeholder="What are you saving for?"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSavingsForm(false)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Savings Table */}
          {savingsData[selectedSavingsCategory]?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="p-3 text-left border border-indigo-100 text-white">
                      Date
                    </th>
                    <th className="p-3 text-left border border-indigo-100 text-white">
                      Description
                    </th>
                    <th className="p-3 text-left border border-indigo-100 text-white">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {savingsData[selectedSavingsCategory].map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-indigo-100 hover:bg-indigo-50 transition-colors duration-150"
                    >
                      <td className="p-3 border border-indigo-100">
                        {new Date(item.date).toLocaleDateString()}{" "}
                        {new Date(item.date).toLocaleTimeString()}
                      </td>
                      <td className="p-3 border border-indigo-100">
                        {item.description}
                      </td>
                      <td className="p-3 border border-indigo-100">
                        ₹{item.amount?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-100 font-bold">
                    <td className="p-3 border border-indigo-100" colSpan="2">
                      Total
                    </td>
                    <td className="p-3 border border-indigo-100">
                      ₹
                      {savingsData[selectedSavingsCategory]
                        .reduce((sum, item) => sum + (item.amount || 0), 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 italic">
                No savings in {selectedSavingsCategory} yet. Click "Add Savings"
                to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goal;
