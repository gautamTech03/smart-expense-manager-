
// ======================================
// 1. LOAD SAVED TRANSACTIONS
// ======================================

const savedTransactions = localStorage.getItem("transactions");

let transactions;

if (savedTransactions) {
    try {
        transactions = JSON.parse(savedTransactions);

        if (!Array.isArray(transactions)) {
            throw new Error("Invalid transaction data");
        }

    } catch (error) {
        console.error("Could not load transactions:", error);
        transactions = [];
    }

} else {

    transactions = [
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
    ];
}


// ======================================
// 2. LOAD SAVED BUDGETS
// ======================================

let budgets = [];

const savedBudgets = localStorage.getItem("budgets");

if (savedBudgets) {
    try {
        budgets = JSON.parse(savedBudgets);

        if (!Array.isArray(budgets)) {
            throw new Error("Invalid budget data");
        }

    } catch (error) {
        console.error("Could not load budgets:", error);
        budgets = [];
    }
}


// ======================================
// 3. SELECT HTML ELEMENTS
// ======================================

// Dashboard elements
const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");

// Transaction elements
const transactionList = document.getElementById("transactionList");
const transactionForm = document.getElementById("transactionForm");
const showFormBtn = document.getElementById("showFormBtn");

// Search and filter elements
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");

// Chart elements
const expenseChartCanvas = document.getElementById("expenseChart");
const incomeExpenseCanvas = document.getElementById("incomeExpenseChart");

// Budget elements
const budgetForm = document.getElementById("budgetForm");
const budgetCategory = document.getElementById("budgetCategory");
const budgetAmount = document.getElementById("budgetAmount");
const budgetList = document.getElementById("budgetList");

// Chart instances
let expenseChart = null;
let incomeExpenseChart = null;


// ======================================
// 4. SAVE TRANSACTIONS
// ======================================

function saveTransactions() {

    try {
        localStorage.setItem(
            "transactions",
            JSON.stringify(transactions)
        );

        console.log("Transactions saved successfully!");

    } catch (error) {
        console.error("Error saving transactions:", error);
        alert("Unable to save transactions.");
    }
}


// Save initial transactions on first visit
if (savedTransactions === null) {
    saveTransactions();
}


// ======================================
// 5. SAVE BUDGETS
// ======================================

function saveBudgets() {

    try {
        localStorage.setItem(
            "budgets",
            JSON.stringify(budgets)
        );

        console.log("Budgets saved successfully!");

    } catch (error) {
        console.error("Error saving budgets:", error);
        alert("Unable to save budgets.");
    }
}


// ======================================
// 6. SHOW OR HIDE FORM
// ======================================

showFormBtn.addEventListener("click", function () {

    transactionForm.hidden = !transactionForm.hidden;

});


// ======================================
// 7. UPDATE DASHBOARD
// ======================================

function updateDashboard() {

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function (transaction) {

        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        }

        else if (transaction.type === "expense") {
            totalExpenses += transaction.amount;
        }

    });

    const balance = totalIncome - totalExpenses;

    balanceElement.innerText =
        "₹" + balance.toLocaleString("en-IN");

    incomeElement.innerText =
        "₹" + totalIncome.toLocaleString("en-IN");

    expensesElement.innerText =
        "₹" + totalExpenses.toLocaleString("en-IN");

}


// ======================================
// 8. UPDATE ANALYTICS CHARTS
// ======================================

