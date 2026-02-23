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
  
  let totalIncome = 0;
  let totalExpenses = 0;
  const monthlyData = {};

  const transactions = data.map((row, index) => {
    const timestamp = row[0];
    const type = row[1];
    const amount = Number(row[2]);
    const description = row[3];
    
    // Global totals
    if (type === "Income") {
      totalIncome += amount;
    } else if (type === "Expense") {
      totalExpenses += amount;
    }

    // Monthly totals
    let dateObj = timestamp;
    if (!(dateObj instanceof Date) && timestamp) {
      dateObj = new Date(timestamp);
    }

    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
      const yearMonth = Utilities.formatDate(dateObj, ss.getSpreadsheetTimeZone(), "yyyy-MM");
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = { income: 0, expense: 0 };
      }
      if (type === "Income") {
        monthlyData[yearMonth].income += amount;
      } else if (type === "Expense") {
        monthlyData[yearMonth].expense += amount;
      }
    }

    return {
      id: index + 2, // Row number in the sheet
      timestamp: timestamp,
      type: type,
      amount: amount,
      description: description
    };
  }).reverse(); // Most recent first

  const response = {
    balance: totalIncome - totalExpenses,
    totalIncome: totalIncome,
    totalExpenses: totalExpenses,
    history: transactions.slice(0, 100), // Return last 100 transactions
    monthlyBreakdown: monthlyData
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
    
    if (postData.action === 'update') {
      const rowIndex = postData.id;
      if (rowIndex) {
        sheet.getRange(rowIndex, 2).setValue(postData.type);
        sheet.getRange(rowIndex, 3).setValue(postData.amount);
        sheet.getRange(rowIndex, 4).setValue(postData.description);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaction updated" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else if (postData.action === 'delete') {
      const rowIndex = postData.id;
      if (rowIndex) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaction deleted" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      // Default: Add new transaction
      sheet.appendRow([
        new Date(),
        postData.type,
        postData.amount,
        postData.description
      ]);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaction saved" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

