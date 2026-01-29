# USSH Sniper - Chrome Extension

A Chrome extension port of the USSH Sniper V3 tool for automated course registration at HCMUS.

## Features

✅ **Auto-detection of available slots** - Continuously scans for course availability
✅ **One-click registration** - Automatically registers when slots open
✅ **Multiple target classes** - Hunt for multiple courses simultaneously
✅ **Persistent configuration** - Saves settings across sessions
✅ **Real-time logging** - See exactly what's happening
✅ **Configurable scan delay** - Control hunting speed

## Installation

1. **Extract the extension:**
   - Navigate to the `chrome-extension` folder

2. **Load into Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer Mode** (top-right corner)
   - Click **Load unpacked**
   - Select the `chrome-extension` folder
   - The extension will appear in your Chrome toolbar

3. **Pin the extension (optional):**
   - Click the puzzle icon in Chrome toolbar
   - Find "USSH Sniper - Course Registration Tool"
   - Click the pin icon to keep it visible

## Usage

### Step 1: Get Your Cookie
1. Go to https://hcmussh.edu.vn/
2. Open Developer Tools (F12)
3. Go to **Application** → **Cookies** → Select the HCMUSSH domain
4. Find and copy the cookie value (usually starts with `dhkhxhnv-dhbk...`)

### Step 2: Configure the Extension
1. Click the extension icon in your Chrome toolbar
2. Paste your cookie into the **Cookie** field
3. Fill in:
   - **Config ID** (from your course registration page, usually 1686)
   - **School Year** (e.g., "2025 - 2026")
   - **Semester** (e.g., 2)
   - **Scan Delay** (recommended: 1.0 seconds)

### Step 3: Add Target Classes
1. Click **+ Add Target Class**
2. Fill in each target's details:
   - **Display Name**: A nickname for the course (e.g., "Badminton 1")
   - **Class Code**: The course code (e.g., "2520TC2004L02")
   - **Subject Code**: The subject code (e.g., "TC2004")
   - **Full Subject Name**: Complete course name
3. Add as many targets as you want

### Step 4: Start Hunting
1. Click **▶️ Start Hunting**
2. Watch the log for slot updates
3. The extension will automatically register when slots become available
4. Click **⏹️ Stop** to pause hunting

## Getting Class Information

To find the class code and other details:

1. Log into HCMUSSH course registration page
2. Open **F12 Developer Tools**
3. Go to **Network** tab
4. Look for requests to `get-data` endpoint
5. Check the **Request Payload** to find:
   - `cauHinh[id]` → Config ID
   - `cauHinh[namHoc]` → School Year
   - `cauHinh[hocKy]` → Semester

For individual course codes, check the course listing page or examine network requests when viewing available courses.

## Data Storage

All your configurations (cookie, targets, settings) are stored securely in Chrome's sync storage. Your data will be:
- Saved automatically when you click "💾 Save Config"
- Synced across devices if you're signed into Chrome
- Only sent to HCMUSSH servers (not to external parties)

## Tips & Tricks

💡 **Optimal scan speed**: Start with 1.0 seconds, adjust based on server response times
💡 **Multiple extensions**: You can have multiple browser profiles with different cookies for different accounts
💡 **Check before hunting**: Verify your class codes are correct before starting
💡 **Keep browser open**: The extension requires an active Chrome window to function
💡 **Monitor the log**: The log shows real-time updates about slot availability

## Troubleshooting

### "Server Check Slot lỗi"
- Your cookie may have expired. Get a new one and try again.

### "Không thấy lớp trong DS"
- The class code might be incorrect
- The course might already be registered
- The registration period might have ended

### Extension won't start
- Make sure you've filled in all required fields
- Check that your cookie is valid (not expired)
- Check browser console (F12) for errors

## Safety Notice

⚠️ **Cookie Security**: Never share your cookie with others. It contains your login credentials.
⚠️ **Terms of Service**: Use responsibly and in accordance with HCMUS regulations.
⚠️ **Multiple Instances**: Don't run multiple copies of this tool simultaneously with the same account.

## Credits

Based on **USSH Sniper V3** - A course registration automation tool
Ported to Chrome Extension format

---

**Version 3.0.0** - Chrome Extension Edition
