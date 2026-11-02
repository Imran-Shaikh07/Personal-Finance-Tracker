
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
}

function getMonthKey(dateValue) {
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetSummary({
    transactions = [],
    userKey = "default",
}) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const currentMonth = getCurrentMonthKey();
    const storageKey = `finance-budgets-${userKey}`;

    const [budgets, setBudgets] = useState({});
    const [budgetInput, setBudgetInput] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [message, setMessage] = useState("");

    const cardClass = isDark
        ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
        : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

    const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

    const inputClass = isDark
        ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
        : "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-500";

    const buttonClass =
        "rounded-xl bg-[#00D6A0] text-[#071510] hover:bg-[#00F0B5] px-5 py-3 font-semibold text-white transition hover:bg-indigo-700";

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            const parsed = saved ? JSON.parse(saved) : {};

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                setBudgets(parsed);
                setBudgetInput(
                    parsed[currentMonth] !== undefined
                        ? String(parsed[currentMonth])
                        : ""
                );
            }
        } catch (error) {
            console.error("Could not load saved budgets:", error);
            setBudgets({});
            setBudgetInput("");
        } finally {
            setLoaded(true);
        }
    }, [storageKey, currentMonth]);

    const monthlyExpenses = useMemo(() => {
        return transactions.reduce((total, transaction) => {
            if (transaction.type !== "expense") return total;
            if (getMonthKey(transaction.date) !== currentMonth) return total;

            return total + (Number(transaction.amount) || 0);
        }, 0);
    }, [transactions, currentMonth]);

    const budget = Number(budgets[currentMonth]) || 0;
    const remaining = budget - monthlyExpenses;
    const percentageUsed =
        budget > 0 ? (monthlyExpenses / budget) * 100 : 0;

    const progressWidth = Math.min(percentageUsed, 100);

    const progressColor =
        percentageUsed >= 100
            ? "bg-rose-500"
            : percentageUsed >= 80
                ? "bg-amber-500"
                : "bg-emerald-500";

    const monthLabel = new Date().toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });

    function handleSaveBudget(event) {
        event.preventDefault();
        setMessage("");

        const amount = Number(budgetInput);

        if (!budgetInput.trim() || !Number.isFinite(amount) || amount <= 0) {
            setMessage("Enter a valid budget amount greater than zero.");
            return;
        }

        const updatedBudgets = {
            ...budgets,
            [currentMonth]: amount,
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedBudgets));
            setBudgets(updatedBudgets);
            setMessage("Monthly budget saved successfully.");
        } catch (error) {
            console.error("Could not save budget:", error);
            setMessage("Could not save your budget. Please try again.");
        }
    }

    function handleRemoveBudget() {
        const updatedBudgets = { ...budgets };
        delete updatedBudgets[currentMonth];

        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedBudgets));
            setBudgets(updatedBudgets);
            setBudgetInput("");
            setMessage("Current month's budget removed.");
        } catch (error) {
            console.error("Could not remove budget:", error);
            setMessage("Could not remove the budget. Please try again.");
        }
    }

    if (!loaded) {
        return (
            <section className={cardClass}>
                <p className={mutedClass}>Loading your monthly budget...</p>
            </section>
        );
    }

    return (
        <section className="space-y-5">
            <div>
                <h2 className="text-xl font-bold">Monthly budget</h2>
                <p className={`mt-1 text-sm ${mutedClass}`}>
                    Set a spending limit and monitor your expenses for {monthLabel}.
                </p>
            </div>

            <div className={cardClass}>
                <form
                    onSubmit={handleSaveBudget}
                    className="grid gap-4 sm:grid-cols-[1fr_auto]"
                >
                    <div>
                        <label
                            htmlFor="monthly-budget"
                            className="mb-2 block text-sm font-semibold"
                        >
                            Set your monthly spending limit (₹)
                        </label>

                        <input
                            id="monthly-budget"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={budgetInput}
                            onChange={(event) => setBudgetInput(event.target.value)}
                            placeholder="Example: 20000"
                            className={inputClass}
                        />
                    </div>

                    <div className="flex items-end ">
                        <button type="submit" className={buttonClass}>
                            Save budget
                        </button>
                    </div>
                </form>

                {message && (
                    <p
                        role="status"
                        className={`mt-3 text-sm ${message.toLowerCase().includes("successfully") ||
                                message.toLowerCase().includes("removed")
                                ? "text-emerald-500"
                                : "text-rose-500"
                            }`}
                    >
                        {message}
                    </p>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className={cardClass}>
                    <p className={`text-sm font-medium ${mutedClass}`}>
                        Monthly budget
                    </p>
                    <p className="mt-3 break-words text-2xl font-bold text-indigo-500">
                        {budget > 0 ? formatMoney(budget) : "Not set"}
                    </p>
                </div>

                <div className={cardClass}>
                    <p className={`text-sm font-medium ${mutedClass}`}>
                        Expenses this month
                    </p>
                    <p className="mt-3 break-words text-2xl font-bold text-rose-500">
                        {formatMoney(monthlyExpenses)}
                    </p>
                </div>

                <div className={cardClass}>
                    <p className={`text-sm font-medium ${mutedClass}`}>
                        Budget remaining
                    </p>
                    <p
                        className={`mt-3 break-words text-2xl font-bold ${budget <= 0
                                ? "text-slate-400"
                                : remaining < 0
                                    ? "text-rose-500"
                                    : "text-emerald-500"
                            }`}
                    >
                        {budget > 0 ? formatMoney(Math.abs(remaining)) : "—"}
                    </p>
                    {budget > 0 && remaining < 0 && (
                        <p className={`mt-1 text-xs ${mutedClass}`}>
                            Amount over budget
                        </p>
                    )}
                </div>

                <div className={cardClass}>
                    <p className={`text-sm font-medium ${mutedClass}`}>
                        Budget used
                    </p>
                    <p className="mt-3 text-2xl font-bold">
                        {budget > 0 ? `${percentageUsed.toFixed(1)}%` : "—"}
                    </p>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="font-semibold">Spending progress</h3>
                        <p className={`mt-1 text-sm ${mutedClass}`}>
                            {budget > 0
                                ? `${formatMoney(monthlyExpenses)} spent out of ${formatMoney(budget)}`
                                : "Set a monthly budget to start tracking progress."}
                        </p>
                    </div>

                    {budget > 0 && (
                        <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${percentageUsed >= 100
                                    ? "bg-rose-500/10 text-rose-500"
                                    : percentageUsed >= 80
                                        ? "bg-amber-500/10 text-amber-500"
                                        : "bg-emerald-500/10 text-emerald-500"
                                }`}
                        >
                            {percentageUsed >= 100
                                ? "Budget exceeded"
                                : percentageUsed >= 80
                                    ? "Near budget limit"
                                    : "Within budget"}
                        </span>
                    )}
                </div>

                <div
                    className={`mt-5 h-4 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"
                        }`}
                    role="progressbar"
                    aria-label="Monthly budget used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(Math.round(percentageUsed), 100)}
                >
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${progressWidth}%` }}
                    />
                </div>

                {budget > 0 && (
                    <div className={`mt-2 flex justify-between gap-3 text-xs ${mutedClass}`}>
                        <span>0%</span>
                        <span>80% warning</span>
                        <span>100%</span>
                    </div>
                )}

                {budget <= 0 ? (
                    <p className={`mt-4 text-sm ${mutedClass}`}>
                        Your monthly budget has not been set yet.
                    </p>
                ) : percentageUsed >= 100 ? (
                    <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="font-semibold text-rose-500">
                            Budget exceeded!
                        </p>
                        <p className={`mt-1 text-sm ${mutedClass}`}>
                            You have spent {formatMoney(Math.abs(remaining))} more than
                            your monthly budget. Review your recent expenses.
                        </p>
                    </div>
                ) : percentageUsed >= 80 ? (
                    <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="font-semibold text-amber-500">
                            You are approaching your budget limit.
                        </p>
                        <p className={`mt-1 text-sm ${mutedClass}`}>
                            Only {formatMoney(remaining)} remains in your monthly budget.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="font-semibold text-emerald-500">
                            You are within your budget.
                        </p>
                        <p className={`mt-1 text-sm ${mutedClass}`}>
                            You can spend another {formatMoney(remaining)} before reaching
                            your monthly limit.
                        </p>
                    </div>
                )}

                {budget > 0 && (
                    <button
                        type="button"
                        onClick={handleRemoveBudget}
                        className={`mt-4 text-sm font-medium ${isDark
                                ? "text-slate-400 hover:text-rose-400"
                                : "text-slate-500 hover:text-rose-500"
                            }`}
                    >
                        Remove this month's budget
                    </button>
                )}
            </div>
        </section>
    );
}
