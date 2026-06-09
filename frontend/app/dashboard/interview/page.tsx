'use client'

import { Suspense } from 'react'
import { Brain, Sparkles, Loader2 } from 'lucide-react'
import InterviewSession from '@/components/interview/InterviewSession'
import { motion } from 'framer-motion'

export default function InterviewPage() {
  return (
    <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box', paddingBottom: '60px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
          <Brain style={{ width: '32px', height: '32px', color: '#C084FC' }} />
          AI Mock Interview
        </h1>
        <p style={{ color: '#94A3B8', marginTop: '8px', fontSize: '15px', maxWidth: '600px', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
          Experience high-fidelity technical interviews.
          <Sparkles style={{ width: '14px', height: '14px', color: '#FBBF24', fill: '#FBBF24' }} />
          Powered by Generative AI and BERT evaluation models.
        </p>
      </motion.div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-20 glass-card border-slate-800">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Loading Interview System...</p>
        </div>
      }>
        <InterviewSession />
      </Suspense>
    </div>
  )
}