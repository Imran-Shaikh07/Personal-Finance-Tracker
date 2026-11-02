
import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function getMonthKey(date) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatMonth(key) {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

export default function FinanceCharts({ transactions = [] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  const cardClass = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const expenseCategories = useMemo(() => {
    const totals = {};

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;

      const category = transaction.category || "Other";
      totals[category] =
        (totals[category] || 0) + Number(transaction.amount || 0);
    });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const totals = {};

    transactions.forEach((transaction) => {
      const key = getMonthKey(transaction.date);

      if (!key) return;

      if (!totals[key]) {
        totals[key] = { month: key, income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        totals[key].income += Number(transaction.amount || 0);
      } else if (transaction.type === "expense") {
        totals[key].expenses += Number(transaction.amount || 0);
      }
    });

    return Object.values(totals)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((item) => ({
        ...item,
        monthLabel: formatMonth(item.month),
      }));
  }, [transactions]);

  const dailySpending = useMemo(() => {
    const totals = {};

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense" || !transaction.date) return;

      const date = new Date(transaction.date);

      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      totals[key] = (totals[key] || 0) + Number(transaction.amount || 0);
    });

    return Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, amount]) => ({
        date: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        amount,
      }));
  }, [transactions]);

  const tooltipStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    border: `1px solid ${gridColor}`,
    borderRadius: "12px",
    color: isDark ? "#f1f5f9" : "#0f172a",
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Financial charts</h2>
        <p className={`mt-1 text-sm ${mutedClass}`}>
          Visual reports generated from your transactions.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className={cardClass}>
          <h3 className="font-semibold">Expense by category</h3>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            See which categories account for your spending.
          </p>

          {expenseCategories.length === 0 ? (
            <p className={`py-16 text-center text-sm ${mutedClass}`}>
              Add expense transactions to see this chart.
            </p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {expenseCategories.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: textColor }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <h3 className="font-semibold">Monthly income vs. expenses</h3>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Compare the last six months with recorded transactions.
          </p>

          {monthlyData.length === 0 ? (
            <p className={`py-16 text-center text-sm ${mutedClass}`}>
              Add transactions to see monthly comparisons.
            </p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: textColor, fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${value / 1000}k` : value
                    }
                    width={45}
                  />
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={tooltipStyle}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={`${cardClass} xl:col-span-2`}>
          <h3 className="font-semibold">Recent daily expenses</h3>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Spending recorded on your latest 14 expense dates.
          </p>

          {dailySpending.length === 0 ? (
            <p className={`py-16 text-center text-sm ${mutedClass}`}>
              Add expense transactions to see your spending trend.
            </p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailySpending}
                  margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: textColor, fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${value / 1000}k` : value
                    }
                    width={45}
                  />
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={tooltipStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Expenses"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
