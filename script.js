
// ======================================
// 1. LOAD SAVED DATA
// ======================================

function loadArrayFromStorage(key, fallback) {
    const saved = localStorage.getItem(key);

    if (saved === null) return fallback;

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        console.error("Could not load " + key + ":", error);
        return fallback;
    }
}

let transactions = loadArrayFromStorage("transactions", [
    { id: 1, name: "Salary", amount: 20000, type: "income", category: "Salary", date: "2026-11-18" },
    { id: 2, name: "Food", amount: 500, type: "expense", category: "Food", date: "2026-11-18" },
    { id: 3, name: "Travel", amount: 300, type: "expense", category: "Travel", date: "2026-11-18" },
    { id: 4, name: "Shopping", amount: 700, type: "expense", category: "Shopping", date: "2026-11-18" }
]);

let budgets = loadArrayFromStorage("budgets", []);

if (localStorage.getItem("transactions") === null) {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}


// ======================================
// 2. SELECT HTML ELEMENTS
// ======================================

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");

const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");
const showFormBtn = document.getElementById("showFormBtn");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");

const expenseChartCanvas = document.getElementById("expenseChart");
const incomeExpenseCanvas = document.getElementById("incomeExpenseChart");

const budgetForm = document.getElementById("budgetForm");
const budgetCategory = document.getElementById("budgetCategory");
const budgetAmount = document.getElementById("budgetAmount");
const budgetList = document.getElementById("budgetList");

const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page-section");

// Dashboard elements
const dashboardRecentTransactions =
    document.getElementById("dashboardRecentTransactions");

const topExpenseCategory =
    document.getElementById("topExpenseCategory");

const dashboardExpenseTotal =
    document.getElementById("dashboardExpenseTotal");

const dashboardInsightMessage =
    document.getElementById("dashboardInsightMessage");

const dashboardBudgetOverview =
    document.getElementById("dashboardBudgetOverview");

let expenseChart = null;
let incomeExpenseChart = null;


// ======================================
// 3. SAVE DATA
// ======================================

function saveTransactions() {
    try {
        localStorage.setItem(
            "transactions",
            JSON.stringify(transactions)
        );
    } catch (error) {
        console.error("Could not save transactions:", error);
        alert("Unable to save transactions.");
    }
}

function saveBudgets() {
    try {
        localStorage.setItem(
            "budgets",
            JSON.stringify(budgets)
        );
    } catch (error) {
        console.error("Could not save budgets:", error);
        alert("Unable to save budgets.");
    }
}


// ======================================
// 4. PAGE NAVIGATION
// ======================================

function showPage(pageName) {

    pages.forEach(function (page) {
        page.classList.toggle("active", page.id === pageName);
    });

    navLinks.forEach(function (link) {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

    if (pageName === "analytics") {
        requestAnimationFrame(function () {
            if (expenseChart) expenseChart.resize();
            if (incomeExpenseChart) incomeExpenseChart.resize();
        });
    }
}


// Sidebar navigation
navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        showPage(link.dataset.page);
    });
});


// Dashboard quick action buttons
const dashboardButtons =
    document.querySelectorAll("[data-go-page]");

dashboardButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        showPage(button.dataset.goPage);
    });
});


// Dashboard Add Transaction button
showFormBtn.addEventListener("click", function () {
    showPage("transactions");

    document.getElementById("transactionName").focus();
});


// ======================================
// 5. UPDATE DASHBOARD SUMMARY
// ======================================

