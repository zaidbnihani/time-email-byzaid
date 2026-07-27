/**
 * Smart OTP & Verification Code Extractor
 * Parses subject, intro, plain text, and HTML for verification codes, PINs, and numbers.
 */

class OTPParser {
  /**
   * Extract primary verification code and all numbers found in an email
   * @param {Object} message - message object with subject, intro, text, html
   * @returns {Object} { primaryCode, allNumbers, activationUrl }
   */
  static extract(message) {
    if (!message) return { primaryCode: null, allNumbers: [], activationUrl: null };

    const subject = message.subject || '';
    const intro = message.intro || '';
    const textContent = message.text || '';
    const htmlContent = Array.isArray(message.html) ? message.html.join(' ') : (message.html || '');
    
    // Clean text by stripping HTML tags if needed
    const plainCombined = `${subject}\n${intro}\n${textContent}\n${this.stripHTML(htmlContent)}`;

    let primaryCode = null;
    let activationUrl = null;
    const numberSet = new Set();

    // 1. Check for Verification Code Patterns with context keywords
    const otpKeywordsPattern = /(?:رمز(?:التحقق|التأكيد|التفعيل)?|كود(?:التحقق|التفعيل)?|verification\s*code|security\s*code|confirmation\s*code|otp|passcode|pin|code)[\s:\-\#]*([A-Z0-9]{4,8})/gi;
    let match;
    while ((match = otpKeywordsPattern.exec(plainCombined)) !== null) {
      if (match[1] && match[1].length >= 4) {
        // Ensure it contains at least one digit
        if (/\d/.test(match[1])) {
          primaryCode = match[1];
          break;
        }
      }
    }

    // 2. If no keyword match, search for standalone 4 to 8 digit numbers in subject or intro first
    if (!primaryCode) {
      const subjectIntroCode = /(?<!\d)(\d{4,8})(?!\d)/.exec(`${subject} ${intro}`);
      if (subjectIntroCode) {
        primaryCode = subjectIntroCode[1];
      }
    }

    // 3. Fallback: Search for 4 to 8 digit numbers anywhere in text
    if (!primaryCode) {
      const generalCode = /(?<!\d)(\d{4,8})(?!\d)/.exec(plainCombined);
      if (generalCode) {
        primaryCode = generalCode[1];
      }
    }

    // 4. Extract ALL 3+ digit numbers found in text for easy one-click copying
    const allNumberMatches = plainCombined.match(/(?<!\d)(\d{3,10})(?!\d)/g) || [];
    allNumberMatches.forEach(num => numberSet.add(num));

    // 5. Look for direct activation/verification URLs
    const urlPattern = /(https?:\/\/[^\s"'<>]+(?:verify|confirm|activate|token|auth)[^\s"'<>]*)/gi;
    const urlMatch = urlPattern.exec(plainCombined);
    if (urlMatch) {
      activationUrl = urlMatch[1];
    }

    return {
      primaryCode: primaryCode ? primaryCode.trim() : null,
      allNumbers: Array.from(numberSet),
      activationUrl: activationUrl
    };
  }

  /**
   * Helper to strip HTML tags for plain text inspection
   */
  static stripHTML(htmlStr) {
    if (!htmlStr) return '';
    return htmlStr.replace(/<[^>]*>?/gm, ' ');
  }
}

window.OTPParser = OTPParser;
