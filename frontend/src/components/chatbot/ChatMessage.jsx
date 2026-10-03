/**
 * ChatMessage.jsx
 * Individual message bubble for User and Mitra Assistant
 * HarvestMitra AI - ISSUE-10
 */

import React from 'react';
import { Volume2, VolumeX, Bot, User, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ChatMessage({
  message,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking,
  ttsAvailable = true
}) {
  const isUser = message.sender === 'user';
  const timeString = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-emerald-800 font-medium px-1">
            <span>You</span>
            <User className="w-3 h-3 text-emerald-700" />
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm text-sm sm:text-base leading-relaxed break-words font-normal tracking-wide">
            {message.text}
          </div>
          {timeString && (
            <span className="text-[10px] text-gray-500 mt-1 px-1">{timeString}</span>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex justify-start mb-4 group">
      <div className="max-w-[90%] sm:max-w-[82%] flex flex-col items-start">
        {/* Header with Mitra Avatar and Tags */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
            <span className="text-xs">🌱</span>
          </div>
          <span className="text-xs font-semibold text-emerald-950">Mitra Assistant</span>
          {message.mode === 'fallback' ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
              Verified Rules
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
              <Sparkles className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </div>

        {/* Bubble */}
        <div className="bg-white border border-emerald-100/80 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-sm sm:text-base leading-relaxed break-words font-normal relative">
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>

          {/* Source disclaimer */}
          {message.disclaimer && (
            <div className="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-500 italic flex items-center gap-1">
              <span>ℹ️</span>
              <span>{message.disclaimer}</span>
            </div>
          )}

          {/* Action Footer: Speaker button and timestamp */}
          <div className="flex items-center justify-between mt-2 pt-1.5 text-xs text-gray-400">
            <span>{timeString}</span>

            {ttsAvailable && (
              <div className="flex items-center gap-1.5">
                {isSpeaking ? (
                  <button
                    type="button"
                    onClick={onStopSpeaking}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm animate-pulse"
                    aria-label="Stop reading message"
                    title="Stop reading aloud"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Speaking...</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSpeak(message.text)}
                    className="p-1 rounded text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    aria-label="Read message aloud"
                    title="Read message aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