function updateDashboard() {

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function (transaction) {

        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "income") {
            totalIncome += amount;
        }

        else if (transaction.type === "expense") {
            totalExpenses += amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    balanceElement.textContent =
        "₹" + balance.toLocaleString("en-IN");

    incomeElement.textContent =
        "₹" + totalIncome.toLocaleString("en-IN");

    expensesElement.textContent =
        "₹" + totalExpenses.toLocaleString("en-IN");
}


// ======================================
// 6. UPDATE ANALYTICS CHARTS
// ======================================

function updateCharts() {

    if (typeof Chart === "undefined") {
        console.error("Chart.js did not load. Check your internet connection.");
        return;
    }

    const categoryTotals = {};

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function (transaction) {

        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "expense") {

            const category = transaction.category || "Other";

            categoryTotals[category] =
                (categoryTotals[category] || 0) + amount;

            totalExpenses += amount;
        }

        else if (transaction.type === "income") {
            totalIncome += amount;
        }
    });

    const categories = Object.keys(categoryTotals);
    const categoryAmounts = Object.values(categoryTotals);


    // EXPENSE DOUGHNUT CHART

    if (!expenseChart) {

        expenseChart = new Chart(expenseChartCanvas, {
            type: "doughnut",

            data: {
                labels: categories,

                datasets: [{
                    label: "Expenses",
                    data: categoryAmounts,
                    backgroundColor: [
                        "#3b9ddd",
                        "#f45b83",
                        "#ff9848",
                        "#8b78d6",
                        "#36a77b",
                        "#e0b34b"
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    } else {

        expenseChart.data.labels = categories;
        expenseChart.data.datasets[0].data = categoryAmounts;
        expenseChart.update();
    }


    // INCOME VS EXPENSES BAR CHART

    if (!incomeExpenseChart) {

        incomeExpenseChart = new Chart(incomeExpenseCanvas, {
            type: "bar",

            data: {
                labels: ["Income", "Expenses"],

                datasets: [{
                    label: "Amount (₹)",
                    data: [totalIncome, totalExpenses],
                    backgroundColor: ["#8ec5e8", "#f28b82"],
                    borderRadius: 5,
                    maxBarThickness: 90
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,

                scales: {
                    y: {
                        beginAtZero: true,
                        grace: "5%"
                    }
                }
            }
        });

    } else {

        incomeExpenseChart.data.datasets[0].data = [
            totalIncome,
            totalExpenses
        ];

        incomeExpenseChart.update();
    }
}


// ======================================
// 7. DISPLAY TRANSACTIONS
// ======================================

function displayTransactions() {

    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;

    const filteredTransactions = transactions

        .filter(function (transaction) {

            const matchesSearch =
                String(transaction.name)
                    .toLowerCase()
                    .includes(searchText);

            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            const matchesCategory =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            return matchesSearch &&
                matchesType &&
                matchesCategory;
        })

        .sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) ||
                Number(b.id) - Number(a.id);
        });


    transactionList.replaceChildren();

    if (filteredTransactions.length === 0) {

        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No matching transactions found.";

        transactionList.appendChild(message);
        return;
    }


    filteredTransactions.forEach(function (transaction) {

        const row = document.createElement("div");
        row.className = "transaction";

        const details = document.createElement("div");
        details.className = "transaction-details";

        const name = document.createElement("strong");
        name.textContent = transaction.name;

        const date = document.createElement("small");
        date.textContent =
            transaction.date + " | " + transaction.category;

        details.append(name, date);


        const amount = document.createElement("span");
        const numericAmount = Number(transaction.amount) || 0;

        if (transaction.type === "income") {

            amount.textContent =
                "+₹" + numericAmount.toLocaleString("en-IN");

            amount.className = "income-amount";

        } else {

            amount.textContent =
                "-₹" + numericAmount.toLocaleString("en-IN");

            amount.className = "expense-amount";
        }


        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";

        editButton.addEventListener("click", function () {
            editTransaction(transaction.id);
        });


        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });


        row.append(
            details,
            amount,
            editButton,
            deleteButton
        );

        transactionList.appendChild(row);
    });
}


// Search and filter events
searchInput.addEventListener("input", displayTransactions);
typeFilter.addEventListener("change", displayTransactions);
categoryFilter.addEventListener("change", displayTransactions);


// ======================================
// 8. DATE VALIDATION
// ======================================

function isValidDate(dateString) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const parts = dateString.split("-").map(Number);

    const date = new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );

    return (
        date.getFullYear() === parts[0] &&
        date.getMonth() === parts[1] - 1 &&
        date.getDate() === parts[2]
    );
}


function getTodayString() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


function getCurrentMonthString() {

    const today = new Date();

    return (
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0")
    );
}


// ======================================
// 9. DASHBOARD RECENT TRANSACTIONS
// ======================================

function updateRecentTransactions() {

    dashboardRecentTransactions.replaceChildren();

    const recentTransactions = [...transactions]

        .sort(function (a, b) {
            return new Date(b.date) - new Date(a.date) ||
                Number(b.id) - Number(a.id);
        })

        .slice(0, 5);


    if (recentTransactions.length === 0) {

        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No transactions yet. Add your first transaction!";

        dashboardRecentTransactions.appendChild(message);
        return;
    }


    recentTransactions.forEach(function (transaction) {

        const row = document.createElement("div");
        row.className = "dashboard-transaction";

        const info = document.createElement("div");
        info.className = "dashboard-transaction-info";

        const name = document.createElement("strong");
        name.textContent = transaction.name;

        const date = document.createElement("small");
        date.textContent =
            transaction.date + " · " + transaction.category;

        info.append(name, date);


        const amount = document.createElement("span");
        const value = Number(transaction.amount) || 0;

        amount.textContent =
            (transaction.type === "income" ? "+" : "-") +
            "₹" + value.toLocaleString("en-IN");

        amount.className = "dashboard-transaction-amount";

        amount.style.color =
            transaction.type === "income" ? "#15945a" : "#dc4545";


        row.append(info, amount);

        dashboardRecentTransactions.appendChild(row);
    });
}


