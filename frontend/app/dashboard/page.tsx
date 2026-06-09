'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { FileText, Target, MessageSquare, GraduationCap, Zap, FileSearch, Users, Map } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getDashboardStats } from '@/lib/api'

function CountUp({ to, duration = 2, delay = 0, suffix = '' }: { to: number, duration?: number, delay?: number, suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest) + suffix)
  useEffect(() => {
    const controls = animate(count, to, { duration, delay, ease: "easeOut" })
    return controls.stop
  }, [count, to, duration, delay])
  return <motion.span>{rounded}</motion.span>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name?.split(' ')[0] || 'User'
  const [greeting, setGreeting] = useState('Good afternoon')
  const [stats, setStats] = useState({
    resumeScore: 0, skillMatch: 0, interviewsCount: 0,
    avgInterviewScore: 0, coursesCompleted: 0, totalCourses: 0,
    targetRole: '', skillsAway: 0
  })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    async function loadStats() {
      try {
        const data = await getDashboardStats()
        if (data) {
          setStats(prev => ({
            ...prev,
            resumeScore: data.resume_score || 0,
            skillMatch: data.skill_match || 0,
            interviewsCount: data.interviews_done || 0,
            avgInterviewScore: data.avg_interview_score || 0,
            coursesCompleted: data.courses_completed || 0,
            totalCourses: data.total_courses || 0,
            targetRole: data.target_role || '',
            skillsAway: data.missing_skills_count || 0
          }))
        }
      } catch (e) { console.error("Failed to load stats", e) }
    }
    loadStats()
  }, [])

  return (
    <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box' }}>

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          {greeting}, {userName} 👋
        </h1>
        <p style={{ color: '#94A3B8', marginTop: '8px', fontSize: '16px' }}>Here's your career progression overview.</p>
      </motion.div>

      {/* Row 1 — Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '48px' }}>

        {/* Resume Health */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resume Health</h3>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: stats.resumeScore > 70 ? 'rgba(16,185,129,0.1)' : stats.resumeScore > 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${stats.resumeScore > 70 ? 'rgba(16,185,129,0.2)' : stats.resumeScore > 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: stats.resumeScore > 70 ? '#10B981' : stats.resumeScore > 50 ? '#F59E0B' : '#EF4444'
            }}>
              <FileText style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <motion.circle cx="18" cy="18" r="16" fill="none"
                  stroke={stats.resumeScore > 70 ? '#10B981' : stats.resumeScore > 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="3" strokeLinecap="round"
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${stats.resumeScore}, 100` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#fff' }}>
                <CountUp to={stats.resumeScore} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: stats.resumeScore > 70 ? '#10B981' : stats.resumeScore > 50 ? '#F59E0B' : '#EF4444' }}>
                {stats.resumeScore > 70 ? 'Excellent' : stats.resumeScore > 50 ? 'Improving' : 'Needs Work'}
              </p>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Structure Score</p>
            </div>
          </div>
        </motion.div>

        {/* Job Readiness */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Job Readiness</h3>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <Target style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          {stats.targetRole ? (
            <>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                <CountUp to={stats.skillMatch} suffix="%" />
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 500 }}>For {stats.targetRole}</p>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{stats.skillsAway} skills away</p>
            </>
          ) : (
            <Link href="/dashboard/resume">
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#475569' }}>Analyze resume</div>
              <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>To see readiness →</p>
            </Link>
          )}
        </motion.div>

        {/* Interview Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Interview Score</h3>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
              <MessageSquare style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          {stats.interviewsCount > 0 ? (
            <>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                <CountUp to={stats.avgInterviewScore} suffix="%" />
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1' }}>Based on {stats.interviewsCount} sessions</p>
            </>
          ) : (
            <Link href="/dashboard/interview">
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#475569' }}>Start practicing</div>
              <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>No sessions yet →</p>
            </Link>
          )}
        </motion.div>

        {/* Learning Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Learning Progress</h3>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <GraduationCap style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
          {stats.totalCourses > 0 ? (
            <>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                {stats.coursesCompleted} <span style={{ fontSize: '18px', color: '#475569' }}>/ {stats.totalCourses}</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.coursesCompleted / stats.totalCourses) * 100}%` }}
                  style={{ height: '100%', background: '#F59E0B', borderRadius: '100px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>Roadmap completion</p>
            </>
          ) : (
            <Link href="/dashboard/roadmap">
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#475569' }}>View roadmap</div>
              <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Get your path →</p>
            </Link>
          )}
        </motion.div>

      </div>

      {/* Row 2 — Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>

        <Link href="/dashboard/resume" style={{ textDecoration: 'none' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="glass-card"
            style={{ padding: '28px', height: '100%', borderColor: 'rgba(59,130,246,0.2)', background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 100%)', cursor: 'pointer' }}
            whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(59,130,246,0.2)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <FileSearch style={{ width: '22px', height: '22px', color: '#3B82F6' }} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Analyze My Resume</h4>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px' }}>Upload your resume and get instant AI-powered skill extraction and health scoring.</p>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Upload Resume <Zap style={{ width: '14px', height: '14px' }} />
            </span>
          </motion.div>
        </Link>

        <Link href="/dashboard/interview" style={{ textDecoration: 'none' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="glass-card"
            style={{ padding: '28px', height: '100%', borderColor: 'rgba(139,92,246,0.2)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, transparent 100%)', cursor: 'pointer' }}
            whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(139,92,246,0.2)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Users style={{ width: '22px', height: '22px', color: '#8B5CF6' }} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Practice Interview</h4>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px' }}>Practice role-specific interview questions and get instant feedback and scoring.</p>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Start Interview <Zap style={{ width: '14px', height: '14px' }} />
            </span>
          </motion.div>
        </Link>

        <Link href="/dashboard/roadmap" style={{ textDecoration: 'none' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="glass-card"
            style={{ padding: '28px', height: '100%', borderColor: 'rgba(16,185,129,0.2)', background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, transparent 100%)', cursor: 'pointer' }}
            whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(16,185,129,0.2)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Map style={{ width: '22px', height: '22px', color: '#10B981' }} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>View Learning Path</h4>
            <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '20px' }}>Get a personalized course roadmap based on your skill gaps and target roles.</p>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              View Roadmap <Zap style={{ width: '14px', height: '14px' }} />
            </span>
          </motion.div>
        </Link>

      </div>
    </div>
  )
}