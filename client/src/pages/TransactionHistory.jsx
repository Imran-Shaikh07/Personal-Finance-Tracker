
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiRequest } from "../api";
import BrandLogo from "../components/BrandLogo";

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getDateKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: "all",
    category: "all",
    minAmount: "",
    maxAmount: "",
  });

  const [sortOrder, setSortOrder] = useState("newest");

  // Theme styles
  const pageClass = isDark
    ? "min-h-screen bg-[#091713] text-white"
    : "min-h-screen bg-[#F5FBF8] text-slate-900";

  const cardClass = isDark
    ? "rounded-2xl border border-[#17382E] bg-[#0D2019] p-5 shadow-lg shadow-black/10"
    : "rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const inputClass = isDark
    ? "w-full min-w-0 rounded-xl border border-[#21463B] bg-[#091713] px-3 py-2.5 text-white outline-none transition placeholder:text-slate-500 focus:border-[#00D6A0] focus:ring-2 focus:ring-[#00D6A0]/10"
    : "w-full min-w-0 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10";

  const secondaryButton = isDark
    ? "rounded-xl border border-[#21463B] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#00D6A0] hover:bg-[#10251D]"
    : "rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-[#12352D] transition hover:bg-emerald-50";

  const tableBorder = isDark
    ? "border-[#17382E]"
    : "border-emerald-100";

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/transactions");
      const list = Array.isArray(data)
        ? data
        : data?.transactions;

      if (!Array.isArray(list)) {
        throw new Error("Unexpected response from transactions API.");
      }

      setTransactions(list);
    } catch (err) {
      setError(err.message || "Could not load transaction history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Available categories
  const availableCategories = useMemo(() => {
    return [
      ...new Set(
        transactions
          .map((transaction) => transaction.category)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return transactions
      .filter((transaction) => {
        const date = getDateKey(transaction.date);
        const amount = Number(transaction.amount) || 0;

        const matchesStart =
          !filters.startDate ||
          (date && date >= filters.startDate);

        const matchesEnd =
          !filters.endDate ||
          (date && date <= filters.endDate);

        const matchesType =
          filters.type === "all" ||
          transaction.type === filters.type;

        const matchesCategory =
          filters.category === "all" ||
          transaction.category === filters.category;

        const matchesMin =
          filters.minAmount === "" ||
          amount >= Number(filters.minAmount);

        const matchesMax =
          filters.maxAmount === "" ||
          amount <= Number(filters.maxAmount);

        const searchableText = [
          transaction.category,
          transaction.description,
          transaction.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !keyword || searchableText.includes(keyword);

        return (
          matchesStart &&
          matchesEnd &&
          matchesType &&
          matchesCategory &&
          matchesMin &&
          matchesMax &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        if (sortOrder === "highest") {
          return Number(b.amount || 0) - Number(a.amount || 0);
        }

        if (sortOrder === "lowest") {
          return Number(a.amount || 0) - Number(b.amount || 0);
        }

        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;

        return sortOrder === "oldest"
          ? dateA - dateB
          : dateB - dateA;
      });
  }, [transactions, filters, search, sortOrder]);

  // Summary totals
  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (result, transaction) => {
        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "income") {
          result.income += amount;
        } else if (transaction.type === "expense") {
          result.expenses += amount;
        }

        return result;
      },
      { income: 0, expenses: 0 }
    );
  }, [filteredTransactions]);

  function updateFilter(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function clearFilters() {
    setSearch("");

    setFilters({
      startDate: "",
      endDate: "",
      type: "all",
      category: "all",
      minAmount: "",
      maxAmount: "",
    });

    setSortOrder("newest");
  }

  // Export filtered transactions to CSV
  function exportCsv() {
    const headers = [
      "Date",
      "Type",
      "Category",
      "Description",
      "Amount",
    ];

    const rows = filteredTransactions.map((transaction) => [
      formatDate(transaction.date),
      transaction.type,
      transaction.category,
      transaction.description || "",
      Number(transaction.amount) || 0,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "transaction-history.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className={pageClass}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? "border-[#12352D] bg-[#091713]/95"
            : "border-emerald-100 bg-white/95"
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          {/* Brand and page title */}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <BrandLogo />

            <div
              className={`hidden h-10 w-px sm:block ${
                isDark ? "bg-[#21463B]" : "bg-slate-200"
              }`}
            />

            <div className="min-w-0">
              <h1
                className={`text-xl font-bold tracking-tight sm:text-2xl ${
                  isDark ? "text-white" : "text-[#091713]"
                }`}
              >
                Transaction History
              </h1>

              <p className={`mt-1 text-sm ${mutedClass}`}>
                Welcome, {user?.name || "User"}
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#00D6A0] px-4 py-2 text-sm font-bold text-[#071510] transition hover:bg-[#00F0B5]"
            >
              <span aria-hidden="true">←</span>
              Dashboard
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                isDark
                  ? "border-[#21463B] bg-[#0D2019] text-white hover:border-[#00D6A0]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Error message */}
        {error && (
          <div
            role="alert"
            className={`rounded-xl border p-4 text-sm ${
              isDark
                ? "border-rose-900 bg-rose-950/40 text-rose-300"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {error}
            <button
              type="button"
              onClick={loadTransactions}
              className="ml-3 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className={cardClass}>
            <p className={`text-sm font-medium ${mutedClass}`}>
              Matching transactions
            </p>
            <p className="mt-2 text-2xl font-bold">
              {filteredTransactions.length}
            </p>
            <div className="mt-4 h-1 w-14 rounded-full bg-[#00D6A0]" />
          </div>

          <div className={cardClass}>
            <p className={`text-sm font-medium ${mutedClass}`}>
              Filtered income
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-emerald-400">
              {formatMoney(summary.income)}
            </p>
          </div>

          <div className={cardClass}>
            <p className={`text-sm font-medium ${mutedClass}`}>
              Filtered expenses
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-rose-400">
              {formatMoney(summary.expenses)}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Filter transactions</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Combine filters to find specific records.
              </p>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className={secondaryButton}
            >
              Clear all
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="history-search"
                className="mb-2 block text-sm font-medium"
              >
                Search
              </label>
              <input
                id="history-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Category, description, type..."
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="history-start"
                className="mb-2 block text-sm font-medium"
              >
                From date
              </label>
              <input
                id="history-start"
                type="date"
                name="startDate"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={updateFilter}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="history-end"
                className="mb-2 block text-sm font-medium"
              >
                To date
              </label>
              <input
                id="history-end"
                type="date"
                name="endDate"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={updateFilter}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="history-type"
                className="mb-2 block text-sm font-medium"
              >
                Transaction type
              </label>
              <select
                id="history-type"
                name="type"
                value={filters.type}
                onChange={updateFilter}
                className={inputClass}
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="history-category"
                className="mb-2 block text-sm font-medium"
              >
                Category
              </label>
              <select
                id="history-category"
                name="category"
                value={filters.category}
                onChange={updateFilter}
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
                htmlFor="history-sort"
                className="mb-2 block text-sm font-medium"
              >
                Sort by
              </label>
              <select
                id="history-sort"
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

            <div>
              <label
                htmlFor="history-min"
                className="mb-2 block text-sm font-medium"
              >
                Minimum amount (₹)
              </label>
              <input
                id="history-min"
                type="number"
                min="0"
                step="0.01"
                name="minAmount"
                value={filters.minAmount}
                onChange={updateFilter}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="history-max"
                className="mb-2 block text-sm font-medium"
              >
                Maximum amount (₹)
              </label>
              <input
                id="history-max"
                type="number"
                min="0"
                step="0.01"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={updateFilter}
                placeholder="No limit"
                className={inputClass}
              />
            </div>
          </div>

          {filters.minAmount !== "" &&
            filters.maxAmount !== "" &&
            Number(filters.minAmount) > Number(filters.maxAmount) && (
              <p className="mt-3 text-sm text-rose-400">
                Minimum amount cannot be greater than maximum amount.
              </p>
            )}
        </section>

        {/* Transaction table */}
        <section className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">All transactions</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Showing {filteredTransactions.length} of{" "}
                {transactions.length} records
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadTransactions}
                disabled={loading}
                className={secondaryButton}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredTransactions.length === 0}
                className="rounded-xl bg-[#00D6A0] px-4 py-2.5 text-sm font-bold text-[#071510] transition hover:bg-[#00F0B5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <p className={`py-12 text-center ${mutedClass}`}>
              Loading transaction history...
            </p>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-semibold">No transactions found</p>
              <p className={`mt-2 text-sm ${mutedClass}`}>
                Try different filters or add a transaction from your dashboard.
              </p>
            </div>
          ) : (
            <div className={`mt-5 overflow-x-auto rounded-xl border ${tableBorder}`}>
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead
                  className={
                    isDark
                      ? "bg-[#10251D] text-slate-300"
                      : "bg-emerald-50 text-slate-600"
                  }
                >
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className={`border-t transition-colors ${
                        isDark
                          ? "border-[#17382E] hover:bg-[#10251D]"
                          : "border-emerald-50 hover:bg-emerald-50/60"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="px-4 py-4 font-medium">
                        {transaction.category || "Other"}
                      </td>

                      <td className={`max-w-xs px-4 py-4 ${mutedClass}`}>
                        <span className="block truncate">
                          {transaction.description || "No description"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            transaction.type === "income"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>

                      <td
                        className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                          transaction.type === "income"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {formatMoney(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
