'use client'

import { Variants, motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, FileText, Target, TrendingUp, Code, ArrowRight, Sparkles } from 'lucide-react'

export default function LandingPage() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  }

  const features = [
    {
      icon: FileText,
      title: 'Resume NLP',
      desc: 'DistilBERT extracts skills, roles, and experience from your uploaded PDF.',
      color: '#60A5FA',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.2)',
    },
    {
      icon: Target,
      title: 'Skill Gap DNN',
      desc: 'PyTorch deep neural network pinpoints exactly what you need for your target role.',
      color: '#FB7185',
      bg: 'rgba(244,63,94,0.1)',
      border: 'rgba(244,63,94,0.2)',
    },
    {
      icon: Brain,
      title: 'Mock Interviews',
      desc: 'GPT-2 questions with BERT sentence similarity scoring your answers in real-time.',
      color: '#C084FC',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.2)',
    },
    {
      icon: TrendingUp,
      title: 'Career Trajectory',
      desc: 'LSTM sequence model predicts your next optimal career move from your history.',
      color: '#34D399',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Background Glows ─────────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'rgba(59,130,246,0.12)', filter: 'blur(140px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '40%', right: '-10%', width: '50%', height: '50%', background: 'rgba(139,92,246,0.12)', filter: 'blur(140px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div className="dot-grid" style={{ position: 'fixed', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)',
        background: 'rgba(10,10,15,0.7)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Brain style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>LevelUp</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" className="btn-secondary" style={{ fontSize: 14, padding: '8px 20px' }}>Sign In</Link>
            <Link href="/register" className="btn-primary" style={{ fontSize: 14, padding: '8px 20px' }}>
              Get Started <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px 100px', textAlign: 'center' }}>
          <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <motion.div variants={item} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 100,
              border: '1px solid rgba(59,130,246,0.3)',
              background: 'rgba(59,130,246,0.08)',
              marginBottom: 32,
            }}>
              <Sparkles style={{ width: 14, height: 14, color: '#60A5FA' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#93C5FD' }}>Powered by PyTorch &amp; Transformer Models</span>
            </motion.div>

            <motion.h1 variants={item} style={{
              fontSize: 'clamp(40px, 7vw, 72px)',
              fontWeight: 800, lineHeight: 1.1,
              letterSpacing: '-0.03em', marginBottom: 24,
            }}>
              Accelerate your career
              <br />
              <span className="gradient-text glow-pulse">with AI precision.</span>
            </motion.h1>

            <motion.p variants={item} style={{
              fontSize: 18, color: 'var(--text-secondary)',
              maxWidth: 560, lineHeight: 1.7, marginBottom: 40,
            }}>
              LevelUp analyzes your resume with deep learning, identifies skill gaps,
              generates targeted roadmaps, and prepares you with AI-simulated mock interviews.
            </motion.p>

            <motion.div variants={item} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/register" className="btn-primary" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }}>
                Start Free Trial <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link href="/login" className="btn-secondary" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }}>
                <Code style={{ width: 18, height: 18 }} />
                Try Demo
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: 14 }}>
              Deep Learning Features
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              A full-stack, end-to-end AI mentor built around state-of-the-art NLP and sequence models.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="glass-card"
                style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'default' }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: feature.bg,
                  border: `1px solid ${feature.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  color: feature.color,
                }}>
                  <feature.icon style={{ width: 22, height: 22 }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ───────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, marginBottom: 16 }}>
              Ready to level up your career?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
              Join thousands of engineers accelerating their growth with AI-powered mentoring.
            </p>
            <Link href="/register" className="btn-primary" style={{ fontSize: 16, padding: '14px 36px', borderRadius: 12 }}>
              Get Started Free <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
