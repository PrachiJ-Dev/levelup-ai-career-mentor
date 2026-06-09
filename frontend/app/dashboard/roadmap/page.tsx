'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Loader2, BookOpen, Clock, ArrowRight, CheckCircle2, Sparkles, Trophy, ExternalLink } from 'lucide-react'
import { recommendRoadmap, toggleRoadmapPhase } from '@/lib/api'
import { Roadmap, Course } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

const PIPELINE_STEPS = [
   { id: 1, label: "Analyzing skill gaps and target role..." },
   { id: 2, label: "Curating expert-vetted course modules..." },
   { id: 3, label: "Prioritizing learning sequence..." },
   { id: 4, label: "Finalizing your personalized path..." },
]

export default function RoadmapPage() {
   const [loading, setLoading] = useState(false)
   const [currentStep, setCurrentStep] = useState(0)
   const [roadmap, setRoadmap] = useState<Roadmap | null>(null)

   useEffect(() => { fetchRoadmap() }, [])

   const fetchRoadmap = async () => {
      setLoading(true)
      const stepInterval = setInterval(() => {
         setCurrentStep(prev => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev))
      }, 1500)

      try {
         const { getDashboardStats } = await import('@/lib/api')
         const stats = await getDashboardStats()
         if (!stats.latest_gap_id) throw new Error('No skill gap found. Please run a skill gap analysis first.')
         const res = await recommendRoadmap(stats.latest_gap_id)
         clearInterval(stepInterval)
         setCurrentStep(4)
         const totalHours = res.recommended_courses.reduce((acc: number, c: Course) => acc + (c.estimated_hours || 0), 0)
         setRoadmap({ ...res, total_hours: totalHours } as any)
      } catch (err: any) {
         clearInterval(stepInterval)
         toast.error(err.message || 'Failed to load roadmap')
      } finally {
         setLoading(false)
      }
   }

   const toggleCompletion = async (index: number) => {
      if (!roadmap) return
      const newRoadmap = { ...roadmap }
      const course = newRoadmap.recommended_courses[index]
      const newStatus = !course.is_completed
      course.is_completed = newStatus
      setRoadmap(newRoadmap)
      try {
         await toggleRoadmapPhase(roadmap.id, index)
         toast.success(newStatus ? 'Module marked as complete!' : 'Module marked as incomplete', {
            icon: newStatus ? '✅' : '🔄',
            style: { background: '#111118', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
         })
      } catch (err) {
         course.is_completed = !newStatus
         setRoadmap({ ...newRoadmap })
         toast.error('Failed to sync with server')
      }
   }

   const completedCount = roadmap?.recommended_courses.filter(c => c.is_completed).length || 0
   const totalCount = roadmap?.recommended_courses.length || 0
   const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

   return (
      <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box', paddingBottom: '120px' }}>

         {/* Header */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <div>
                  <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                     <Map style={{ width: '32px', height: '32px', color: '#22D3EE' }} />
                     Learning Roadmap
                  </h1>
                  <p style={{ color: '#94A3B8', marginTop: '8px', fontSize: '15px' }}>
                     Your personalized AI-optimized learning path for the{' '}
                     <span style={{ color: '#22D3EE', fontWeight: 700 }}>{roadmap?.target_role || 'your target role'}</span>
                  </p>
               </div>
               <button onClick={fetchRoadmap} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94A3B8', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Regenerate Path
               </button>
            </div>
         </motion.div>

         <AnimatePresence mode="wait">
            {loading ? (
               <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', borderRadius: '16px', border: '1px solid rgba(34,211,238,0.2)', background: 'rgba(34,211,238,0.03)' }}
               >
                  <div style={{ position: 'relative', marginBottom: '24px' }}>
                     <Loader2 style={{ width: '48px', height: '48px', color: '#22D3EE', animation: 'spin 1s linear infinite' }} />
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>Generating Your Path...</h2>
                  <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     {PIPELINE_STEPS.map((step, idx) => {
                        const isActive = idx === currentStep
                        const isPast = idx < currentStep
                        return (
                           <div key={step.id} style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px',
                              border: `1px solid ${isActive ? 'rgba(34,211,238,0.3)' : isPast ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                              background: isActive ? 'rgba(34,211,238,0.08)' : isPast ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.2)',
                              transition: 'all 0.3s ease',
                           }}>
                              {isPast
                                 ? <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                                 : isActive
                                    ? <Loader2 style={{ width: '16px', height: '16px', color: '#22D3EE', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                                    : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #334155', flexShrink: 0 }} />
                              }
                              <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#67E8F9' : isPast ? '#34D399' : '#475569' }}>
                                 {step.label}
                              </span>
                           </div>
                        )
                     })}
                  </div>
               </motion.div>
            ) : roadmap ? (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* Summary Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '20px' }}>
                     <div className="glass-card" style={{ padding: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                           <Sparkles style={{ width: '16px', height: '16px', color: '#FBBF24' }} />
                           <span style={{ fontSize: '11px', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Pathway Strategy</span>
                        </div>
                        <p style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '24px' }}>
                           "This roadmap prioritizes foundational skills like <span style={{ color: '#22D3EE', fontWeight: 700 }}>{roadmap.recommended_courses[0]?.skill_covered}</span> before moving into specialized modules. Each course was chosen for high practical application."
                        </p>
                        <div style={{ display: 'flex', gap: '24px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <Clock style={{ width: '18px', height: '18px', color: '#22D3EE' }} />
                              </div>
                              <div>
                                 <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estimated Time</div>
                                 <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{(roadmap as any).total_hours} Hours</div>
                              </div>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <BookOpen style={{ width: '18px', height: '18px', color: '#8B5CF6' }} />
                              </div>
                              <div>
                                 <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Modules</div>
                                 <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{roadmap.recommended_courses.length} Modules</div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                           <Trophy style={{ width: '32px', height: '32px', color: '#10B981' }} />
                        </div>
                        <div style={{ fontSize: '40px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{completedCount}/{totalCount}</div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '8px' }}>Modules Completed</div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden', marginTop: '16px' }}>
                           <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                              style={{ height: '100%', background: '#10B981', borderRadius: '100px' }} />
                        </div>
                     </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ position: 'relative', paddingTop: '16px' }}>
                     {/* Center line */}
                     <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, rgba(34,211,238,0.3), rgba(139,92,246,0.3), rgba(16,185,129,0.3))', transform: 'translateX(-50%)', borderRadius: '2px' }} />

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {roadmap.recommended_courses.map((course: Course, idx: number) => {
                           const isEven = idx % 2 === 0
                           const diffColor = course.difficulty?.toLowerCase().includes('advanced')
                              ? { color: '#FB7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)' }
                              : course.difficulty?.toLowerCase().includes('intermediate')
                                 ? { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' }
                                 : { color: '#34D399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' }

                           return (
                              <motion.div
                                 key={idx}
                                 initial={{ opacity: 0, y: 30 }}
                                 whileInView={{ opacity: 1, y: 0 }}
                                 viewport={{ once: true }}
                                 style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '0', alignItems: 'center' }}
                              >
                                 {/* Left side */}
                                 {isEven ? (
                                    <div className="glass-card" style={{
                                       padding: '24px', marginRight: '16px',
                                       border: course.is_completed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                                       background: course.is_completed ? 'rgba(16,185,129,0.03)' : 'rgba(0,0,0,0.3)',
                                    }}>
                                       <CourseCard course={course} idx={idx} diffColor={diffColor} onToggle={() => toggleCompletion(idx)} />
                                    </div>
                                 ) : <div />}

                                 {/* Center node */}
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                                    <div style={{
                                       width: '48px', height: '48px', borderRadius: '50%',
                                       background: course.is_completed ? '#10B981' : '#111118',
                                       border: `3px solid ${course.is_completed ? '#10B981' : '#1e293b'}`,
                                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                                       boxShadow: '0 0 0 4px #0A0A0F',
                                    }}>
                                       {course.is_completed
                                          ? <CheckCircle2 style={{ width: '24px', height: '24px', color: '#fff' }} />
                                          : <span style={{ fontSize: '16px', fontWeight: 800, color: '#475569' }}>{idx + 1}</span>
                                       }
                                    </div>
                                 </div>

                                 {/* Right side */}
                                 {!isEven ? (
                                    <div className="glass-card" style={{
                                       padding: '24px', marginLeft: '16px',
                                       border: course.is_completed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                                       background: course.is_completed ? 'rgba(16,185,129,0.03)' : 'rgba(0,0,0,0.3)',
                                    }}>
                                       <CourseCard course={course} idx={idx} diffColor={diffColor} onToggle={() => toggleCompletion(idx)} />
                                    </div>
                                 ) : <div />}
                              </motion.div>
                           )
                        })}
                     </div>
                  </div>

               </motion.div>
            ) : null}
         </AnimatePresence>

         {/* Bottom Progress Bar */}
         {roadmap && (
            <motion.div
               initial={{ y: 100 }} animate={{ y: 0 }}
               style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: 'calc(100% - 320px)', maxWidth: '600px' }}
            >
               <div style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Roadmap Progress</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>{Math.round(progressPercent)}%</span>
                     </div>
                     <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
                           style={{ height: '100%', background: 'linear-gradient(90deg, #22D3EE, #10B981)', borderRadius: '100px' }} />
                     </div>
                  </div>
                  <Link href="/dashboard/interview" className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                     Test Your Skills
                  </Link>
               </div>
            </motion.div>
         )}
      </div>
   )
}

// Extracted card component
function CourseCard({ course, idx, diffColor, onToggle }: {
   course: Course, idx: number,
   diffColor: { color: string, bg: string, border: string },
   onToggle: () => void
}) {
   return (
      <>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#22D3EE', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '4px 10px', background: 'rgba(34,211,238,0.1)', borderRadius: '100px', border: '1px solid rgba(34,211,238,0.2)' }}>
               Phase {idx + 1}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock style={{ width: '12px', height: '12px' }} /> {course.estimated_hours}h
               </span>
               <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', color: diffColor.color, background: diffColor.bg, border: `1px solid ${diffColor.border}` }}>
                  {course.difficulty}
               </span>
            </div>
         </div>

         <h3 style={{ fontSize: '18px', fontWeight: 700, color: course.is_completed ? '#475569' : '#fff', marginBottom: '8px', lineHeight: 1.3, textDecoration: course.is_completed ? 'line-through' : 'none' }}>
            {course.course_title || (course as any).title}
         </h3>

         <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '16px' }}>
            {course.why_important}
         </p>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '9px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Platform</div>
               <div style={{ fontSize: '13px', fontWeight: 600, color: '#CBD5E1' }}>{course.platform}</div>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '9px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Target Skill</div>
               <div style={{ fontSize: '13px', fontWeight: 600, color: '#CBD5E1' }}>{course.skill_covered}</div>
            </div>
         </div>

         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: course.is_completed ? '#10B981' : '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
               {course.is_completed
                  ? <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #334155' }} />
               }
               {course.is_completed ? 'Completed' : 'Mark as Complete'}
            </button>
            <Link href={course.url || '#'} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#22D3EE', textDecoration: 'none' }}>
               View Resource <ExternalLink style={{ width: '14px', height: '14px' }} />
            </Link>
         </div>
      </>
   )
}