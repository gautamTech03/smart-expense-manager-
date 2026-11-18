
"use strict";

// ======================================
// 1. LOAD AND SAVE DATA
// ======================================

function loadArrayFromStorage(key, fallback = []) {
    const saved = localStorage.getItem(key);

    if (saved === null) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        console.error("Could not load " + key + ":", error);
        return fallback;
    }
}

let transactions = loadArrayFromStorage("transactions", [
    {
        id: 1,
        name: "Salary",
        amount: 20000,
        type: "income",
        category: "Salary",
        date: "2026-11-18"
    },
    {
        id: 2,
        name: "Food",
        amount: 500,
        type: "expense",
        category: "Food",
        date: "2026-11-18"
    },
    {
        id: 3,
        name: "Travel",
        amount: 300,
        type: "expense",
        category: "Travel",
        date: "2026-11-18"
    },
    {
        id: 4,
        name: "Shopping",
        amount: 700,
        type: "expense",
        category: "Shopping",
        date: "2026-11-18"
    }
]);

let budgets = loadArrayFromStorage("budgets", []);

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveBudgets() {
    localStorage.setItem("budgets", JSON.stringify(budgets));
}

// ======================================
// 2. CURRENCY CONVERSION
// ======================================

// All transaction and budget amounts are stored in INR.
// These rates convert INR into the selected display currency.

let exchangeRates = {
    INR: 1
};

const supportedCurrencies = ["INR", "USD", "EUR", "GBP"];

function getSelectedCurrency() {
    const savedCurrency =
        localStorage.getItem("smartTrackCurrency") || "INR";

    return supportedCurrencies.includes(savedCurrency)
        ? savedCurrency
        : "INR";
}

// Convert an INR amount into the selected currency.
function convertCurrency(amount) {
    const currency = getSelectedCurrency();
    const rate = exchangeRates[currency];

    if (!Number.isFinite(rate)) {
        return Number(amount) || 0;
    }

    return (Number(amount) || 0) * rate;
}

// Format the converted amount with the correct currency symbol.
function formatCurrency(amount) {
    const currency = getSelectedCurrency();
    const convertedAmount = convertCurrency(amount);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 2
    }).format(convertedAmount);
}

// Get the latest available exchange rate from INR.
async function loadExchangeRate(currency) {
    if (currency === "INR") {
        exchangeRates.INR = 1;
        return true;
    }

    try {
        const response = await fetch(
            `https://api.frankfurter.dev/v1/latest?base=INR&symbols=${currency}`
        );

        if (!response.ok) {
            throw new Error("Exchange rate request failed.");
        }

        const data = await response.json();
        const rate = data.rates[currency];

        if (!Number.isFinite(rate) || rate <= 0) {
            throw new Error("Invalid exchange rate.");
        }

        exchangeRates[currency] = rate;

        console.log(
            `1 INR = ${rate} ${currency}`
        );

        return true;

    } catch (error) {
        console.error("Currency conversion error:", error);
        return false;
    }
}

// ======================================
// 3. HELPER FUNCTIONS
// ======================================

function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTotal(type) {
    return transactions
        .filter(function (transaction) {
            return transaction.type === type;
        })
        .reduce(function (total, transaction) {
            return total + Number(transaction.amount);
        }, 0);
}

function getTotalExpensesByCategory(category) {
    return transactions
        .filter(function (transaction) {
            return transaction.type === "expense" &&
                transaction.category === category;
        })
        .reduce(function (total, transaction) {
            return total + Number(transaction.amount);
        }, 0);
}

function getMonthTransactions() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions.filter(function (transaction) {
        const transactionDate = new Date(
            transaction.date + "T00:00:00"
        );

        return transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear;
    });
}

// ======================================
// 4. PAGE NAVIGATION
// ======================================

const navLinks = document.querySelectorAll(".nav-link");

function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach(function (page) {
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-link").forEach(function (link) {
        link.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    const selectedLink = document.querySelector(
        `.nav-link[data-page="${pageId}"]`
    );

    if (selectedLink) {
        selectedLink.classList.add("active");
    }

    if (pageId === "analytics") {
        updateCharts();
    }
}

navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        showPage(link.dataset.page);
    });
});

