'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Brain, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const floatingBadges = [
  "Build Learning Paths",
  "Mock Interviews",
  "Identify Skill Gaps",
  "Predict Career Trajectory"
]

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await res.json()

      if (res.ok) {
        toast.success('Registration successful! Redirecting...', {
          style: { background: '#111118', color: '#fff', border: '1px solid rgba(16,185,129,0.4)' },
        })
        sessionStorage.setItem('registeredEmail', email)
        sessionStorage.setItem('registeredPassword', password)
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        toast.error(data.detail || 'Registration failed', {
          style: { background: '#111118', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
        })
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.', {
          style: { background: '#111118', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
        })
      } else {
        toast.error('Network error. Is the backend running?', {
          style: { background: '#111118', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-[#0A0A0F]">
      {/* Left Panel: Brand & Animations */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-center items-center bg-gradient-to-b from-[#0A0A0F] to-[#1a1a2e] border-r border-white/10">
        <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8"
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-extrabold tracking-tight mb-4"
          >
            LevelUp
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-slate-400 max-w-md"
          >
            Your AI-Powered Career Co-Pilot.
          </motion.p>

          <div className="mt-16 flex flex-col gap-4 relative h-64 w-full max-w-xs">
            {floatingBadges.map((badge, i) => (
              <motion.div
                key={badge}
                animate={{ 
                  y: [0, -10, 0], 
                  x: [0, i % 2 === 0 ? 5 : -5, 0] 
                }}
                transition={{ 
                  duration: 4 + i, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: i * 0.5 
                }}
                className="absolute w-full"
                style={{ top: `${i * 60}px`, left: i % 2 === 0 ? '10px' : '-10px' }}
              >
                <div className="glass-card py-3 px-6 text-sm font-medium text-purple-200 border border-purple-500/20 text-center shadow-lg backdrop-blur-md">
                  {badge}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay" />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">LevelUp</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2">Create an Account</h2>
            <p className="text-slate-400">Join LevelUp to accelerate your career</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field w-full bg-[#1a1a2e] border-white/10 focus:bg-[#1a1a2e]"
                  placeholder="John Doe"
                  required
                />
                <User className="input-icon" size={16} />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                Email
              </label>
              <div className="relative">
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full bg-[#1a1a2e] border-white/10 focus:bg-[#1a1a2e]"
                  placeholder="you@example.com"
                  required
                />
                <Mail className="input-icon" size={16} />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full bg-[#1a1a2e] border-white/10 focus:bg-[#1a1a2e]"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Lock className="input-icon" size={16} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-6 py-3 rounded-xl text-base shadow-blue-500/25 shadow-xl hover:shadow-blue-500/40"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign Up <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
            
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>
            
            <button 
              type="button"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium text-slate-200"
              onClick={() => toast('Google OAuth disabled in demo mode', { icon: 'ℹ️' })}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