// ======================================
// 10. DASHBOARD SPENDING INSIGHTS
// ======================================

function updateSpendingInsight() {

    const categoryTotals = {};

    let totalExpenses = 0;

    transactions.forEach(function (transaction) {

        if (transaction.type === "expense") {

            const amount = Number(transaction.amount) || 0;
            const category = transaction.category || "Other";

            categoryTotals[category] =
                (categoryTotals[category] || 0) + amount;

            totalExpenses += amount;
        }
    });


    const topCategory = Object.entries(categoryTotals)

        .sort(function (a, b) {
            return b[1] - a[1];
        })[0];


    dashboardExpenseTotal.textContent =
        "₹" + totalExpenses.toLocaleString("en-IN");


    topExpenseCategory.textContent =
        topCategory ? topCategory[0] : "No expenses yet";


    if (topCategory) {

        dashboardInsightMessage.textContent =
            "Your highest spending is in " +
            topCategory[0] +
            " (₹" +
            topCategory[1].toLocaleString("en-IN") +
            ").";

    } else {

        dashboardInsightMessage.textContent =
            "Add an expense to start seeing your spending insights.";
    }
}


// ======================================
// 11. DASHBOARD BUDGET OVERVIEW
// ======================================

function updateDashboardBudgets() {

    dashboardBudgetOverview.replaceChildren();

    if (budgets.length === 0) {

        const message = document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "No budgets created yet. Set your first monthly budget!";

        dashboardBudgetOverview.appendChild(message);
        return;
    }


    const currentMonth = getCurrentMonthString();


    budgets.slice(0, 4).forEach(function (budget) {

        let spent = 0;

        transactions.forEach(function (transaction) {

            if (
                transaction.type === "expense" &&
                String(transaction.category).toLowerCase() ===
                    budget.category.toLowerCase() &&
                transaction.date.startsWith(currentMonth)
            ) {

                spent += Number(transaction.amount) || 0;
            }
        });


        const limit = Number(budget.amount);

        const percentage =
            limit > 0 ? (spent / limit) * 100 : 0;

        const progress = Math.min(percentage, 100);

        const remaining = limit - spent;


        const item = document.createElement("div");
        item.className = "dashboard-budget-item";


        const heading = document.createElement("div");
        heading.className = "dashboard-budget-heading";

        const category = document.createElement("strong");
        category.textContent = budget.category;

        const amount = document.createElement("span");

        amount.textContent =
            "₹" + spent.toLocaleString("en-IN") +
            " / ₹" + limit.toLocaleString("en-IN");

        heading.append(category, amount);


        const progressContainer = document.createElement("div");
        progressContainer.className = "dashboard-budget-progress";

        const progressBar = document.createElement("div");
        progressBar.className = "dashboard-budget-fill";
        progressBar.style.width = progress + "%";

        if (percentage >= 100) {
            progressBar.style.background = "#dc2626";
        } else if (percentage >= 80) {
            progressBar.style.background = "#f59e0b";
        }

        progressContainer.appendChild(progressBar);


        const remainingText = document.createElement("p");
        remainingText.className = "dashboard-budget-remaining";

        remainingText.textContent = remaining < 0
            ? "Over budget by ₹" +
                Math.abs(remaining).toLocaleString("en-IN")
            : "Remaining: ₹" +
                remaining.toLocaleString("en-IN");


        item.append(
            heading,
            progressContainer,
            remainingText
        );

        dashboardBudgetOverview.appendChild(item);
    });
}


// ======================================
// 12. UPDATE COMPLETE DASHBOARD
// ======================================

function updateDashboardOverview() {

    updateRecentTransactions();

    updateSpendingInsight();

    updateDashboardBudgets();
}


// ======================================
// 13. REFRESH ALL DATA VIEWS
// ======================================

function refreshApp() {

    updateDashboard();

    displayTransactions();

    updateCharts();

    displayBudgets();

    updateDashboardOverview();
}


// ======================================
// 14. ADD NEW TRANSACTION
// ======================================

transactionForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name =
        document.getElementById("transactionName").value.trim();

    const amount =
        Number(document.getElementById("transactionAmount").value);

    const type =
        document.getElementById("transactionType").value;

    const category =
        document.getElementById("transactionCategory").value;

    const date =
        document.getElementById("transactionDate").value;


    if (
        !name ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !isValidDate(date)
    ) {

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


    transactionForm.reset();

    document.getElementById("transactionDate").value =
        getTodayString();


    searchInput.value = "";
    typeFilter.value = "all";
    categoryFilter.value = "all";


    refreshApp();

    alert("Transaction added successfully!");
});


// ======================================
// 15. EDIT TRANSACTION
// ======================================

