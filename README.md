# I-CAN-SAVE: Money Management Tool

A sleek, mobile-first Progressive Web App (PWA) to track your monthly allowance and daily expenses.

## 🚀 Features
- **Dashboard**: Real-time balance, total income, and total expenses.
- **Backended by Google Sheets**: Your data is stored safely in your own Google Drive.
- **PWA Support**: Install it on your phone or PC (works offline).
- **Dark Mode**: Premium night-eye friendly design with glassmorphism effects.
- **Mobile First**: Optimized for one-hand usage.

## 🛠️ Setup Instructions

### 1. Google Sheets Backend
1. Create a new Google Sheet in your Google Drive.
2. Rename the first sheet tab (at the bottom) to **"Transactions"**.
3. In the top menu, go to **Extensions** > **Apps Script**.
4. Delete any code in the editor and paste the contents of `google-apps-script.gs`.
5. Click the **Save** icon (diskette).
6. Click **Deploy** > **New Deployment**.
7. Select type: **Web App**.
8. Description: `I-CAN-SAVE-API`
9. Execute as: **Me**.
10. Who has access: **Anyone**. (Required for the web app to communicate)
11. Click **Deploy**.
12. Copy the **Web App URL** provided at the end.

### 2. Connect Frontend
1. Open `app.js` in this project.
2. Find the line: `const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";`
3. Replace the placeholder with your copied **Web App URL**.
4. Save the file.

### 3. Host on GitHub Pages
1. Upload all files (except perhaps `google-apps-script.gs` and `README.md`) to a new GitHub repository.
2. Go to repository **Settings** > **Pages**.
3. Under "Build and deployment", set source to **Deploy from a branch**.
4. Select the **main** branch and click **Save**.
5. Your app will be live at `https://your-username.github.io/your-repo-name/`.

## 📱 Installation (PWA)
- **Android/Chrome**: Tap the three dots and select "Install App" or "Add to Home Screen".
- **iOS/Safari**: Tap the "Share" button and select "Add to Home Screen".
- **Desktop**: Click the install icon in the address bar.

## 📄 License
MIT
