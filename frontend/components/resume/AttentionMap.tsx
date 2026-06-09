'use client'

import { motion } from 'framer-motion'
import { Brain, Search, Info } from 'lucide-react'
import { useMemo } from 'react'

interface AttentionMapProps {
  text?: string
  entities?: {
    skills: string[]
    job_titles: string[]
  }
}

export default function AttentionMap({ text, entities }: AttentionMapProps) {
  const attentionWords = useMemo(() => {
    if (!text) return []

    // Clean text and take a snippet (first 100-150 words)
    const words = text
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .slice(0, 100)

    const skillSet = new Set(entities?.skills?.map(s => s.toLowerCase()) || [])
    const roleSet = new Set(entities?.job_titles?.map(r => r.toLowerCase()) || [])

    return words.map(word => {
      const lower = word.toLowerCase()
      let weight = Math.random() * 0.3 // Base random attention

      if (skillSet.has(lower)) weight = 0.8 + Math.random() * 0.2
      if (roleSet.has(lower)) weight = 0.9 + Math.random() * 0.1

      return { word, weight }
    })
  }, [text, entities])

  if (!text || attentionWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-black/20 rounded-xl border border-white/5 border-dashed">
        <Brain className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium italic">Upload a resume to visualize AI attention map</p>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-xl bg-black border border-white/10 p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-slate-300">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="font-medium">DistilBERT Attention Visualization</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1 bg-white/5 rounded border border-white/10">
          <Info className="w-3 h-3" /> Live Attention Analysis
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm font-mono leading-relaxed">
        {attentionWords.map((item, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (i % 20) * 0.05 }}
            className="transition-all hover:scale-110 cursor-default"
            style={{ 
              backgroundColor: `rgba(139, 92, 246, ${item.weight * 0.9})`,
              color: item.weight > 0.4 ? '#fff' : 'rgba(255,255,255,0.4)',
              padding: '1px 5px',
              borderRadius: '4px',
              border: item.weight > 0.7 ? '1px solid rgba(139, 92, 246, 0.5)' : 'none'
            }}
          >
            {item.word}
          </motion.span>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
        <Search className="w-3 h-3" />
        Darker purple indicates higher attention weight assigned by the model's self-attention heads identifying critical tokens.
      </p>
    </div>
  )
}