// ======================================
// 5. UPDATE DASHBOARD
// ======================================

function updateDashboard() {
    const totalIncome = getTotal("income");
    const totalExpenses = getTotal("expense");
    const balance = totalIncome - totalExpenses;

    document.getElementById("balance").textContent =
        formatCurrency(balance);

    document.getElementById("income").textContent =
        formatCurrency(totalIncome);

    document.getElementById("expenses").textContent =
        formatCurrency(totalExpenses);
}

// ======================================
// 6. RECENT TRANSACTIONS
// ======================================

function updateRecentTransactions() {
    const container = document.getElementById(
        "dashboardRecentTransactions"
    );

    const recent = [...transactions]
        .sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) || b.id - a.id;
        })
        .slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = "<p>No transactions yet.</p>";
        return;
    }

    container.innerHTML = recent.map(function (transaction) {
        const isIncome = transaction.type === "income";
        const sign = isIncome ? "+" : "-";
        const amountClass = isIncome ? "income-text" : "expense-text";

        return `
            <div class="recent-item">
                <div>
                    <strong>${escapeHTML(transaction.name)}</strong>
                    <small>${escapeHTML(transaction.category)} · ${transaction.date}</small>
                </div>
                <span class="recent-amount ${amountClass}">
                    ${sign}${formatCurrency(transaction.amount)}
                </span>
            </div>
        `;
    }).join("");
}

// ======================================
// 7. DASHBOARD SPENDING INSIGHTS
// ======================================

function updateDashboardOverview() {
    const expenses = transactions.filter(function (transaction) {
        return transaction.type === "expense";
    });

    const categoryTotals = {};

    expenses.forEach(function (transaction) {
        const category = transaction.category;

        categoryTotals[category] =
            (categoryTotals[category] || 0) +
            Number(transaction.amount);
    });

    const categories = Object.entries(categoryTotals)
        .sort(function (a, b) {
            return b[1] - a[1];
        });

    const categoryElement =
        document.getElementById("topExpenseCategory");

    const totalElement =
        document.getElementById("dashboardExpenseTotal");

    const messageElement =
        document.getElementById("dashboardInsightMessage");

    if (categories.length === 0) {
        categoryElement.textContent = "No expenses";
        totalElement.textContent = formatCurrency(0);
        messageElement.textContent =
            "Add expense transactions to see your spending insights.";
        return;
    }

    const topCategory = categories[0];

    categoryElement.textContent = topCategory[0];
    totalElement.textContent = formatCurrency(topCategory[1]);

    messageElement.textContent =
        `Your highest spending category is ${topCategory[0]}.`;
}

// ======================================
// 8. ADD TRANSACTION
// ======================================

const transactionForm =
    document.getElementById("transactionForm");

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("transactionName").value.trim();
    const amount = Number(
        document.getElementById("transactionAmount").value
    );
    const type = document.getElementById("transactionType").value;
    const category = document.getElementById("transactionCategory").value;
    const date = document.getElementById("transactionDate").value;

    if (!name || !Number.isFinite(amount) || amount <= 0 || !date) {
        alert("Please enter valid transaction details.");
        return;
    }

    const newTransaction = {
        id: Date.now(),
        name: name,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    transactions.push(newTransaction);

    saveTransactions();
    refreshApp();

    transactionForm.reset();

    document.getElementById("transactionDate").value =
        getTodayString();

    alert("Transaction added successfully!");
});

// ======================================
// 9. DISPLAY TRANSACTIONS
// ======================================