function updateCharts() {

    const categoryTotals = {};

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function (transaction) {

        if (transaction.type === "expense") {

            if (categoryTotals[transaction.category]) {

                categoryTotals[transaction.category] +=
                    transaction.amount;

            } else {

                categoryTotals[transaction.category] =
                    transaction.amount;

            }

            totalExpenses += transaction.amount;

        }

        else if (transaction.type === "income") {

            totalIncome += transaction.amount;

        }

    });


    // Prepare expense chart data
    const categories = Object.keys(categoryTotals);
    const categoryAmounts = Object.values(categoryTotals);


    // Expense doughnut chart
    if (expenseChart === null) {

        expenseChart = new Chart(expenseChartCanvas, {

            type: "doughnut",

            data: {
                labels: categories,

                datasets: [{
                    label: "Expenses",
                    data: categoryAmounts
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false
            }

        });

    } else {

        expenseChart.data.labels = categories;

        expenseChart.data.datasets[0].data =
            categoryAmounts;

        expenseChart.update();

    }


    // Income vs Expenses bar chart
    if (incomeExpenseChart === null) {

        incomeExpenseChart = new Chart(incomeExpenseCanvas, {

            type: "bar",

            data: {
                labels: ["Income", "Expenses"],

                datasets: [{
                    label: "Amount (₹)",
                    data: [totalIncome, totalExpenses]
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true
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
// 9. DISPLAY, SEARCH AND FILTER
// ======================================

function displayTransactions() {

    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;


    // Filter transactions
    const filteredTransactions = transactions.filter(function (transaction) {

        const matchesSearch =
            transaction.name.toLowerCase().includes(searchText);

        const matchesType =
            selectedType === "all" ||
            transaction.type === selectedType;

        const matchesCategory =
            selectedCategory === "all" ||
            transaction.category === selectedCategory;

        return matchesSearch && matchesType && matchesCategory;

    });


    // Clear previous list
    transactionList.replaceChildren();


    // No matching transactions
    if (filteredTransactions.length === 0) {

        transactionList.textContent =
            "No matching transactions found.";

        return;

    }


    // Display transactions
    filteredTransactions.forEach(function (transaction) {

        const row = document.createElement("div");
        row.className = "transaction";


        // Transaction details
        const details = document.createElement("div");
        details.className = "transaction-details";

        const name = document.createElement("strong");
        name.textContent = transaction.name;

        const date = document.createElement("small");

        date.textContent =
            transaction.date + " | " + transaction.category;

        details.appendChild(name);
        details.appendChild(date);


        // Transaction amount
        const amount = document.createElement("span");

        if (transaction.type === "income") {

            amount.textContent =
                "+₹" + transaction.amount.toLocaleString("en-IN");

            amount.className = "income-amount";

        } else {

            amount.textContent =
                "-₹" + transaction.amount.toLocaleString("en-IN");

            amount.className = "expense-amount";

        }


        // Edit button
        const editButton = document.createElement("button");

        editButton.textContent = "Edit";
        editButton.className = "edit-btn";
        editButton.type = "button";

        editButton.addEventListener("click", function () {
            editTransaction(transaction.id);
        });


        // Delete button
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });


        row.appendChild(details);
        row.appendChild(amount);
        row.appendChild(editButton);
        row.appendChild(deleteButton);

        transactionList.appendChild(row);

    });

}


// ======================================
// 10. DISPLAY MONTHLY BUDGETS
// ======================================

function displayBudgets() {

    budgetList.replaceChildren();


    // Get current month in YYYY-MM format
    const today = new Date();

    const currentMonth =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0");


    // Display each budget
    budgets.forEach(function (budget) {

        let spent = 0;


        // Calculate current month's category expenses
        transactions.forEach(function (transaction) {

            if (
                transaction.type === "expense" &&
                transaction.category.toLowerCase() ===
                    budget.category.toLowerCase() &&
                transaction.date.startsWith(currentMonth)
            ) {

                spent += transaction.amount;

            }

        });


        // Calculate progress
        const percentage =
            (spent / budget.amount) * 100;

        const progress =
            Math.min(percentage, 100);

        const remaining =
            budget.amount - spent;


        // Create budget card
        const card = document.createElement("div");
        card.className = "budget-card";


        // Category heading
        const heading = document.createElement("h3");
        heading.textContent = budget.category;


        // Spending details
        const details = document.createElement("p");

        details.textContent =
            "Spent: ₹" + spent.toLocaleString("en-IN") +
            " / ₹" + budget.amount.toLocaleString("en-IN");


        // Progress background
        const progressContainer =
            document.createElement("div");

        progressContainer.className = "budget-progress";


        // Progress bar
        const progressBar = document.createElement("div");

        progressBar.className = "budget-progress-fill";

        progressBar.style.width = progress + "%";


        if (percentage > 100) {

            progressBar.style.background = "#dc2626";

        }


        progressContainer.appendChild(progressBar);


        // Remaining budget message
        const remainingText = document.createElement("p");

        if (remaining < 0) {

            remainingText.textContent =
                "Over budget by ₹" +
                Math.abs(remaining).toLocaleString("en-IN");

            remainingText.className = "budget-warning";

        } else {

            remainingText.textContent =
                "Remaining: ₹" +
                remaining.toLocaleString("en-IN");

        }


        // Add everything to card
        card.appendChild(heading);
        card.appendChild(details);
        card.appendChild(progressContainer);
        card.appendChild(remainingText);

        budgetList.appendChild(card);

    });


    // Show message if there are no budgets
    if (budgets.length === 0) {

        budgetList.textContent =
            "No budgets added yet. Set your first monthly budget!";

    }

}


// ======================================
// 11. ADD OR UPDATE MONTHLY BUDGET
// ======================================

budgetForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const category = budgetCategory.value.trim();

    const amount = Number(budgetAmount.value);


    // Validate budget
    if (
        category === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert("Please enter a valid category and budget.");
        return;

    }


    // Check for existing category budget
    const existingBudget = budgets.find(function (budget) {

        return budget.category.toLowerCase() ===
            category.toLowerCase();

    });


    if (existingBudget) {

        // Update existing budget
        existingBudget.amount = amount;

    } else {

        // Create new budget
        budgets.push({
            category: category,
            amount: amount
        });

    }


    saveBudgets();

    displayBudgets();

    budgetForm.reset();

    alert("Budget saved successfully!");

});


// ======================================
// 12. SEARCH AND FILTER EVENTS
// ======================================

searchInput.addEventListener("input", function () {
    displayTransactions();
});

typeFilter.addEventListener("change", function () {
    displayTransactions();
});

categoryFilter.addEventListener("change", function () {
    displayTransactions();
});


// ======================================
// 13. DATE VALIDATION
// ======================================

function isValidDate(dateString) {

    const parts = dateString.split("-");

    if (parts.length !== 3 || parts[0].length !== 4) {
        return false;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );

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


    // Validate input
    if (
        name === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !isValidDate(date)
    ) {

        alert("Please enter valid transaction details.");
        return;

    }


    // Create transaction
    const newTransaction = {

        id: Date.now(),
        name: name,
        amount: amount,
        type: type,
        category: category,
        date: date

    };


    // Add transaction
    transactions.push(newTransaction);

    saveTransactions();


    // Reset form and filters
    transactionForm.reset();

    searchInput.value = "";
    typeFilter.value = "all";
    categoryFilter.value = "all";

    transactionForm.hidden = true;


    // Refresh all sections
    updateDashboard();
    displayTransactions();
    updateCharts();
    displayBudgets();

    alert("Transaction added successfully!");

});


// ======================================
// 15. EDIT TRANSACTION
// ======================================

function editTransaction(id) {

    const transaction = transactions.find(function (item) {
        return item.id === id;
    });

    if (!transaction) {
        return;
    }


    const newName = prompt(
        "Enter new transaction name:",
        transaction.name
    );

    if (newName === null) return;


    const newAmount = prompt(
        "Enter new amount:",
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


    // Validate details
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


    // Update transaction
    transaction.name = newName.trim();
    transaction.amount = amount;
    transaction.type = type;
    transaction.category = newCategory.trim();
    transaction.date = newDate.trim();


    saveTransactions();


    // Refresh all sections
    updateDashboard();
    displayTransactions();
    updateCharts();
    displayBudgets();

    alert("Transaction updated successfully!");

}


// ======================================
// 16. DELETE TRANSACTION
// ======================================

function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
        return;
    }


    transactions = transactions.filter(function (transaction) {
        return transaction.id !== id;
    });


    saveTransactions();


    // Refresh all sections
    updateDashboard();
    displayTransactions();
    updateCharts();
    displayBudgets();

    alert("Transaction deleted successfully!");

}


// ======================================
// 17. LOAD DASHBOARD
// ======================================

updateDashboard();
displayTransactions();
updateCharts();
displayBudgets();
