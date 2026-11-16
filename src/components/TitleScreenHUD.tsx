import React from 'react';
import {
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  SlidersHorizontal,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ScreenId } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface TitleScreenHUDProps {
  visible: boolean;
  hideTopControls?: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const TitleScreenHUD: React.FC<TitleScreenHUDProps> = ({
  visible,
  hideTopControls = false,
  isMuted,
  isFullscreen,
  onToggleMute,
  onToggleFullscreen,
  onNavigate,
}) => {
  return (
    <>
      {/* Top-Right Utility Square Buttons (Fullscreen + Audio) */}
      {!hideTopControls && (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2.5 pointer-events-auto">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.14 }}
          onMouseEnter={() => soundEngine.playHover()}
          onClick={() => {
            soundEngine.playClick(false);
            onToggleFullscreen();
          }}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#101924]/82 hover:bg-[#172434]/95 border border-white/15 hover:border-cyan-400/50 flex items-center justify-center text-white shadow-[0_6px_18px_rgba(0,0,0,0.32)] transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" strokeWidth={1.9} />
          ) : (
            <Maximize2 className="w-5 h-5" strokeWidth={1.9} />
          )}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.14 }}
          onMouseEnter={() => soundEngine.playHover()}
          onClick={() => {
            onToggleMute();
          }}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          title={isMuted ? 'Enable Audio' : 'Mute Audio'}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#101924]/82 hover:bg-[#172434]/95 border border-white/15 hover:border-cyan-400/50 flex items-center justify-center text-white shadow-[0_6px_18px_rgba(0,0,0,0.32)] transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white/90" strokeWidth={1.9} />
          ) : (
            <Volume2 className="w-5 h-5 text-[#38bdf8]" strokeWidth={1.9} />
          )}
        </motion.button>
      </div>
      )}

      {/* Main Home Screen Left Lockup & 2x2 Navigation Grid */}
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-end pb-6 sm:pb-10 md:pb-12 pl-5 pr-5 sm:pl-10 md:pl-14"
        >
          {/* Subtle atmospheric left scrim ensuring crisp contrast across all camera sway angles */}
          <div
            className="pointer-events-none fixed inset-y-0 left-0 w-[62%] max-w-[560px] bg-gradient-to-r from-[#09111a]/45 via-[#09111a]/18 to-transparent -z-10"
            aria-hidden="true"
          />

          <div className="pointer-events-auto max-w-[540px] w-full">
            {/* Logo Lockup matching Flow Racing composition */}
            <div className="mb-5 sm:mb-6 select-none">
              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.34em] text-white/92 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                FLOW STUDIOS
              </p>
              <h1 className="mt-1 text-5xl sm:text-6xl md:text-[72px] font-extrabold tracking-[0.18em] leading-[0.95] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
                FLOW
              </h1>
              <p className="mt-1.5 text-sm sm:text-base md:text-lg font-bold tracking-[0.42em] text-[#38bdf8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                SKATE
              </p>
            </div>

            {/* Row 1: PLAY (Primary Cyan-Teal) + CAREER MODE (Dark) */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick(true);
                  onNavigate('play');
                }}
                className="group flex items-center justify-between px-5 sm:px-6 h-12 sm:h-[54px] w-[185px] sm:w-[245px] rounded-xl bg-gradient-to-r from-[#0e7490] to-[#178ea9] hover:from-[#1289a8] hover:to-[#1ea5c4] border border-cyan-300/35 shadow-[0_8px_24px_rgba(14,116,144,0.38)] text-white transition-colors focus-visible:outline-2 focus-visible:outline-white cursor-pointer shrink-0"
              >
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span className="text-xs sm:text-sm font-bold tracking-[0.22em]">PLAY</span>
                </span>
                <ChevronRight className="w-4 h-4 text-white/85 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick(false);
                  onNavigate('career');
                }}
                className="flex items-center gap-3 px-4 sm:px-5 h-12 sm:h-[54px] min-w-[165px] sm:w-[215px] rounded-xl bg-[#101924]/80 hover:bg-[#172536]/92 border border-white/15 hover:border-cyan-400/45 shadow-[0_6px_18px_rgba(0,0,0,0.28)] text-white transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 cursor-pointer shrink-0"
              >
                <Trophy className="w-4 h-4 text-[#38bdf8] shrink-0" strokeWidth={2} />
                <span className="text-xs sm:text-sm font-bold tracking-[0.15em] whitespace-nowrap">
                  CAREER MODE
                </span>
              </motion.button>
            </div>

            {/* Row 2: GARAGE (Dark) + SETTINGS (Dark) */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick(false);
                  onNavigate('garage');
                }}
                className="flex items-center gap-3 px-4 sm:px-5 h-11 sm:h-[50px] min-w-[140px] sm:w-[165px] rounded-xl bg-[#101924]/80 hover:bg-[#172536]/92 border border-white/15 hover:border-cyan-400/45 shadow-[0_6px_18px_rgba(0,0,0,0.28)] text-white transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 cursor-pointer shrink-0"
              >
                <Wrench className="w-4 h-4 text-[#38bdf8] shrink-0" strokeWidth={2} />
                <span className="text-xs sm:text-sm font-bold tracking-[0.16em] whitespace-nowrap">
                  GARAGE
                </span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => soundEngine.playHover()}
                onClick={() => {
                  soundEngine.playClick(false);
                  onNavigate('settings');
                }}
                className="flex items-center gap-3 px-4 sm:px-5 h-11 sm:h-[50px] min-w-[145px] sm:w-[180px] rounded-xl bg-[#101924]/80 hover:bg-[#172536]/92 border border-white/15 hover:border-cyan-400/45 shadow-[0_6px_18px_rgba(0,0,0,0.28)] text-white transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4 text-white/85 shrink-0" strokeWidth={2} />
                <span className="text-xs sm:text-sm font-bold tracking-[0.16em] whitespace-nowrap">
                  SETTINGS
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