function displayTransactions(list = transactions) {
    const transactionList =
        document.getElementById("transactionList");

    if (list.length === 0) {
        transactionList.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    No transactions found.
                </td>
            </tr>
        `;
        return;
    }

    transactionList.innerHTML = list.map(function (transaction) {
        const isIncome = transaction.type === "income";
        const amountClass = isIncome ? "income-text" : "expense-text";
        const sign = isIncome ? "+" : "-";

        return `
            <tr>
                <td>${escapeHTML(transaction.name)}</td>
                <td>${escapeHTML(transaction.category)}</td>
                <td>${escapeHTML(transaction.date)}</td>
                <td>${isIncome ? "Income" : "Expense"}</td>
                <td class="${amountClass}">
                    ${sign}${formatCurrency(transaction.amount)}
                </td>
                <td>
                    <button class="action-button"
                        onclick="editTransaction(${transaction.id})">
                        Edit
                    </button>
                    <button class="action-button delete-button"
                        onclick="deleteTransaction(${transaction.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// ======================================
// 10. SEARCH AND FILTER
// ======================================

function filterTransactions() {
    const searchValue = document
        .getElementById("searchInput")
        .value.toLowerCase()
        .trim();

    const typeValue =
        document.getElementById("typeFilter").value;

    const categoryValue =
        document.getElementById("categoryFilter").value;

    const filteredTransactions = transactions.filter(
        function (transaction) {
            const matchesSearch =
                transaction.name.toLowerCase().includes(searchValue) ||
                transaction.category.toLowerCase().includes(searchValue);

            const matchesType =
                typeValue === "all" || transaction.type === typeValue;

            const matchesCategory =
                categoryValue === "all" ||
                transaction.category === categoryValue;

            return matchesSearch && matchesType && matchesCategory;
        }
    );

    displayTransactions(filteredTransactions);
}

document.getElementById("searchInput")
    .addEventListener("input", filterTransactions);

document.getElementById("typeFilter")
    .addEventListener("change", filterTransactions);

document.getElementById("categoryFilter")
    .addEventListener("change", filterTransactions);

// ======================================
// 11. EDIT TRANSACTION
// ======================================

function editTransaction(id) {
    const transaction = transactions.find(function (item) {
        return item.id === id;
    });

    if (!transaction) {
        return;
    }

    const newName = prompt(
        "Enter transaction name:",
        transaction.name
    );

    if (newName === null) return;

    const cleanedName = newName.trim();

    if (!cleanedName) {
        alert("Transaction name cannot be empty.");
        return;
    }

    const newAmount = prompt(
        "Enter new amount in INR:",
        transaction.amount
    );

    if (newAmount === null) return;

    const parsedAmount = Number(newAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    transaction.name = cleanedName;
    transaction.amount = parsedAmount;

    saveTransactions();
    refreshApp();

    alert("Transaction updated successfully!");
}

// ======================================
// 12. DELETE TRANSACTION
// ======================================

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    transactions = transactions.filter(function (transaction) {
        return transaction.id !== id;
    });

    saveTransactions();
    refreshApp();

    alert("Transaction deleted successfully!");
}

// ======================================
// 13. CREATE OR UPDATE BUDGET
// ======================================

const budgetForm = document.getElementById("budgetForm");

budgetForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const category =
        document.getElementById("budgetCategory").value;

    const amount = Number(
        document.getElementById("budgetAmount").value
    );

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    const existingBudget = budgets.find(function (budget) {
        return budget.category === category;
    });

    if (existingBudget) {
        existingBudget.amount = amount;
        alert("Budget updated successfully!");
    } else {
        budgets.push({
            id: Date.now(),
            category: category,
            amount: amount
        });

        alert("Budget added successfully!");
    }

    saveBudgets();
    refreshApp();
    budgetForm.reset();
});

// ======================================
// 14. DISPLAY BUDGETS
// ======================================

