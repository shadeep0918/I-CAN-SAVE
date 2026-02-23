/**
 * I-CAN-SAVE App Logic - Premium Edition
 */

// REPLACE THIS with your deployed Google Apps Script Web App URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxr_NAGCgM-MdxIjzL8hh65oGcNRdud1g4AI8ukKoW7yBAjkdbYPkAwKM9De10vuNk-/exec";

// Elements
const balanceDisp = document.getElementById('balanceDisp');
const incomeDisp = document.getElementById('incomeDisp');
const expenseDisp = document.getElementById('expenseDisp');
const historyList = document.getElementById('historyList');
const incomeForm = document.getElementById('incomeForm');
const expenseForm = document.getElementById('expenseForm');
const editForm = document.getElementById('editForm');
const balanceProgress = document.getElementById('balanceProgress');

// State
let appData = {
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    history: [],
    monthlyBreakdown: {}
};

const CORRECT_PASSCODE = localStorage.getItem('app_passcode') || null;
let inputPasscode = "";

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initPasscode();

    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
        historyList.innerHTML = `<div class="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] text-amber-400 text-sm glass">
            Please set your <b>SCRIPT_URL</b> in <code>app.js</code> to connect to Google Sheets.
        </div>`;
    } else {
        if (sessionStorage.getItem('is_authenticated') === 'true' || !CORRECT_PASSCODE) {
            fetchData();
        }
    }
});

function initPasscode() {
    const overlay = document.getElementById('passcodeOverlay');
    const title = document.getElementById('passcodeTitle');
    const msg = document.getElementById('passcodeMsg');

    if (!CORRECT_PASSCODE) {
        title.innerText = "Setup Vault";
        msg.innerText = "Create a 4-digit PIN to secure your data";
    }

    if (sessionStorage.getItem('is_authenticated') === 'true') {
        overlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => overlay.classList.add('hidden'), 500);
    }
}

function pressKey(key) {
    const dots = document.querySelectorAll('.dot');
    if (key === 'back') {
        inputPasscode = inputPasscode.slice(0, -1);
    } else if (inputPasscode.length < 4) {
        inputPasscode += key;
    }

    dots.forEach((dot, i) => {
        if (i < inputPasscode.length) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    if (inputPasscode.length === 4) {
        setTimeout(verifyPasscode, 200);
    }
}

function verifyPasscode() {
    const dots = document.querySelectorAll('.dot');
    const msg = document.getElementById('passcodeMsg');

    if (!CORRECT_PASSCODE) {
        localStorage.setItem('app_passcode', inputPasscode);
        sessionStorage.setItem('is_authenticated', 'true');
        unlockApp();
    } else if (inputPasscode === CORRECT_PASSCODE) {
        sessionStorage.setItem('is_authenticated', 'true');
        unlockApp();
    } else {
        dots.forEach(dot => dot.classList.add('error'));
        msg.innerText = "Incorrect PIN code";
        msg.classList.add('text-rose-400');

        setTimeout(() => {
            inputPasscode = "";
            dots.forEach(dot => dot.classList.remove('active', 'error'));
            msg.innerText = "Enter your vault passcode";
            msg.classList.remove('text-rose-400');
        }, 600);
    }
}

function unlockApp() {
    const overlay = document.getElementById('passcodeOverlay');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    fetchData();
    setTimeout(() => overlay.classList.add('hidden'), 500);
}

function lockApp() {
    sessionStorage.removeItem('is_authenticated');
    window.location.reload();
}

// Modal Control
function toggleModal(id) {
    const modal = document.getElementById(id);
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        const amountInput = modal.querySelector('input[name="amount"]');
        if (amountInput) amountInput.value = '';
        if (id === 'expenseModal') {
            modal.querySelector('input[name="description"]').value = '';
        }
    }
}

// Fetch Data
async function fetchData() {
    const loader = `<div class="p-12 text-center space-y-4">
        <div class="w-10 h-10 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
        <p class="text-slate-400 font-medium">Connecting to Vault...</p>
    </div>`;

    // Only show loader if history is empty (first load)
    if (appData.history.length === 0) {
        historyList.innerHTML = loader;
    }

    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        if (data.status === "error") {
            throw new Error(data.message);
        }

        appData = data;
        updateUI();
    } catch (error) {
        console.error("Error fetching data:", error);
        historyList.innerHTML = `<div class="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] text-rose-400 text-center glass">
            <i data-lucide="alert-circle" class="w-10 h-10 mx-auto mb-3 opacity-50"></i>
            <p class="font-bold">Sync Failed</p>
            <p class="text-xs mt-1 opacity-70">${error.message}</p>
            <button onclick="fetchData()" class="mt-4 px-6 py-2 bg-rose-500/20 rounded-xl text-xs font-bold uppercase tracking-wider">Retry</button>
        </div>`;
        if (window.lucide) lucide.createIcons();
    }
}

