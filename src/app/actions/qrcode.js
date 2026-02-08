"use server";

/**
 * Fetches the QR code image from the ekQR payment page
 * Extracts the base64 QR code from the HTML
 */
export async function fetchQRCodeAction(paymentUrl) {
  try {
    // Fetch the payment page HTML
    const response = await fetch(paymentUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment page: ${response.status}`);
    }

    const html = await response.text();

    // Extract the QR code base64 image using regex
    // Looking for: <img class="qr_code_img" src="data:image/png;base64,..." 
    const qrMatch = html.match(/class="qr_code_img"[^>]*src="(data:image\/[^"]+)"/);
    
    if (!qrMatch || !qrMatch[1]) {
      // Try alternative pattern
      const altMatch = html.match(/src="(data:image\/png;base64,[^"]+)"[^>]*class="qr_code_img"/);
      if (altMatch && altMatch[1]) {
        return { success: true, qrImage: altMatch[1] };
      }
      throw new Error("QR code image not found in payment page");
    }

    // Extract timer if available
    // Look for patterns like "Valid until 2:39" or "2:39" in countdown elements
    let expirySeconds = null;
    
    // Try multiple patterns to find the timer
    const timerPatterns = [
      /Valid\s*until\s*(\d+):(\d+)/i,           // "Valid until 2:39"
      /countdown[^>]*>(\d+):(\d+)/i,            // countdown element
      /<span[^>]*>(\d+):(\d+)<\/span>/,         // generic span with time
      /timer[^>]*>(\d+):(\d+)/i,                // timer element
      /expire[^>]*>(\d+):(\d+)/i,               // expire element
    ];

    for (const pattern of timerPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[2]) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        expirySeconds = (minutes * 60) + seconds;
        break;
      }
    }

    return {
      success: true,
      qrImage: qrMatch[1],
      expirySeconds, // Timer in seconds (e.g., 159 for "2:39")
    };
  } catch (error) {
    console.error("[fetchQRCodeAction] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch QR code",
    };
  }
}
