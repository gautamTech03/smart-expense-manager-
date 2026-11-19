// BASE CODE FOR PRACTICE 

// console.log("Hello Twin!");
// console.log("Welcome to SmartTrack Backend!");

// let amount = 500;

// console.log("Expense Amount: ₹" + amount);

//==================================================================================

// CALL STACK IN NODE.JS

// function first() {
//     console.log("First");
// }

// function second() {
//     console.log("Second");
// }

// first();
// second();

//==================================================================================

// OPERATING SYSTEM MODULE IN NODE.JS

// const os = require("os");

// console.log("Operating System:");
// console.log(os.platform());

// console.log("Free Memory:");
// console.log(os.freemem());

// console.log("Total Memory:");
// console.log(os.totalmem());

//==================================================================================

// SET-TIMEOUT AND SET-INTERVAL IN NODE.JS


// console.log("1. Start");

// setTimeout(function() {
//     console.log("2. Timer completed");
// }, 2000);

// console.log("3. End");

//==================================================================================

// FILE SYSTEM MODULE IN NODE.JS WITH ERROR HANDLING 


// const fs = require("fs");

// console.log("1. Starting application");

// fs.readFile("backend/expense.txt", "utf8", function(error, data) {

//     if (error) {
//         console.log("Error reading file:", error.message);
//         return;
//     }

//     console.log("3. File data:", data);

// });

// console.log("2. Reading file...");


//==================================================================================

// CREATION AND UPDATION OF FILES IN NODE.JS 


// const fs = require("fs");

// const expenseData = "Food: 500\nTravel: 200\nShopping: 1000";

// fs.writeFile("backend/new-expense.txt", expenseData, function(error) {

//     if (error) {
//         console.log("Error writing file:", error.message);
//         return;
//     }

//     console.log("Expense data saved successfully!");

// });


// ==================================================================================


// CREATIO OF A SIMPLE SERVER IN NODE.JS

// const http = require("http");

// // 1. Create a server
// const server = http.createServer(function(req, res) {

//     // 2. Send response
//     res.write("This is my first server!");

//     // 3. Finish the response
//     res.end();

// });

// // 4. Start the server
// server.listen(3000, function() {

//     console.log("Server is running on port 3000");

// });


//==================================================================================


// CREATION OF ROUTER'S

const http = require("http");

const server = http.createServer(function(req, res) {

    // Home route
    if (req.url === "/") {

        res.write("Welcome to SmartTrack!");
        res.end();

    }

    // About route
    else if (req.url === "/about") {

        res.write("SmartTrack is an expense management application.");
        res.end();

    }

    // Expenses route
    else if (req.url === "/expenses") {

        res.write("Your expenses will appear here.");
        res.end();

    }

    // contact's route
     else if (req.url === "/contact") {

        res.write("Contact us at contact@smarttrack.com");
        res.end();

    }


    // Unknown route
    else {

        res.write("404 - Page Not Found");
        res.end();

    }

});

server.listen(3000, function() {

    console.log("SmartTrack server running on port 3000");

});
