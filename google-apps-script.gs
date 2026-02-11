/**
 * Google Apps Script for "I-CAN-SAVE"
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Rename the first sheet to "Transactions".
 * 3. Go to Extensions > Apps Script.
 * 4. Paste this code.
 * 5. Click "Deploy" > "New Deployment".
 * 6. Select "Web App".
 * 7. Set "Execute as" to "Me".
 * 8. Set "Who has access" to "Anyone".
 * 9. Copy the Web App URL and paste it into your app.js.
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions") || ss.insertSheet("Transactions");
  
  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Type", "Amount", "Description"]);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const transactions = data.map(row => {
    return {
      timestamp: row[0],
      type: row[1],
      amount: row[2],
      description: row[3]
    };
  }).reverse(); // Most recent first

  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(t => {
    if (t.type === "Income") {
      totalIncome += Number(t.amount);
    } else if (t.type === "Expense") {
      totalExpenses += Number(t.amount);
    }
  });

  const response = {
    balance: totalIncome - totalExpenses,
    totalIncome: totalIncome,
    totalExpenses: totalExpenses,
    history: transactions.slice(0, 50) // Return last 50 transactions
  };

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Transactions") || ss.insertSheet("Transactions");
    
    // Ensure headers exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Type", "Amount", "Description"]);
    }

    const postData = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),
      postData.type,
      postData.amount,
      postData.description
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaction saved" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
