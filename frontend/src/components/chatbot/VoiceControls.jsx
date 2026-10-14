/**
 * VoiceControls.jsx
 * Voice mode toggle and browser speech capability status indicator
 * HarvestMitra AI - ISSUE-10
 */

import React from 'react';
import { Volume2, VolumeX, Mic, AlertCircle } from 'lucide-react';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../../services/speechService';

export default function VoiceControls({
  voiceAutoRead = false,
  onToggleVoiceAutoRead,
  isSpeaking = false,
  onStopSpeaking
}) {
  const sttSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  return (
    <div className="flex items-center gap-2">
      {isSpeaking && (
        <button
          type="button"
          onClick={onStopSpeaking}
          className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 text-xs font-medium hover:bg-amber-500/30 transition-all animate-pulse"
          title="Stop reading aloud"
          aria-label="Stop reading aloud"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Stop</span>
        </button>
      )}

      {ttsSupported ? (
        <button
          type="button"
          onClick={onToggleVoiceAutoRead}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
            voiceAutoRead
              ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-200 hover:bg-emerald-600/40'
              : 'bg-emerald-900/30 border-emerald-700/30 text-emerald-300/70 hover:bg-emerald-900/50'
          }`}
          title={voiceAutoRead ? 'Voice output is ON (responses read aloud)' : 'Voice output is OFF (click to enable)'}
          aria-label={voiceAutoRead ? 'Disable voice replies' : 'Enable voice replies'}
          aria-pressed={voiceAutoRead}
        >
          {voiceAutoRead ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Voice: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-emerald-400/60" />
              <span className="hidden sm:inline">Voice: OFF</span>
            </>
          )}
        </button>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-[11px] text-amber-300/80 px-2 py-1 bg-amber-950/40 rounded border border-amber-800/40"
          title="Voice playback is not supported in this browser"
        >
          <AlertCircle className="w-3 h-3" />
          <span className="hidden md:inline">Voice N/A</span>
        </span>
      )}
    </div>
  );
}
