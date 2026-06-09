'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, ArrowRight, Zap, Target, Search, Database, CheckCircle2, AlertTriangle } from 'lucide-react'
import ResumeUploader from '@/components/resume/ResumeUploader'
import EntityHighlighter from '@/components/resume/EntityHighlighter'
import { Resume } from '@/types'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const steps = [
  { id: 1, title: 'Upload PDF', desc: 'Securely upload your resume', icon: FileText },
  { id: 2, title: 'AI Analysis', desc: 'Deep learning extracts entities', icon: Zap },
  { id: 3, title: 'Skills Mapping', desc: 'Benchmarked against tech roles', icon: Target },
]

export default function ResumePage() {
  const [resume, setResume] = useState<Resume | null>(null)

  const pieData = resume ? [
    { name: 'Score', value: resume.resume_score },
    { name: 'Gap', value: 100 - resume.resume_score }
  ] : []
  const COLORS = ['#3B82F6', '#1e1e2e']

  return (
    <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box', paddingBottom: '60px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
          <Database style={{ width: '32px', height: '32px', color: '#60A5FA' }} />
          Resume Analysis
        </h1>
        <p style={{ color: '#94A3B8', marginTop: '8px', fontSize: '15px', maxWidth: '600px', lineHeight: 1.6 }}>
          Establish your career baseline. Our AI model parses your resume to identify existing skills and map them to your target industry roles.
        </p>
      </motion.div>

      {!resume ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {steps.map((step) => (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '20px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <step.icon style={{ width: '20px', height: '20px', color: '#60A5FA' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#E2E8F0' }}>Step {step.id}: {step.title}</h3>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Zone */}
          <div style={{ borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', padding: '40px' }}>
            <ResumeUploader onSuccess={setResume} />
          </div>

        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Main Results Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

            {/* Left: Entity Highlights */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search style={{ width: '18px', height: '18px', color: '#60A5FA' }} />
                    What We Found
                  </h2>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    Extracted from <span style={{ fontFamily: 'monospace', color: '#93C5FD' }}>{resume.original_filename}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <CheckCircle2 style={{ width: '12px', height: '12px' }} /> AI Analysis Complete
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', minHeight: '400px' }}>
                <EntityHighlighter entities={resume.entities} />
              </div>
            </div>

            {/* Right: Score */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Resume Score</h2>

                <div style={{ width: '220px', height: '220px', position: 'relative', marginBottom: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                        paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '52px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{Math.round(resume.resume_score)}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Overall Health</span>
                  </div>
                </div>

                <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#CBD5E1' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                    {resume.entities.skills?.length || 0} skills detected
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#CBD5E1' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                    Education history verified
                  </div>
                  {(!resume.entities.certifications || resume.entities.certifications.length === 0) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#FBBF24' }}>
                      <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                      No certifications identified
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#CBD5E1' }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                      {resume.entities.certifications.length} certifications found
                    </div>
                  )}
                </div>

                <Link href="/dashboard/skill-gap" className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '14px 24px', justifyContent: 'center', fontSize: '14px', fontWeight: 700, borderRadius: '12px' }}>
                  Proceed to Skill Gap Analysis <ArrowRight style={{ width: '16px', height: '16px' }} />
                </Link>
              </div>

              {/* Category Stats */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px' }}>Extracted Categories</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Skills', value: resume.entities.skills?.length || 0 },
                    { label: 'Roles', value: resume.entities.job_titles?.length || 0 },
                    { label: 'Education', value: resume.entities.education?.length || 0 },
                    { label: 'Certs', value: resume.entities.certifications?.length || 0 },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>{item.label}</p>
                      <p style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  )
}