
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiRequest } from "../api";
import FinanceCharts from "../components/FinanceCharts";
import FinanceInsights from "../components/FinanceInsights";
import BudgetSummary from "../components/BudgetSummary";
import BrandLogo from "../components/BrandLogo";

const emptyForm = {
  type: "expense",
  amount: "",
  category: "Food",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

const categories = {
  income: ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"],
  expense: [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Education",
    "Other",
  ],
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "all",
    type: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const isDark = theme === "dark";

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 text-slate-100"
    : "min-h-screen bg-slate-50 text-slate-900";

  const cardClass = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  const inputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 outline-none focus:border-indigo-500"
    : "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500";

  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const borderClass = isDark ? "border-slate-800" : "border-slate-200";

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/transactions");
      const list = Array.isArray(data) ? data : data.transactions;

      if (!Array.isArray(list)) {
        throw new Error("Unexpected response from the transactions API.");
      }

      setTransactions(list);
    } catch (err) {
      setError(err.message || "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const expenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);


  const filteredTransactions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return transactions
      .filter((transaction) => {
        const transactionDate = transaction.date
          ? new Date(transaction.date).toISOString().slice(0, 10)
          : "";

        const matchesStartDate =
          !filters.startDate || transactionDate >= filters.startDate;

        const matchesEndDate =
          !filters.endDate || transactionDate <= filters.endDate;

        const matchesCategory =
          filters.category === "all" ||
          transaction.category === filters.category;

        const matchesType =
          filters.type === "all" ||
          transaction.type === filters.type;

        const matchesSearch =
          !search ||
          (transaction.category || "").toLowerCase().includes(search) ||
          (transaction.description || "").toLowerCase().includes(search) ||
          (transaction.type || "").toLowerCase().includes(search);

        return (
          matchesStartDate &&
          matchesEndDate &&
          matchesCategory &&
          matchesType &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;

        if (sortOrder === "oldest") return dateA - dateB;
        if (sortOrder === "highest") {
          return Number(b.amount || 0) - Number(a.amount || 0);
        }
        if (sortOrder === "lowest") {
          return Number(a.amount || 0) - Number(b.amount || 0);
        }

        return dateB - dateA;
      });
  }, [transactions, filters, searchTerm, sortOrder]);


  const availableCategories = [
    ...new Set(transactions.map((transaction) => transaction.category)),
  ];

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      startDate: "",
      endDate: "",
      category: "all",
      type: "all",
    });

    setSearchTerm("");
    setSortOrder("newest");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "type"
        ? { category: value === "income" ? "Salary" : "Food" }
        : {}),
    }));
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
        throw new Error("Enter an amount greater than zero.");
      }

      if (editingId) {
        await apiRequest(`/transactions/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSuccess("Transaction updated successfully.");
      } else {
        await apiRequest("/transactions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Transaction added successfully.");
      }

      resetForm();
      await loadTransactions();
    } catch (err) {
      setError(err.message || "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(transaction) {
    setEditingId(transaction._id);

    setForm({
      type: transaction.type,
      amount: String(transaction.amount),
      category: transaction.category,
      description: transaction.description || "",
      date: transaction.date
        ? new Date(transaction.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });

    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await apiRequest(`/transactions/${id}`, {
        method: "DELETE",
      });

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Transaction deleted successfully.");
      await loadTransactions();
    } catch (err) {
      setError(err.message || "Could not delete transaction.");
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Supports a relative image URL such as /uploads/photo.jpg.
  const profilePhoto = user?.profilePhoto
    ? user.profilePhoto.startsWith("http")
      ? user.profilePhoto
      : `http://localhost:5000${user.profilePhoto}`
    : "";

  return (
    <div className={pageClass}>
     
<header
  className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
    isDark
      ? "border-[#12352D] bg-[#091713]/95"
      : "border-emerald-100 bg-white/95"
  } backdrop-blur-xl`}
>
  <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">

    {/* Left: Brand and page information */}
    <div className="flex min-w-0 items-center gap-4">
      <BrandLogo />

      <div
        className={`hidden h-11 w-px sm:block ${
          isDark ? "bg-[#21463B]" : "bg-slate-200"
        }`}
      />

      <div className="min-w-0">
        <h1
          className={`text-lg font-bold tracking-tight sm:text-xl ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          My Dashboard
        </h1>

        <p className={`mt-1 text-sm ${mutedText}`}>
          Welcome back, {user?.name || "User"}
        </p>
      </div>
    </div>

    {/* Right: Actions */}
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
          isDark
            ? "border-[#21463B] bg-[#0D2019] text-slate-200 hover:border-[#00D6A0] hover:text-[#00D6A0]"
            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
        }`}
      >
        {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      <button
        type="button"
        onClick={() => navigate("/transaction-history")}
        className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
          isDark
            ? "border-[#21463B] bg-[#0D2019] text-slate-200 hover:border-[#00D6A0] hover:text-[#00D6A0]"
            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
        }`}
      >
        Transaction History
      </button>

      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#00D6A0] px-4 py-2 text-sm font-bold text-[#071510] shadow-sm transition hover:bg-[#00F0B5] hover:shadow-md"
      >
        My Profile
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
          isDark
            ? "border-[#21463B] text-slate-200 hover:border-red-400 hover:bg-red-950/30"
            : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        }`}
      >
        Logout
      </button>
    </div>
  </div>
</header>


      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Financial overview</h2>
            <p className={`text-sm ${mutedText}`}>
              Calculated from your saved transactions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
              title="Total Income"
              amount={totals.income}
              color="text-emerald-500"
              cardClass={cardClass}
              mutedText={mutedText}
            />
            <SummaryCard
              title="Total Expenses"
              amount={totals.expenses}
              color="text-rose-500"
              cardClass={cardClass}
              mutedText={mutedText}
            />
            <SummaryCard
              title="Net Balance"
              amount={totals.balance}
              color="text-indigo-500"
              cardClass={cardClass}
              mutedText={mutedText}
            />
          </div>
        </section>
        <BudgetSummary
          transactions={transactions}
          userKey={user?._id || user?.id || user?.email || "default"}
        />
        <FinanceCharts transactions={transactions} />
        <FinanceInsights transactions={transactions} />


        <section className="grid items-start gap-8 lg:grid-cols-[380px_1fr]">
          <div className={cardClass}>
            <h2 className="text-lg font-bold">
              {editingId ? "Edit transaction" : "Add transaction"}
            </h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Record your income and expenses.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="type" className="mb-1.5 block text-sm font-medium">
                  Transaction type
                </label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="mb-1.5 block text-sm font-medium">
                  Amount (₹)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-medium">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {categories[form.type].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="mb-1.5 block text-sm font-medium">
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  placeholder="What was this transaction for?"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#00D6A0] text-[#071510] hover:bg-[#00F0B5] px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add transaction"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`w-full rounded-xl border px-4 py-3 font-semibold ${isDark
                    ? "border-slate-700 hover:bg-slate-800"
                    : "border-slate-300 hover:bg-slate-50"
                    }`}
                >
                  Cancel editing
                </button>
              )}
            </form>
          </div>

          <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Recent transactions</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  {transactions.length} transaction
                  {transactions.length === 1 ? "" : "s"} recorded
                </p>
              </div>

              <button
                type="button"
                onClick={loadTransactions}
                disabled={loading}
                className={`rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-60 ${isDark
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-slate-300 hover:bg-slate-50"
                  }`}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* Transaction filters */}

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="transaction-search"
                  className="mb-2 block text-sm font-medium"
                >
                  Search transactions
                </label>
                <input
                  id="transaction-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search category or description..."
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="transaction-sort"
                  className="mb-2 block text-sm font-medium"
                >
                  Sort by
                </label>
                <select
                  id="transaction-sort"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className={inputClass}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest amount</option>
                  <option value="lowest">Lowest amount</option>
                </select>
              </div>
            </div>

            <div
              className={`my-5 grid gap-4 rounded-xl border p-4 sm:grid-cols-2 xl:grid-cols-4 ${isDark
                ? "border-slate-800 bg-slate-950"
                : "border-slate-200 bg-slate-50"
                }`}
            >
              <div>
                <label
                  htmlFor="filter-start-date"
                  className="mb-2 block text-sm font-medium"
                >
                  From date
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  max={filters.endDate || undefined}
                  onChange={handleFilterChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="filter-end-date"
                  className="mb-2 block text-sm font-medium"
                >
                  To date
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  min={filters.startDate || undefined}
                  onChange={handleFilterChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="filter-category"
                  className="mb-2 block text-sm font-medium"
                >
                  Category
                </label>
                <select
                  id="filter-category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className={inputClass}
                >
                  <option value="all">All categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-type"
                  className="mb-2 block text-sm font-medium"
                >
                  Transaction type
                </label>
                <select
                  id="filter-type"
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className={inputClass}
                >
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:col-span-2 xl:col-span-4">
                <p className={`text-sm ${mutedText}`}>
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold ${isDark
                    ? "border-slate-700 hover:bg-slate-800"
                    : "border-slate-300 hover:bg-white"
                    }`}
                >
                  Clear filters
                </button>
              </div>
            </div>

            {loading ? (
              <p className={`py-12 text-center ${mutedText}`}>
                Loading transactions...
              </p>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-semibold">No matching transactions</p>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Try changing your filters or clear them to see all transactions.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead>
                    <tr className={`border-b ${borderClass} ${mutedText}`}>
                      <th className="px-3 py-3 font-medium">Transaction</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Amount</th>
                      <th className="px-3 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className={`border-b ${borderClass} last:border-0`}
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold">{transaction.category}</p>
                          <p className={`mt-1 max-w-48 truncate text-xs ${mutedText}`}>
                            {transaction.description || "No description"}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize ${isDark
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            {transaction.type}
                          </span>
                        </td>

                        <td className={`whitespace-nowrap px-3 py-4 ${mutedText}`}>
                          {new Date(transaction.date).toLocaleDateString("en-IN")}
                        </td>

                        <td
                          className={`whitespace-nowrap px-3 py-4 font-semibold ${transaction.type === "income"
                            ? "text-emerald-500"
                            : "text-rose-500"
                            }`}
                        >
                          {transaction.type === "income" ? "+" : "−"}
                          {formatMoney(Number(transaction.amount))}
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(transaction)}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${isDark
                                ? "border-slate-700 hover:bg-slate-800"
                                : "border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(transaction._id)}
                              className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ title, amount, color, cardClass, mutedText }) {
  return (
    <div className={cardClass}>
      <p className={`text-sm font-medium ${mutedText}`}>{title}</p>
      <div className={`mt-3 text-2xl font-bold tracking-tight ${color}`}>
        {formatMoney(amount)}
      </div>
    </div>
  );
}