function displayBudgets() {
    const budgetList = document.getElementById("budgetList");

    if (budgets.length === 0) {
        budgetList.innerHTML = "<p>No budgets created yet.</p>";
        return;
    }

    budgetList.innerHTML = budgets.map(function (budget) {
        const spent = getTotalExpensesByCategory(budget.category);
        const percentage = budget.amount > 0
            ? (spent / budget.amount) * 100
            : 0;

        const safePercentage = Math.min(percentage, 100);
        const overBudget = spent > budget.amount;

        return `
            <div class="budget-card">
                <h4>${escapeHTML(budget.category)}</h4>

                <p>
                    Spent: ${formatCurrency(spent)}
                </p>

                <p>
                    Limit: ${formatCurrency(budget.amount)}
                </p>

                <div class="progress-track">
                    <div class="progress-fill ${overBudget ? "over-budget" : ""}"
                        style="width: ${safePercentage}%">
                    </div>
                </div>

                <p>
                    ${percentage.toFixed(1)}% used
                    ${overBudget ? " - Over budget!" : ""}
                </p>

                <div class="budget-actions">
                    <button class="action-button delete-button"
                        onclick="deleteBudget(${budget.id})">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// ======================================
// 15. DELETE BUDGET
// ======================================

function deleteBudget(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this budget?"
    );

    if (!confirmed) return;

    budgets = budgets.filter(function (budget) {
        return budget.id !== id;
    });

    saveBudgets();
    refreshApp();
}

// ======================================
// 16. DASHBOARD BUDGET OVERVIEW
// ======================================

function updateDashboardBudgetOverview() {
    const container = document.getElementById(
        "dashboardBudgetOverview"
    );

    if (budgets.length === 0) {
        container.innerHTML = "<p>No budgets created yet.</p>";
        return;
    }

    container.innerHTML = budgets.map(function (budget) {
        const spent = getTotalExpensesByCategory(budget.category);
        const percentage = budget.amount > 0
            ? (spent / budget.amount) * 100
            : 0;

        const safePercentage = Math.min(percentage, 100);

        return `
            <div class="budget-overview-item">
                <div class="budget-overview-top">
                    <strong>${escapeHTML(budget.category)}</strong>
                    <span>
                        ${formatCurrency(spent)} /
                        ${formatCurrency(budget.amount)}
                    </span>
                </div>

                <div class="progress-track">
                    <div class="progress-fill ${percentage > 100 ? "over-budget" : ""}"
                        style="width: ${safePercentage}%">
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ======================================
// 17. ANALYTICS CHARTS
// ======================================

let expenseChart = null;
let incomeExpenseChart = null;

function updateCharts() {
    if (typeof Chart === "undefined") {
        console.error("Chart.js was not loaded.");
        return;
    }

    // Expense totals by category.
    const categoryTotals = {};

    transactions.forEach(function (transaction) {
        if (transaction.type === "expense") {
            categoryTotals[transaction.category] =
                (categoryTotals[transaction.category] || 0) +
                Number(transaction.amount);
        }
    });

    const categories = Object.keys(categoryTotals);
    const categoryAmounts = Object.values(categoryTotals);

    const expenseCanvas =
        document.getElementById("expenseChart");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(expenseCanvas, {
        type: "doughnut",
        data: {
            labels: categories.length ? categories : ["No expenses"],
            datasets: [{
                data: categoryAmounts.length ? categoryAmounts : [1],
                backgroundColor: [
                    "#6257e8",
                    "#16a36a",
                    "#f3a64a",
                    "#e05260",
                    "#39a5c8",
                    "#9b59b6",
                    "#e67e22",
                    "#95a5a6"
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (!categoryAmounts.length) {
                                return "No expenses";
                            }

                            return context.label + ": " +
                                formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });

    // Income versus expenses.
    const totalIncome = getTotal("income");
    const totalExpenses = getTotal("expense");

    const incomeExpenseCanvas =
        document.getElementById("incomeExpenseChart");

    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }

    incomeExpenseChart = new Chart(incomeExpenseCanvas, {
        type: "bar",
        data: {
            labels: ["Income", "Expenses"],
            datasets: [{
                label: "Amount",
                data: [totalIncome, totalExpenses],
                backgroundColor: ["#16a36a", "#e05260"],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// ======================================
// 18. DARK MODE
// ======================================

const darkModeToggle =
    document.getElementById("darkModeToggle");

function applyDarkMode(enabled) {
    document.body.classList.toggle("dark-mode", enabled);
    darkModeToggle.checked = enabled;

    localStorage.setItem(
        "smartTrackDarkMode",
        String(enabled)
    );
}

const savedDarkMode =
    localStorage.getItem("smartTrackDarkMode") === "true";

applyDarkMode(savedDarkMode);

darkModeToggle.addEventListener("change", function () {
    applyDarkMode(darkModeToggle.checked);
});

// ======================================
// 19. CURRENCY SETTINGS
// ======================================

const currencySelect =
    document.getElementById("currencySelect");

const currencyStatus =
    document.getElementById("currencyStatus");

currencySelect.value = getSelectedCurrency();

currencySelect.addEventListener("change", async function () {
    const previousCurrency = getSelectedCurrency();
    const selectedCurrency = currencySelect.value;

    currencySelect.disabled = true;
    currencyStatus.textContent = "Getting the latest exchange rate...";

    const success = await loadExchangeRate(selectedCurrency);

    currencySelect.disabled = false;

    if (!success) {
        currencySelect.value = previousCurrency;
        currencyStatus.textContent =
            "Could not get the exchange rate. Please try again.";
        alert("Currency conversion failed. Your previous currency is unchanged.");
        return;
    }

    localStorage.setItem(
        "smartTrackCurrency",
        selectedCurrency
    );

    currencyStatus.textContent =
        "Display currency updated successfully.";

    // Refresh every screen that displays money.
    refreshApp();

    alert("Currency changed to " + selectedCurrency);
});

// ======================================
// 20. EXPORT DATA
// ======================================

function exportData() {
    const backup = {
        transactions: transactions,
        budgets: budgets,
        exportDate: new Date().toISOString()
    };

    const data = JSON.stringify(backup, null, 4);

    const blob = new Blob([data], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "smarttrack-backup.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ======================================
// 21. IMPORT DATA
// ======================================

const importButton =
    document.getElementById("importButton");

const importFile =
    document.getElementById("importFile");

importButton.addEventListener("click", function () {
    importFile.click();
});

importFile.addEventListener("change", function () {
    const file = importFile.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const backup = JSON.parse(event.target.result);

            if (
                !backup ||
                !Array.isArray(backup.transactions) ||
                !Array.isArray(backup.budgets)
            ) {
                throw new Error("Invalid backup format.");
            }

            const confirmed = confirm(
                "Importing will replace your current transactions and budgets. Continue?"
            );

            if (!confirmed) return;

            transactions = backup.transactions;
            budgets = backup.budgets;

            saveTransactions();
            saveBudgets();
            refreshApp();

            alert("Backup imported successfully!");

        } catch (error) {
            console.error(error);
            alert("Invalid backup file. Please select a valid SmartTrack JSON backup.");
        } finally {
            importFile.value = "";
        }
    };

    reader.readAsText(file);
});

// ======================================
// 22. RESET DATA
// ======================================

function resetData() {
    const confirmed = confirm(
        "This will permanently delete all transactions and budgets. Are you sure?"
    );

    if (!confirmed) return;

    transactions = [];
    budgets = [];

    saveTransactions();
    saveBudgets();
    refreshApp();

    alert("All SmartTrack data has been reset.");
}

// ======================================
// 23. HTML TEXT SAFETY
// ======================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}

// ======================================
// 24. REFRESH THE COMPLETE APP
// ======================================

function refreshApp() {
    updateDashboard();
    updateRecentTransactions();
    updateDashboardOverview();
    displayTransactions();
    displayBudgets();
    updateDashboardBudgetOverview();

    if (
        document.getElementById("analytics").classList.contains("active")
    ) {
        updateCharts();
    }
}

// ======================================
// 25. INITIAL PAGE LOAD
// ======================================

async function initializeApp() {
    document.getElementById("transactionDate").value =
        getTodayString();

    showPage("dashboard");

    const selectedCurrency = getSelectedCurrency();

    currencySelect.value = selectedCurrency;

    currencyStatus.textContent =
        "Loading exchange rate...";

    const success = await loadExchangeRate(selectedCurrency);

    if (!success) {
        currencyStatus.textContent =
            "Exchange rate unavailable. Showing amounts using the fallback rate.";
    } else {
        currencyStatus.textContent =
            "Currency rates loaded.";
    }

    refreshApp();
}

initializeApp();
