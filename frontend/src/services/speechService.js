/**
 * speechService.js
 * Browser Web Speech API Service (STT & TTS)
 * Supports English (en-IN), Hindi (hi-IN), Gujarati (gu-IN), Marathi (mr-IN)
 * HarvestMitra AI - ISSUE-10
 */

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechRecognition: 'en-IN',
    speechSynthesis: 'en-IN',
    langTag: 'en-IN'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechRecognition: 'hi-IN',
    speechSynthesis: 'hi-IN',
    langTag: 'hi-IN'
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechRecognition: 'gu-IN',
    speechSynthesis: 'gu-IN',
    langTag: 'gu-IN'
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechRecognition: 'mr-IN',
    speechSynthesis: 'mr-IN',
    langTag: 'mr-IN'
  }
};

/**
 * Check if Web Speech Recognition (STT) is supported
 */
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Check if Web Speech Synthesis (TTS) is supported
 */
export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined');
}

/**
 * Active recognition instance holder
 */
let activeRecognition = null;

/**
 * Initialize and start Speech Recognition
 *
 * @param {Object} options
 * @param {string} options.language - 'en' | 'hi' | 'gu' | 'mr'
 * @param {Function} options.onStart - Callback when listening starts
 * @param {Function} options.onInterimResult - Callback for interim text (partial transcript)
 * @param {Function} options.onFinalResult - Callback for finalized text
 * @param {Function} options.onError - Callback with user-friendly error object
 * @param {Function} options.onEnd - Callback when recognition ends
 * @returns {Object|null} Recognition controller with stop/abort methods
 */
export function startRecognition({
  language = 'en',
  onStart,
  onInterimResult,
  onFinalResult,
  onError,
  onEnd
}) {
  if (!isSpeechRecognitionSupported()) {
    onError?.({
      code: 'UNSUPPORTED',
      message: 'Voice input is not supported in this browser. You can continue using text chat.'
    });
    return null;
  }

  // Stop any previous active recognition instance
  stopRecognition();

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;
  recognition.lang = langConfig.speechRecognition;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let recognizedFinal = '';
  let hasReceivedResults = false;

  recognition.onstart = () => {
    activeRecognition = recognition;
    hasReceivedResults = false;
    onStart?.();
  };

  recognition.onresult = (event) => {
    hasReceivedResults = true;
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        recognizedFinal += transcript;
      } else {
        interim += transcript;
      }
    }

    if (interim && onInterimResult) {
      onInterimResult(interim);
    }

    if (recognizedFinal && onFinalResult) {
      onFinalResult(recognizedFinal);
    }
  };

  recognition.onerror = (event) => {
    let friendlyMessage = 'An error occurred during voice recognition. Please try again.';

    switch (event.error) {
      case 'not-allowed':
      case 'service-not-allowed':
        friendlyMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings if you want to use voice input.';
        break;
      case 'no-speech':
        friendlyMessage = "I couldn't hear anything. Please try speaking again.";
        break;
      case 'network':
        friendlyMessage = 'Network connection error during voice recognition. You can continue using text chat.';
        break;
      case 'audio-capture':
        friendlyMessage = 'No microphone was found or audio capture failed. Please check your microphone hardware.';
        break;
      case 'aborted':
        // Aborted manually by user or new recognition - ignore error display
        return;
      default:
        friendlyMessage = `Voice recognition error: ${event.error}. You can still use text chat.`;
        break;
    }

    onError?.({
      code: event.error,
      message: friendlyMessage
    });
  };

  recognition.onend = () => {
    activeRecognition = null;
    onEnd?.({ hasResults: hasReceivedResults, finalTranscript: recognizedFinal });
  };

  try {
    recognition.start();
    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (_) {}
      },
      abort: () => {
        try {
          recognition.abort();
        } catch (_) {}
      }
    };
  } catch (err) {
    activeRecognition = null;
    onError?.({
      code: 'START_FAILED',
      message: 'Failed to start microphone. Please check permissions.'
    });
    return null;
  }
}

/**
 * Stop any active speech recognition
 */
export function stopRecognition() {
  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch (_) {}
    activeRecognition = null;
  }
}