function editTransaction(id) {

    const transaction = transactions.find(function (item) {
        return item.id === id;
    });

    if (!transaction) return;


    const newName = prompt(
        "Enter transaction name:",
        transaction.name
    );

    if (newName === null) return;


    const newAmount = prompt(
        "Enter amount:",
        transaction.amount
    );

    if (newAmount === null) return;


    const newType = prompt(
        "Enter type (income/expense):",
        transaction.type
    );

    if (newType === null) return;


    const newCategory = prompt(
        "Enter category:",
        transaction.category
    );

    if (newCategory === null) return;


    const newDate = prompt(
        "Enter date (YYYY-MM-DD):",
        transaction.date
    );

    if (newDate === null) return;


    const amount = Number(newAmount);
    const type = newType.trim().toLowerCase();


    if (
        newName.trim() === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !["income", "expense"].includes(type) ||
        newCategory.trim() === "" ||
        !isValidDate(newDate.trim())
    ) {

        alert("Please enter valid transaction details.");
        return;
    }


    transaction.name = newName.trim();
    transaction.amount = amount;
    transaction.type = type;
    transaction.category = newCategory.trim();
    transaction.date = newDate.trim();


    saveTransactions();

    refreshApp();

    alert("Transaction updated successfully!");
}


// ======================================
// 16. DELETE TRANSACTION
// ======================================

function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;


    transactions = transactions.filter(function (transaction) {
        return transaction.id !== id;
    });


    saveTransactions();

    refreshApp();

    alert("Transaction deleted successfully!");
}


// ======================================
// 17. DISPLAY MONTHLY BUDGETS
// ======================================

function displayBudgets() {

    budgetList.replaceChildren();

    if (budgets.length === 0) {

        const message = document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "No budgets added yet. Set your first monthly budget!";

        budgetList.appendChild(message);
        return;
    }


    const currentMonth = getCurrentMonthString();


    budgets.forEach(function (budget) {

        let spent = 0;

        transactions.forEach(function (transaction) {

            if (
                transaction.type === "expense" &&
                String(transaction.category).toLowerCase() ===
                    budget.category.toLowerCase() &&
                transaction.date.startsWith(currentMonth)
            ) {

                spent += Number(transaction.amount) || 0;
            }
        });


        const limit = Number(budget.amount);

        const percentage =
            limit > 0 ? (spent / limit) * 100 : 0;

        const progress = Math.min(percentage, 100);

        const remaining = limit - spent;


        const card = document.createElement("article");
        card.className = "budget-card";


        const heading = document.createElement("h3");
        heading.textContent = budget.category;


        const details = document.createElement("p");
        details.className = "budget-details";

        details.textContent =
            "Spent: ₹" +
            spent.toLocaleString("en-IN") +
            " / ₹" +
            limit.toLocaleString("en-IN");


        const progressContainer = document.createElement("div");
        progressContainer.className = "budget-progress";

        const progressBar = document.createElement("div");
        progressBar.className = "budget-progress-fill";

        progressBar.style.width = progress + "%";

        if (percentage >= 100) {
            progressBar.style.background = "#dc2626";
        } else if (percentage >= 80) {
            progressBar.style.background = "#f59e0b";
        }

        progressContainer.appendChild(progressBar);


        const remainingText = document.createElement("p");

        if (remaining < 0) {

            remainingText.className = "budget-warning";

            remainingText.textContent =
                "Over budget by ₹" +
                Math.abs(remaining).toLocaleString("en-IN");

        } else {

            remainingText.className = "budget-remaining";

            remainingText.textContent =
                "Remaining: ₹" +
                remaining.toLocaleString("en-IN");
        }


        const percentText = document.createElement("p");
        percentText.className = "budget-details";

        percentText.textContent =
            percentage.toFixed(1) + "% used";


        card.append(
            heading,
            details,
            progressContainer,
            remainingText,
            percentText
        );

        budgetList.appendChild(card);
    });
}


// ======================================
// 18. ADD OR UPDATE MONTHLY BUDGET
// ======================================

budgetForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const category = budgetCategory.value.trim();
    const amount = Number(budgetAmount.value);


    if (
        !category ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert("Please enter a valid category and budget amount.");
        return;
    }


    const existingBudget = budgets.find(function (budget) {

        return budget.category.toLowerCase() ===
            category.toLowerCase();
    });


    if (existingBudget) {

        existingBudget.amount = amount;

    } else {

        budgets.push({
            category: category,
            amount: amount
        });
    }


    saveBudgets();

    budgetForm.reset();

    // Update both Budget page and Dashboard preview
    refreshApp();

    alert("Budget saved successfully!");
});


// ======================================
// 19. INITIAL PAGE LOAD
// ======================================

// Set today's date in transaction form
document.getElementById("transactionDate").value =
    getTodayString();

// Load all application data
refreshApp();

// Open Dashboard first
showPage("dashboard");
