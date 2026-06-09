'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Loader2, CheckCircle2, XCircle, ArrowRight, Code, Database, BrainCircuit, Layout, Server, Cloud, Cpu, LineChart as LineChartIcon, ShieldCheck, AlertTriangle } from 'lucide-react'
import { predictSkillGap } from '@/lib/api'
import SkillRadarChart from '@/components/charts/SkillRadarChart'
import { SkillGap } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

const roleOptions = [
  { id: 'frontend', name: 'Frontend Developer', icon: Layout, color: '#F472B6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)' },
  { id: 'backend', name: 'Backend Engineer', icon: Server, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
  { id: 'fullstack', name: 'Full Stack Developer', icon: Code, color: '#C084FC', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)' },
  { id: 'data', name: 'Data Scientist', icon: LineChartIcon, color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
  { id: 'ml', name: 'Machine Learning Engineer', icon: BrainCircuit, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
  { id: 'devops', name: 'DevOps Engineer', icon: Cloud, color: '#22D3EE', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)' },
  { id: 'dba', name: 'Database Admin', icon: Database, color: '#FB7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.2)' },
  { id: 'systems', name: 'Systems Architect', icon: Cpu, color: '#818CF8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)' },
]

export default function SkillGapPage() {
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SkillGap | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)

  useEffect(() => {
    import('@/lib/api').then(({ getDashboardStats }) => {
      getDashboardStats().then(stats => {
        if (stats.latest_resume_id) setResumeId(stats.latest_resume_id)
      }).catch(console.error)
    })
  }, [])

  const handleAnalyze = async (roleName: string) => {
    if (!resumeId) { toast.error('Please upload your resume first!'); return }
    setTargetRole(roleName)
    setLoading(true)
    try {
      const res = await predictSkillGap(resumeId, roleName)
      setResult(res)
      toast.success('Analysis complete')
    } catch (e) {
      toast.error('Analysis failed. Ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
          <Target style={{ width: '32px', height: '32px', color: '#FB7185' }} />
          Skill Gap Analysis
        </h1>
        <p style={{ color: '#94A3B8', marginTop: '8px', fontSize: '15px', maxWidth: '600px', lineHeight: 1.6 }}>
          Identify skills you need for your dream role. Our neural network compares your profile against industry benchmarks.
        </p>
      </motion.div>

      {/* Role Selection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Select Target Role</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {roleOptions.map((role) => {
            const Icon = role.icon
            const isSelected = targetRole === role.name
            return (
              <button
                key={role.id}
                onClick={() => handleAnalyze(role.name)}
                disabled={loading}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `1px solid ${isSelected ? '#3B82F6' : 'rgba(255,255,255,0.07)'}`,
                  background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  outline: 'none',
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: role.bg, border: `1px solid ${role.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon style={{ width: '20px', height: '20px', color: role.color }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0', lineHeight: 1.3 }}>{role.name}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Loading */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', borderRadius: '16px', border: '1px solid rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.03)' }}
          >
            <Loader2 style={{ width: '48px', height: '48px', color: '#FB7185', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginTop: '20px' }}>Analyzing Skill Gaps...</p>
            <p style={{ color: '#475569', marginTop: '8px' }}>Computing match vectors for {targetRole}</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Score Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Your Match Score</h2>
                <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: 1.6, marginBottom: '20px' }}>
                  Mapped your profile against {result.current_skills.length + result.missing_skills.length} core requirements for{' '}
                  <span style={{ color: '#60A5FA', fontWeight: 700 }}>{targetRole}</span>
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 style={{ width: '14px', height: '14px' }} /> {result.current_skills.length} Skills Found
                  </div>
                  <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)', color: '#FB7185', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle style={{ width: '14px', height: '14px' }} /> {result.missing_skills.length} Gaps
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '32px', border: '1px solid rgba(251,113,133,0.3)', background: 'rgba(251,113,133,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#FB7185', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Match Score</span>
                <div style={{ fontSize: '72px', fontWeight: 900, color: '#fff', lineHeight: 1, marginTop: '8px' }}>
                  {Math.round(result.match_score)}<span style={{ fontSize: '32px', color: '#475569' }}>%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden', marginTop: '16px' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.match_score}%` }} transition={{ duration: 1, delay: 0.3 }}
                    style={{ height: '100%', background: '#FB7185', borderRadius: '100px' }} />
                </div>
              </div>
            </div>

            {/* Chart + Missing Skills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target style={{ width: '20px', height: '20px', color: '#60A5FA' }} /> Skills Comparison
                </h3>
                <SkillRadarChart
                  currentSkills={result.current_skills}
                  requiredSkills={[...result.current_skills, ...result.missing_skills]}
                />
              </div>

              <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(251,113,133,0.1)', background: 'rgba(251,113,133,0.03)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px', color: '#FB7185' }} /> Priority Gaps
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.missing_skills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <ShieldCheck style={{ width: '40px', height: '40px', color: '#10B981', margin: '0 auto 12px' }} />
                      <p style={{ color: '#10B981', fontWeight: 700 }}>No gaps found!</p>
                    </div>
                  ) : result.missing_skills.map((skill, i) => (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>{skill}</span>
                      <span style={{
                        fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: i < 2 ? 'rgba(251,113,133,0.15)' : 'rgba(251,191,36,0.15)',
                        color: i < 2 ? '#FB7185' : '#FBBF24',
                        border: `1px solid ${i < 2 ? 'rgba(251,113,133,0.3)' : 'rgba(251,191,36,0.3)'}`,
                      }}>
                        {i < 2 ? 'Critical' : 'Important'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current vs Required */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 style={{ width: '18px', height: '18px' }} /> Your Current Skills
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', padding: '4px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {result.current_skills.length} skills
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {result.current_skills.map(s => (
                    <span key={s} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, background: 'rgba(52,211,153,0.1)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.2)' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target style={{ width: '18px', height: '18px' }} /> Needed for {targetRole}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', padding: '4px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {result.current_skills.length + result.missing_skills.length} required
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[...result.current_skills, ...result.missing_skills].map(s => (
                    <span key={s} style={{
                      padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
                      background: result.missing_skills.includes(s) ? 'rgba(251,113,133,0.1)' : 'rgba(100,116,139,0.15)',
                      color: result.missing_skills.includes(s) ? '#FDA4AF' : '#94A3B8',
                      border: `1px solid ${result.missing_skills.includes(s) ? 'rgba(251,113,133,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                      {s}{result.missing_skills.includes(s) ? ' ✗' : ' ✓'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '8px' }}>
              <Link href="/dashboard/roadmap" className="btn-secondary" style={{ padding: '16px 32px', fontSize: '15px', justifyContent: 'center', fontWeight: 700 }}>
                Generate Roadmap
              </Link>
              <Link href={`/dashboard/interview?role=${encodeURIComponent(targetRole)}`} className="btn-primary" style={{ padding: '16px 32px', fontSize: '15px', justifyContent: 'center', fontWeight: 700 }}>
                Prep for Interview <ArrowRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}