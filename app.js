/**
 * I-CAN-SAVE App Logic
 */

// REPLACE THIS with your deployed Google Apps Script Web App URL
const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// Elements
const balanceDisp = document.getElementById('balanceDisp');
const incomeDisp = document.getElementById('incomeDisp');
const expenseDisp = document.getElementById('expenseDisp');
const historyList = document.getElementById('historyList');
const incomeForm = document.getElementById('incomeForm');
const expenseForm = document.getElementById('expenseForm');

// State
let appData = {
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    history: []
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if script URL is set
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
        historyList.innerHTML = `<div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400 text-sm">
            Please set your <b>SCRIPT_URL</b> in <code>app.js</code> to connect to Google Sheets.
        </div>`;
    } else {
        fetchData();
    }
});

// Modal Control
function toggleModal(id) {
    const modal = document.getElementById(id);
    modal.classList.toggle('hidden');
    // Clear inputs if opening
    if (!modal.classList.contains('hidden')) {
        modal.querySelector('input[name="amount"]').value = '';
        if (id === 'expenseModal') {
            modal.querySelector('input[name="description"]').value = '';
        }
    }
}

// Fetch Data
async function fetchData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        appData = data;
        updateUI();
    } catch (error) {
        console.error("Error fetching data:", error);
        // Show silent error toast or message
    }
}

// Update UI
function updateUI() {
    // Update Stats
    balanceDisp.innerText = formatCurrency(appData.balance);
    incomeDisp.innerText = `+${formatCurrency(appData.totalIncome)}`;
    expenseDisp.innerText = `-${formatCurrency(appData.totalExpenses)}`;

    // Update History
    historyList.innerHTML = '';

    if (appData.history.length === 0) {
        historyList.innerHTML = '<p class="text-slate-500 text-center py-8">No transactions yet.</p>';
        return;
    }

    appData.history.forEach((t, index) => {
        const date = new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const isIncome = t.type === 'Income';

        const item = document.createElement('div');
        item.className = 'history-item glass rounded-2xl p-4 flex justify-between items-center';
        item.style.animationDelay = `${index * 50}ms`;

        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full ${isIncome ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} flex items-center justify-center">
                    ${isIncome ?
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg>'
            }
                </div>
                <div>
                    <h4 class="font-medium text-slate-200">${t.description}</h4>
                    <p class="text-xs text-slate-500">${date}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold ${isIncome ? 'text-green-400' : 'text-slate-200'}">${isIncome ? '+' : '-'}${formatCurrency(t.amount)}</p>
            </div>
        `;
        historyList.appendChild(item);
    });
}

// Form Submissions
incomeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(incomeForm);
    const data = {
        type: 'Income',
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description')
    };

    await submitTransaction(data, 'incomeModal');
});

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(expenseForm);
    const data = {
        type: 'Expense',
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description')
    };

    await submitTransaction(data, 'expenseModal');
});

async function submitTransaction(data, modalId) {
    // Optimistic UI update (optional - simplified here)
    const submitBtn = document.querySelector(`#${modalId} button[type="submit"]`);
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Saving...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.status === 'success') {
            toggleModal(modalId);
            fetchData(); // Reload all data
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Submission error:", error);
        alert("Failed to save. Check your connection or SCRIPT_URL.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// Utilities
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
