/**
 * kisanVoiceService.js
 * Core logic for Kisan Voice Assistant, Wake-Word Triggers ("Hey Mitra" / "नमस्ते मित्रा")
 * and Speech Sensitivity Calibration Matrix
 * HarvestMitra AI
 */

// Multilingual Wake-Word Regex Patterns
export const WAKE_WORD_PATTERNS = {
  en: [
    /\b(?:hey|hi|hello)\s+mitra\b/i,
    /\bmitra\s+assistant\b/i,
    /\bok\s+mitra\b/i,
    /\bhey\s+mitr\b/i
  ],
  hi: [
    /(?:नमस्ते|हे|हेलो|ओ\s*के|सुनो)\s*(?:मित्रा|मित्र|मित्तरा)/i,
    /(?:मित्रा\s*असिस्टेंट)/i,
    /\bhey\s+mitra\b/i
  ],
  mr: [
    /(?:हे|ऐक|नमस्कार|मित्रा\s*दादा|भाऊ|मित्रा\s*सहाय्यक)\s*(?:मित्रा|मित्र)?/i,
    /(?:नमस्ते|हे|हेलो)\s*मित्रा/i,
    /\bhey\s+mitra\b/i
  ]
};

// Sensitivity Configuration Matrix
export const SENSITIVITY_CONFIGS = {
  low: {
    id: 'low',
    label: { mr: 'कमी (मंडी गोंधळ)', hi: 'कम (शोरगुल)', en: 'Low (Noisy Mandi)' },
    description: {
      mr: 'आवाज जास्त असलेल्या बाजार समित्यांसाठी योग्य (उच्च अचूकता)',
      hi: 'शोरगुल वाली मंडियों के लिए उपयुक्त (उच्च सटीकता)',
      en: 'Best for loud APMC mandi yards with background machinery noise'
    },
    minConfidence: 0.70,
    silenceDelayMs: 2200,
    gain: 0.7
  },
  medium: {
    id: 'medium',
    label: { mr: 'मध्यम (सामान्य)', hi: 'मध्यम (सामान्य)', en: 'Medium (Balanced)' },
    description: {
      mr: 'दैनंदिन शेत परिसर आणि घरासाठी संतुलित',
      hi: 'दैनिक खेत व घर के लिए संतुलित',
      en: 'Standard balanced sensitivity for field and everyday farm use'
    },
    minConfidence: 0.50,
    silenceDelayMs: 1600,
    gain: 1.0
  },
  high: {
    id: 'high',
    label: { mr: 'जास्त (संवेदनशील)', hi: 'उच्च (संवेदनशील)', en: 'High (Whisper)' },
    description: {
      mr: 'शांत खोलीसाठी - हलक्या आवाजातील हाक त्वरित ओळखते',
      hi: 'शांत कमरे के लिए - हल्की आवाज भी तुरंत पकड़ता है',
      en: 'High sensitivity for quiet rooms - captures soft speech or whisper'
    },
    minConfidence: 0.30,
    silenceDelayMs: 1100,
    gain: 1.4
  }
};

/**
 * Match a speech transcript against multilingual wake-word patterns
 *
 * @param {string} transcript - Input speech text
 * @param {string} language - 'mr' | 'hi' | 'en'
 * @returns {{ matched: boolean, wakeWord?: string, query?: string }}
 */
export function matchWakeWord(transcript, language = 'mr') {
  if (!transcript) return { matched: false };
  const clean = transcript.trim().toLowerCase();

  const langPatterns = WAKE_WORD_PATTERNS[language] || [];
  const allPatterns = [
    ...langPatterns,
    ...WAKE_WORD_PATTERNS.en,
    ...WAKE_WORD_PATTERNS.hi,
    ...WAKE_WORD_PATTERNS.mr
  ];

  for (const pattern of allPatterns) {
    const match = clean.match(pattern);
    if (match) {
      const matchText = match[0];
      const matchEndIndex = match.index + matchText.length;
      const remainder = transcript.substring(matchEndIndex).trim();
      const query = remainder.replace(/^[,.\s-]+/, '').trim();
      return { matched: true, wakeWord: matchText, query };
    }
  }

  return { matched: false };
}
