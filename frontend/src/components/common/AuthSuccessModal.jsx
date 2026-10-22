import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Sprout, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  UserCheck, 
  Heart,
  Shield
} from 'lucide-react';
import { getTimeGreeting } from '../../utils/greeting';

// Gentle celebratory audio chime via Web Audio API (zero external assets needed)
function playCelebrationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.25); // C5
    playTone(659.25, now + 0.12, 0.3); // E5
    playTone(783.99, now + 0.24, 0.4); // G5
    playTone(1046.5, now + 0.36, 0.55); // C6
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

export default function AuthSuccessModal({ isOpen, mode = 'register', data = {}, onProceed }) {
  const [countdown, setCountdown] = useState(mode === 'register' ? 3 : 0);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'login') {
      if (onProceed) onProceed();
      return;
    }

    playCelebrationChime();
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onProceed) onProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, mode, onProceed]);

  if (!isOpen || mode === 'login') return null;

  const isRegister = mode === 'register';
  const role = data.role || 'farmer';
  const isFarmer = role === 'farmer';
  const isTransporter = role === 'transporter';
  const isAdmin = role === 'admin';
  const { greeting, icon } = getTimeGreeting();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      {/* 3D Floating Modal Card */}
      <div
        className="relative w-full max-w-md rounded-3xl bg-white border border-border/80 p-7 shadow-2xl text-center overflow-hidden transition-all duration-300"
        style={{
          boxShadow: '0 25px 50px -12px rgba(22, 101, 52, 0.25), 0 0 0 1px rgba(22, 101, 52, 0.1)',
          transform: 'perspective(1000px) rotateX(1deg)',
        }}
      >
        {/* Glowing 3D Background Gradients */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Floating 3D Badge Icon */}
        <div className="relative mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform">
          {isAdmin ? (
            <Shield className="w-10 h-10 drop-shadow-md text-amber-200" />
          ) : isTransporter ? (
            <Truck className="w-10 h-10 drop-shadow-md animate-bounce" />
          ) : isRegister ? (
            <Sprout className="w-10 h-10 drop-shadow-md animate-pulse" />
          ) : (
            <UserCheck className="w-10 h-10 drop-shadow-md" />
          )}

          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{isRegister ? 'MySQL Record Created' : 'Live Session Active'}</span>
        </div>

        {/* Main Title & Heartfelt Thank You / Welcome Message with Real-Time Greeting */}
        <h2 className="text-2xl font-black text-text tracking-tight">
          {isRegister ? (
            isFarmer ? (
              `🙏 ${greeting}, ${data.name || 'Farmer'}! — "અન્નદાતા સુખી ભવઃ"`
            ) : isTransporter ? (
              `🚚 ${greeting}, ${data.name || 'Partner'}! — Welcome to Fleet`
            ) : (
              `🛡️ ${greeting}, Admin Account Verified!`
            )
          ) : isAdmin ? (
            `🛡️ ${greeting}, APMC Admin ${data.name || ''}! ${icon}`
          ) : isTransporter ? (
            `🚚 ${greeting}, ${data.name || 'Driver'}! ${icon}`
          ) : (
            `🌾 ${greeting}, ${data.name || 'Farmer'}! ${icon}`
          )}
        </h2>

        <p className="text-xs text-muted mt-2 max-w-sm mx-auto leading-relaxed">
          {isRegister ? (
            isFarmer ? (
              <>
                Thank you for registering your farm with <strong>HarvestMitra AI</strong>! Your land and farmer profile are safely saved in our live MySQL system. We are deeply honored to empower India&apos;s food producers.
              </>
            ) : (
              <>
                Thank you for partnering to bring fair, pooled vehicle transport to local farming communities. Your truck is now ready to take bookings.
              </>
            )
          ) : isAdmin ? (
            'APMC Regulatory session verified. Accessing market records, farmer registries, and logistics control.'
          ) : (
            <>
              Thank you for trusting HarvestMitra live agritech intelligence. Your verified session is active.
            </>
          )}
        </p>

        {/* Profile Snapshot Card */}
        <div className="my-5 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">User Name:</span>
            <span className="font-bold text-text">{data.name || 'Verified User'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">Account Role:</span>
            <span className="inline-flex items-center gap-1 font-bold text-primary capitalize">
              {isAdmin ? (
                <Shield className="w-3.5 h-3.5 text-amber-600" />
              ) : isTransporter ? (
                <Truck className="w-3.5 h-3.5" />
              ) : (
                <Sprout className="w-3.5 h-3.5" />
              )}
              {isAdmin ? 'APMC System Admin' : isTransporter ? 'Transporter / Vehicle Provider' : 'Farmer / Producer'}
            </span>
          </div>

          {data.phone && (
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Contact:</span>
              <span className="font-mono font-bold text-text">+91 {data.phone}</span>
            </div>
          )}

          {data.district && (
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Operating Hub:</span>
              <span className="font-semibold text-text">{data.district} APMC</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span className="text-muted font-medium">Security:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>JWT Verified Token</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onProceed}
          className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg transition-all"
        >
          <span>
            {isRegister
              ? `Enter Dashboard (${countdown}s)`
              : isAdmin
              ? `Open Admin Panel (${countdown}s)`
              : isTransporter
              ? `Open Logistics Portal (${countdown}s)`
              : `Enter Farmer Dashboard (${countdown}s)`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-muted mt-2.5">
          Auto-redirecting in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
