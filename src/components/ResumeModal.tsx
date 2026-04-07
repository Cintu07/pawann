"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function ResumeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-lg font-medium text-white tracking-wide">Resume</h2>
            <div className="flex items-center gap-4">
              <a
                href="/pavankalyan.pdf"
                download="Pawan_Kalyan_Resume.pdf"
                className="text-sm font-mono bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded transition-colors"
              >
                Download PDF
              </a>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 w-full relative bg-neutral-900/50">
            <object 
              data="/pavankalyan.pdf#toolbar=0&navpanes=0&scrollbar=0" 
              type="application/pdf"
              className="absolute inset-0 w-full h-full"
            >
              <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-400">
                <p>Your browser doesn't support embedded PDFs.</p>
                <a href="/pavankalyan.pdf" className="text-white underline decoration-dotted underline-offset-4">
                  Click here to download it instead.
                </a>
              </div>
            </object>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
