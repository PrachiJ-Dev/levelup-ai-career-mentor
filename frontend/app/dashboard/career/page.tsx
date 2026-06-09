'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, AlertTriangle, Network, History, ArrowRight, Activity, Zap } from 'lucide-react'
import { predictCareer } from '@/lib/api'
import { CareerHistory } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CareerPage() {
  const [loading, setLoading] = useState(false)
  const [careerResult, setCareerResult] = useState<CareerHistory | null>(null)
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    setLoading(true)
    const userId = (session.user as any).id || (session.user as any).sub || session.user.email
    predictCareer(userId, [])
      .then(res => setCareerResult(res))
      .catch((err) => {
        console.error('Career prediction error:', err)
        toast.error('Failed to predict career trajectory')
      })
      .finally(() => setLoading(false))
  }, [session, status])

  const chartData = careerResult ? [
    { sequence: 'T-2 (Past)', confidence: 20 },
    { sequence: 'T-1 (Past)', confidence: 45 },
    { sequence: 'T=0 (Current)', confidence: 65 },
    { sequence: `T+1 (${careerResult.predicted_roles[0]})`, confidence: Math.round(careerResult.confidence_scores[0] * 100) },
    { sequence: `T+2 (${careerResult.predicted_roles[1]})`, confidence: Math.round(careerResult.confidence_scores[1] * 100) }
  ] : []

  return (
    <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box', paddingBottom: '48px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <TrendingUp style={{ width: '32px', height: '32px', color: '#34D399' }} />
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Career Trajectory</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Network style={{ width: '12px', height: '12px' }} /> LSTM Sequence Active
          </span>
          <p style={{ color: '#94A3B8', fontSize: '15px', maxWidth: '500px', lineHeight: 1.6 }}>
            We use Long Short-Term Memory networks to analyze your career history sequentially and predict your most probable next roles.
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', color: '#34D399' }}
          >
            <Activity style={{ width: '48px', height: '48px', marginBottom: '24px', animation: 'pulse 2s infinite' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Crunching time-series sequences...</h3>
            <p style={{ color: '#475569' }}>LSTM is computing probabilities for your next career move</p>
          </motion.div>
        ) : !careerResult || careerResult.predicted_roles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', textAlign: 'center' }}
          >
            <TrendingUp style={{ width: '64px', height: '64px', color: '#334155', marginBottom: '24px' }} />
            <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Clean Slate</h3>
            <p style={{ color: '#475569', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.6 }}>
              Analyze your resume and perform a few interview sessions to generate your AI-powered career trajectory.
            </p>
            <Link href="/dashboard/resume" className="btn-primary" style={{ padding: '12px 32px', fontSize: '14px', fontWeight: 700, borderRadius: '12px' }}>
              Analyze Resume
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>

              {/* Left: Predictions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap style={{ width: '18px', height: '18px', color: '#34D399' }} />
                  Top Predictions
                </h2>

                {careerResult.predicted_roles.map((role, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      border: idx === 0 ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.07)',
                      background: idx === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {idx === 0 && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: 'rgba(16,185,129,0.2)', borderBottom: '1px solid rgba(16,185,129,0.3)', borderLeft: '1px solid rgba(16,185,129,0.3)',
                        color: '#34D399', fontSize: '9px', fontWeight: 800, padding: '6px 10px',
                        textTransform: 'uppercase', letterSpacing: '0.1em'
                      }}>
                        Most Probable
                      </div>
                    )}

                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: idx === 0 ? '#E0FDF4' : '#E2E8F0', marginBottom: '12px', paddingRight: '80px', lineHeight: 1.3 }}>
                      {role}
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>LSTM Confidence</span>
                      <span style={{ color: idx === 0 ? '#34D399' : '#CBD5E1', fontWeight: 700 }}>
                        {Math.round(careerResult.confidence_scores[idx] * 100)}%
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${careerResult.confidence_scores[idx] * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 + (idx * 0.1) }}
                        style={{
                          height: '100%',
                          borderRadius: '100px',
                          background: idx === 0 ? 'linear-gradient(90deg, #34D399, #14B8A6)' : '#64748B',
                        }}
                      />
                    </div>

                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <button style={{ fontSize: '12px', fontWeight: 600, color: idx === 0 ? '#34D399' : '#475569', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Target this role <ArrowRight style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right: Chart + Insight */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History style={{ width: '18px', height: '18px', color: '#60A5FA' }} />
                  Probability Progression Map
                </h2>

                {/* Chart */}
                <div className="glass-card" style={{
                  padding: '20px',
                  border: '1px solid rgba(59,130,246,0.2)',
                  background: 'rgba(0,0,0,0.3)',
                  position: 'relative',
                  height: '320px',
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                      <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="sequence" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={8} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(17,17,24,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px' }}
                        itemStyle={{ color: '#10B981', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="confidence" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorConfidence)" animationDuration={1200} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Insight */}
                <div className="glass-card" style={{
                  padding: '20px',
                  border: '1px solid rgba(251,191,36,0.3)',
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, transparent 100%)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <AlertTriangle style={{ width: '20px', height: '20px', color: '#FBBF24' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FBBF24', marginBottom: '8px' }}>LSTM Model Insight</h3>
                    <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.6 }}>
                      Based on your sequential progression pattern, the LSTM model predicts that pursuing{' '}
                      <strong style={{ color: '#fff' }}>{careerResult.predicted_roles[0]}</strong> maximizes your skill overlap. However, diving directly into{' '}
                      <strong style={{ color: '#fff' }}>{careerResult.predicted_roles[1]}</strong> has significant probability if you focus on your missing AI engineering skills over the next 6 months.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Link href="/dashboard" className="btn-primary" style={{ padding: '14px 28px', fontSize: '14px', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Return to Dashboard <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}