// Update UI
function updateUI() {
    balanceDisp.innerText = formatCurrency(appData.balance || 0);
    incomeDisp.innerText = formatCurrency(appData.totalIncome || 0);
    expenseDisp.innerText = formatCurrency(appData.totalExpenses || 0);

    // Safety check for monthly breakdown
    if (!appData.monthlyBreakdown) appData.monthlyBreakdown = {};
    if (!appData.history) appData.history = [];

    // Safety check for monthly breakdown
    if (!appData.monthlyBreakdown) appData.monthlyBreakdown = {};

    // Update Monthly Selector
    const monthSelect = document.getElementById('monthSelect');
    const currentSelection = monthSelect.value;
    monthSelect.innerHTML = '';

    const months = Object.keys(appData.monthlyBreakdown).sort().reverse();

    if (months.length === 0) {
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        months.push(thisMonth);
    }

    months.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        const parts = m.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const date = new Date(year, month - 1);
        option.innerText = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        monthSelect.appendChild(option);
    });

    if (currentSelection && months.includes(currentSelection)) {
        monthSelect.value = currentSelection;
    } else {
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthSelect.value = months.includes(thisMonth) ? thisMonth : months[0];
    }

    updateMonthlyUI();

    // Update Progress Bar
    const percentage = appData.totalIncome > 0 ? (Math.max(0, appData.balance) / appData.totalIncome) * 100 : 0;
    balanceProgress.style.width = `${percentage}%`;

    historyList.innerHTML = '';

    if (appData.history.length === 0) {
        historyList.innerHTML = '<p class="text-slate-500 text-center py-12 font-medium">Your timeline is empty</p>';
        return;
    }

    appData.history.forEach((t, index) => {
        const date = new Date(t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const isIncome = t.type === 'Income';

        const item = document.createElement('div');
        item.className = 'history-item bg-white border border-slate-100 rounded-3xl p-5 flex justify-between items-center group active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow-md';
        item.style.animationDelay = `${index * 60}ms`;
        item.onclick = () => openEditModal(t);

        item.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center shadow-inner">
                    <i data-lucide="${isIncome ? 'trending-up' : 'trending-down'}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">${t.description}</h4>
                    <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">${date}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-black text-lg ${isIncome ? 'text-emerald-600' : 'text-slate-800'}">${isIncome ? '+' : '-'}${formatCurrency(t.amount, false)}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tap to Edit</p>
            </div>
        `;
        historyList.appendChild(item);
    });

    // Re-initialize icons for new elements
    if (window.lucide) lucide.createIcons();
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

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(editForm);
    const data = {
        action: 'update',
        id: parseInt(formData.get('id')),
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description')
    };
    await submitTransaction(data, 'editModal');
});

function openEditModal(transaction) {
    const modal = document.getElementById('editModal');
    editForm.querySelector('input[name="id"]').value = transaction.id;
    editForm.querySelector('input[name="type"]').value = transaction.type;
    editForm.querySelector('input[name="amount"]').value = transaction.amount;
    editForm.querySelector('input[name="description"]').value = transaction.description;
    toggleModal('editModal');
}

async function deleteTransaction() {
    const id = editForm.querySelector('input[name="id"]').value;
    if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
        await submitTransaction({ action: 'delete', id: parseInt(id) }, 'editModal');
    }
}

async function submitTransaction(data, modalId) {
    const submitBtn = document.querySelector(`#${modalId} button[type="submit"]`) || document.querySelector(`#${modalId} .btn-premium`);
    const originalText = submitBtn ? submitBtn.innerText : '';

    if (submitBtn) {
        submitBtn.innerText = 'Syncing...';
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.status === 'success') {
            if (document.getElementById(modalId).classList.contains('hidden') === false) {
                toggleModal(modalId);
            }
            fetchData();
        } else {
            alert("Sync Error: " + result.message);
        }
    } catch (error) {
        console.error("Submission error:", error);
        alert("Failed to connect. Please check your internet.");
    } finally {
        if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Utilities
function formatCurrency(amount, includeSymbol = true) {
    const formatted = new Intl.NumberFormat('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);

    return includeSymbol ? `Rs. ${formatted}` : formatted;
}

function updateMonthlyUI() {
    const monthSelect = document.getElementById('monthSelect');
    const selectedMonth = monthSelect.value;
    const data = appData.monthlyBreakdown[selectedMonth] || { income: 0, expense: 0 };

    document.getElementById('monthIncomeDisp').innerText = formatCurrency(data.income);
    document.getElementById('monthExpenseDisp').innerText = formatCurrency(data.expense);
}

