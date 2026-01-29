// Background service worker for Chrome extension
// This file handles any background tasks if needed

chrome.runtime.onInstalled.addListener(() => {
    console.log('USSH Sniper Extension installed');
});

// Listen for messages from popup if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getConfig') {
        chrome.storage.sync.get(['usshSniperConfig'], (result) => {
            sendResponse(result.usshSniperConfig || {});
        });
        return true;
    }
});
