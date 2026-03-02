/**
 * Copies text to clipboard with fallback for older browsers/iOS/insecure contexts.
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function copyTextToClipboard(text) {
    if (!text) return false;

    // 1. Try modern Clipboard API first (requires secure context for writeText)
    // IMPORTANT: Explicitly check secure context to avoid async failures blocking fallback
    const useModernAPI = window.isSecureContext && navigator.clipboard;

    if (useModernAPI) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('Modern clipboard API failed, attempting synchronous fallback', err);
            // If modern API fails (e.g. permission denied or specific browser quirk),
            // we fall through to the synchronous fallback.
        }
    }

    // 2. Fallback: execCommand('copy') - MUST BE SYNCHRONOUS for iOS
    // If we wait for async operations (like the catch block above), iOS might lose the "user activation" context.
    // However, if we fail fast in modern API check, we are still within the event handler stack.
    return fallbackCopyTextToClipboard(text);
}

function fallbackCopyTextToClipboard(text) {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // iOS-safe styling: prevent zooming, keep onscreen but invisible
        // position: fixed prevents scrolling to bottom
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";
        textArea.style.opacity = "0.01"; // Tiny visibility might help specific browser heuristics
        textArea.style.fontSize = "16px"; // Prevent zoom on focus

        // This is crucial for iOS: needs to be editable to select properly
        textArea.contentEditable = true;
        textArea.readOnly = false;

        document.body.appendChild(textArea);

        // iOS selection magic
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999); // Select all text

        const successful = document.execCommand('copy');

        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error('Fallback copy failed', err);
        return false;
    }
}
