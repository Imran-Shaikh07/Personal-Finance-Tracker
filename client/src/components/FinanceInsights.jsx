
import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getMonthKey(date) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(2, "0")}`;
}

function InsightCard({ title, value, description, color, cardClass, mutedClass }) {
  return (
    <div className={cardClass}>
      <p className={`text-sm font-medium ${mutedClass}`}>{title}</p>
      <p className={`mt-3 break-words text-2xl font-bold ${color}`}>
        {value}
      </p>
      <p className={`mt-2 text-sm ${mutedClass}`}>{description}</p>
    </div>
  );
}

export default function FinanceInsights({ transactions = [] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const cardClass = isDark
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const insights = useMemo(() => {
    let income = 0;
    let expenses = 0;

    const categoryTotals = {};
    const expenseDates = new Set();
    const monthlyExpenses = {};

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        income += amount;
        return;
      }

      if (transaction.type !== "expense") return;

      expenses += amount;

      const category = transaction.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + amount;

      const monthKey = getMonthKey(transaction.date);

      if (monthKey) {
        monthlyExpenses[monthKey] =
          (monthlyExpenses[monthKey] || 0) + amount;
      }

      if (transaction.date) {
        const date = new Date(transaction.date);

        if (!Number.isNaN(date.getTime())) {
          expenseDates.add(
            `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
          );
        }
      }
    });

    const topCategory = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : null;

    const averageDailyExpense =
      expenseDates.size > 0 ? expenses / expenseDates.size : null;

    const now = new Date();
    const currentMonthKey = getMonthKey(now);
    const previousMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthKey = getMonthKey(previousMonthDate);

    const currentMonthExpenses =
      monthlyExpenses[currentMonthKey] || 0;
    const previousMonthExpenses =
      monthlyExpenses[previousMonthKey] || 0;

    let monthlyChange = null;

    if (previousMonthExpenses > 0) {
      monthlyChange =
        ((currentMonthExpenses - previousMonthExpenses) /
          previousMonthExpenses) *
        100;
    } else if (currentMonthExpenses > 0) {
      monthlyChange = Infinity;
    }

    return {
      income,
      expenses,
      savings,
      savingsRate,
      topCategory,
      averageDailyExpense,
      currentMonthExpenses,
      previousMonthExpenses,
      monthlyChange,
    };
  }, [transactions]);

  const savingsColor =
    insights.savings < 0 ? "text-rose-500" : "text-emerald-500";

  let monthlyDescription = "No previous-month expense baseline yet.";
  let monthlyColor = "text-indigo-500";

  if (insights.monthlyChange === Infinity) {
    monthlyDescription = "Spending occurred this month, but not last month.";
    monthlyColor = "text-amber-500";
  } else if (insights.monthlyChange !== null) {
    const change = insights.monthlyChange;
    monthlyDescription =
      `${Math.abs(change).toFixed(1)}% ${
        change > 0 ? "higher" : change < 0 ? "lower" : "unchanged"
      } than last month.`;

    monthlyColor = change > 0 ? "text-rose-500" : "text-emerald-500";
  } else if (insights.currentMonthExpenses === 0) {
    monthlyDescription = "No expenses recorded this month.";
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Spending insights</h2>
        <p className={`mt-1 text-sm ${mutedClass}`}>
          A quick summary of your financial habits.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          title="Savings rate"
          value={
            insights.savingsRate === null
              ? "N/A"
              : `${insights.savingsRate.toFixed(1)}%`
          }
          description={
            insights.savingsRate === null
              ? "Add income transactions to calculate this."
              : insights.savingsRate < 0
                ? "Your expenses exceed your income."
                : "Net savings as a percentage of income."
          }
          color={savingsColor}
          cardClass={cardClass}
          mutedClass={mutedClass}
        />

        <InsightCard
          title="Top spending category"
          value={
            insights.topCategory
              ? insights.topCategory[0]
              : "No expenses"
          }
          description={
            insights.topCategory
              ? `${formatMoney(insights.topCategory[1])} spent in this category.`
              : "Add expense transactions to see your top category."
          }
          color="text-indigo-500"
          cardClass={cardClass}
          mutedClass={mutedClass}
        />

        <InsightCard
          title="Average daily spending"
          value={
            insights.averageDailyExpense === null
              ? "N/A"
              : formatMoney(insights.averageDailyExpense)
          }
          description="Average across dates with recorded expenses."
          color="text-amber-500"
          cardClass={cardClass}
          mutedClass={mutedClass}
        />

        <InsightCard
          title="Monthly spending change"
          value={
            insights.monthlyChange === null
              ? "N/A"
              : insights.monthlyChange === Infinity
                ? "New spending"
                : `${insights.monthlyChange > 0 ? "+" : ""}${insights.monthlyChange.toFixed(1)}%`
          }
          description={monthlyDescription}
          color={monthlyColor}
          cardClass={cardClass}
          mutedClass={mutedClass}
        />
      </div>
    </section>
  );
}