/**
 * Query available browser voices
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export function getAvailableVoices() {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }

    // Chrome loads voices asynchronously
    const handler = () => {
      const asyncVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(asyncVoices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);

    // Safety timeout in case voiceschanged never fires
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices() || []);
    }, 1000);
  });
}

/**
 * Finds the most suitable voice for a given language code
 * Checks exact locale matches (e.g. mr-IN, gu-IN, hi-IN, en-IN) or base language codes (mr, gu, hi, en)
 *
 * IMPORTANT: NEVER fakes voice support (e.g., will never return a Hindi voice for Marathi)
 *
 * @param {string} langCode - 'en' | 'hi' | 'gu' | 'mr'
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {{ voice: SpeechSynthesisVoice | null, exactMatch: boolean }}
 */
export function findMatchingVoice(langCode, voices = []) {
  if (!Array.isArray(voices) || voices.length === 0) {
    return { voice: null, exactMatch: false };
  }

  const langConfig = SUPPORTED_LANGUAGES[langCode] || SUPPORTED_LANGUAGES.en;
  const targetLocale = (langConfig.speechSynthesis || '').toLowerCase(); // e.g. "mr-in"
  const baseCode = (langCode || '').toLowerCase(); // e.g. "mr"

  // 1. Exact locale match (e.g. mr-IN, mr_IN)
  const exact = voices.find((v) => {
    const vLang = (v.lang || '').replace('_', '-').toLowerCase();
    return vLang === targetLocale;
  });
  if (exact) {
    return { voice: exact, exactMatch: true };
  }

  // 2. Base code prefix match (e.g. starts with "mr-" or "mr")
  const baseMatch = voices.find((v) => {
    const vLang = (v.lang || '').replace('_', '-').toLowerCase();
    return vLang.startsWith(baseCode + '-') || vLang === baseCode;
  });
  if (baseMatch) {
    return { voice: baseMatch, exactMatch: false };
  }

  // NO FAKING: Do not substitute an unrelated language voice
  return { voice: null, exactMatch: false };
}

/**
 * Strips markdown symbols for natural and clear TTS reading
 * @param {string} text
 * @returns {string}
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\[DEMO\]/gi, 'Demo')
    .replace(/[*_#`~>]/g, '') // Remove Markdown bold, italics, headers, code, blockquotes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert [link text](url) to "link text"
    .replace(/https?:\/\/\S+/gi, '') // Remove bare URLs
    .replace(/[•\-\+]\s+/g, '') // Remove bullet points
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speak assistant message text aloud
 *
 * @param {string} text - Message to read
 * @param {string} language - 'en' | 'hi' | 'gu' | 'mr'
 * @param {Object} callbacks
 * @param {Function} [callbacks.onStart]
 * @param {Function} [callbacks.onEnd]
 * @param {Function} [callbacks.onError]
 * @returns {Promise<boolean>} Whether speech was initiated
 */
export async function speakMessage(text, language = 'en', callbacks = {}) {
  const { onStart, onEnd, onError } = callbacks;

  if (!isSpeechSynthesisSupported()) {
    onError?.({
      type: 'UNSUPPORTED',
      message: 'Voice playback is not supported in this browser. You can continue reading the text response.'
    });
    return false;
  }

  // Stop any active speech utterance
  stopSpeaking();

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) {
    onEnd?.();
    return false;
  }

  const voices = await getAvailableVoices();
  const { voice } = findMatchingVoice(language, voices);
  const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;

  // If no matching voice exists in this browser/OS, gracefully notify
  if (!voice) {
    // Check if browser has default voices at all
    const hasAnyVoice = voices.length > 0;
    const msg = hasAnyVoice
      ? `A voice for ${langConfig.name} is not installed in this browser/OS. You can still read the response text.`
      : 'Voice playback is unavailable because no system voices were found. You can still read the text response.';

    onError?.({
      type: 'NO_VOICE',
      language,
      languageName: langConfig.name,
      message: msg
    });
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = voice;
    utterance.lang = langConfig.speechSynthesis;
    utterance.rate = 0.95; // Slightly slower pace for Indian language clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        // Canceled manually by stopping or starting another message
        onEnd?.();
        return;
      }
      onError?.({
        type: 'SYNTHESIS_ERROR',
        error: event.error,
        message: 'Unable to complete voice readout.'
      });
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    onError?.({
      type: 'EXCEPTION',
      message: 'Failed to initialize speech synthesis.'
    });
    return false;
  }
}

/**
 * Cancel and stop any current speech synthesis
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
}

/**
 * Check if the browser is currently reading text aloud
 * @returns {boolean}
 */
export function isCurrentlySpeaking() {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
}
