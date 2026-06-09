'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getInterviewQuestions, evaluateAnswer } from '@/lib/api'
import { Loader2, CheckCircle2, AlertCircle, Bot, User, Play, Save, History, BarChart3, MessageSquare, Target, Trophy, Clock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// Remove hardcoded historyData as we fetch from backend

export default function InterviewSession() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') || 'Machine Learning Engineer'
  const [role, setRole] = useState(initialRole)
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  
  // Session states
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [isCustomCount, setIsCustomCount] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)

  useEffect(() => {
    import('@/lib/api').then(({ getInterviewHistory }) => {
      getInterviewHistory().then(setHistory).catch(console.error)
    })
  }, [])

  const handleStart = async () => {
    setLoading(true)
    try {
      const q = await getInterviewQuestions(role, difficulty, questionCount)
      setQuestions(q)
      setFeedbacks([])
      setIsStarted(true)
      setIsFinished(false)
      setCurrentIndex(0)
    } catch {
      toast.error('Failed to generate interview questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!currentAnswer.trim()) return toast.error('Please provide an answer')
    setIsEvaluating(true)
    try {
      const res = await evaluateAnswer(questions[currentIndex], currentAnswer, role)
      const newFeedback = { ...res, answer: currentAnswer, question: questions[currentIndex] }
      setFeedbacks([...feedbacks, newFeedback])
    } catch {
      toast.error('AI evaluation failed')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleNext = async () => {
    setCurrentAnswer('')
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1)
    } else {
      setIsFinished(true)
      const avgScore = Math.round(feedbacks.reduce((acc, curr) => acc + curr.score, 0) / feedbacks.length)
      
      // Save session to backend
      try {
        const { saveInterview } = await import('@/lib/api')
        await saveInterview({
          user_id: 'demo_user_123',
          role: role,
          difficulty: difficulty,
          questions: feedbacks,
          overall_score: avgScore
        })
        toast.success('Interview Session Saved!')
        
        // Refresh history
        const { getInterviewHistory } = await import('@/lib/api')
        const newHistory = await getInterviewHistory()
        setHistory(newHistory)
      } catch (e) {
        console.error('Failed to save interview:', e)
      }
    }
  }

  const getAverageScore = () => {
    if (feedbacks.length === 0) return 0
    return Math.round(feedbacks.reduce((acc, curr) => acc + curr.score, 0) / feedbacks.length)
  }

  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'A+', color: 'text-emerald-400', desc: 'Expert' }
    if (score >= 80) return { label: 'A', color: 'text-blue-400', desc: 'Professional' }
    if (score >= 70) return { label: 'B', color: 'text-cyan-400', desc: 'Competent' }
    if (score >= 60) return { label: 'C', color: 'text-amber-400', desc: 'Improving' }
    if (score >= 45) return { label: 'D', color: 'text-orange-400', desc: 'Foundational' }
    return { label: 'F', color: 'text-rose-400', desc: 'Learning' }
  }

  if (isFinished) {
    const avgScore = getAverageScore()
    const grade = getGrade(avgScore)
    const pieData = [{ name: 'Score', value: avgScore }, { name: 'Gap', value: 100 - avgScore }]
    const COLORS = ['#8B5CF6', '#1e1e2e']

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
        <div className="glass-card p-10 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-[#0A0A0F] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Trophy className="w-40 h-40 text-purple-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                   <h2 className="text-4xl font-black text-white">Interview Summary</h2>
                   <p className="text-slate-400">{role} • {difficulty} Difficulty</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400">Questions Answered</span>
                    <span className="text-white font-bold">{questions.length} / {questions.length}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400">Time per Answer (Avg)</span>
                    <span className="text-white font-bold">1.5 mins</span>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setIsStarted(false)} className="btn-secondary px-8 py-4 text-lg">Practice Again</button>
                 <Link href="/dashboard/roadmap" className="btn-primary px-8 py-4 text-lg shadow-purple-500/20 shadow-xl">View Roadmap</Link>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-7xl font-black ${grade.color}`}>{grade.label}</span>
                  <span className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">{avgScore}% Accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="glass-card p-8 border-slate-800">
           <h3 className="text-xl font-bold text-white mb-6">Question Breakdown</h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-slate-800 text-xs font-black text-slate-500 uppercase tracking-widest">
                       <th className="pb-4 pr-4">#</th>
                       <th className="pb-4">Question</th>
                       <th className="pb-4 text-center">Score</th>
                       <th className="pb-4 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                    {feedbacks.map((f, i) => (
                       <tr key={i} className="text-sm group">
                          <td className="py-6 pr-4 text-slate-500 font-bold">{i + 1}</td>
                          <td className="py-6 text-slate-300 max-w-md">
                             <p className="line-clamp-2 group-hover:line-clamp-none transition-all">{f.question}</p>
                          </td>
                          <td className="py-6 text-center">
                             <span className={`font-black text-lg ${getGrade(f.score).color}`}>{f.score}</span>
                          </td>
                          <td className="py-6 text-right">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                f.score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                             }`}>
                                {f.score >= 70 ? 'Passed' : 'Review'}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </motion.div>
    )
  }

  if (!isStarted) {
    return (
      <div className="space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-10 border-slate-800 bg-[#111118]">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-blue-400"/>
             </div>
             <div>
                <h2 className="text-2xl font-bold text-white">Interview Configuration</h2>
                <p className="text-slate-500 text-sm">Configure your session and initialize AI models.</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Target Role</label>
                <div className="relative">
                   <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                   <input 
                    value={role} 
                    onChange={e => setRole(e.target.value)} 
                    className="input-field w-full pl-12 py-4 text-lg border-slate-800 bg-black/40"
                    placeholder="e.g. Data Scientist"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Questions Count</label>
                <div className="grid grid-cols-4 gap-3">
                  {[5, 10, 15].map((count) => (
                    <button
                      key={count}
                      onClick={() => { setQuestionCount(count); setIsCustomCount(false); }}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                        (!isCustomCount && questionCount === count)
                          ? 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'bg-white/5 border-slate-800 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustomCount(true)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                      isCustomCount
                        ? 'bg-purple-500 border-purple-600 text-white shadow-lg shadow-purple-500/20' 
                        : 'bg-white/5 border-slate-800 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {isCustomCount && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                    <input 
                      type="number" 
                      min="1" 
                      max="20" 
                      value={questionCount} 
                      onChange={e => setQuestionCount(Number(e.target.value))}
                      className="input-field w-full py-3 px-4 border-purple-500/30 bg-purple-500/5 text-center font-bold"
                      placeholder="Enter count (1-20)"
                    />
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`py-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                        difficulty === lvl 
                          ? 'bg-purple-500 border-purple-600 text-white shadow-lg shadow-purple-500/20' 
                          : 'bg-white/5 border-slate-800 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                 <div className="flex gap-3">
                    <Bot className="w-5 h-5 text-blue-400 shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                       Our Generative Model will now prepare <span className="text-blue-400 font-bold">{questionCount} questions</span> specifically for a <span className="text-blue-400 font-bold">{role}</span> profile at <span className="text-blue-400 font-bold">{difficulty} difficulty</span>.
                    </p>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 flex justify-end pt-8 border-t border-slate-800">
            <button onClick={handleStart} disabled={loading} className="btn-primary py-5 px-10 text-lg rounded-2xl shadow-blue-500/25 shadow-2xl hover:scale-[1.02] transition-transform">
              {loading ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Initializing Models...</> : 'Start Practice Session'}
            </button>
          </div>
        </motion.div>

        {/* History Section - Graph removed as requested */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                 <History className="w-6 h-6 text-slate-400"/> Recent Activity
              </h2>
              {history.length > 5 && (
                <button 
                  onClick={() => setShowFullHistory(!showFullHistory)}
                  className="text-blue-400 text-sm font-black uppercase tracking-widest hover:text-blue-300 transition-colors"
                >
                  {showFullHistory ? 'Show Less' : 'Full History →'}
                </button>
              )}
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              {(showFullHistory ? history : history.slice(0, 5)).map((session, idx) => (
                <motion.div 
                  key={session.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card !p-6 border-slate-800 flex items-center justify-between group hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                      session.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                      session.score >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {Math.round(session.score)}%
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{session.role}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3" /> {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                        <span className="capitalize">{session.difficulty} Level</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${getGrade(session.score).color}`}>
                        {getGrade(session.score).label} Grade
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                </motion.div>
              ))}

              {history.length === 0 && (
                <div className="glass-card p-12 border-dashed border-slate-800 text-center">
                  <History className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 italic">No interview attempts found. Start your first practice session above.</p>
                </div>
              )}
           </div>
        </motion.div>
      </div>
    )
  }

  const currentFeedback = feedbacks[currentIndex]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Session Progress Header */}
      <div className="sticky top-20 z-20 space-y-4">
         <div className="glass-card !p-2 !rounded-2xl border-white/10 shadow-2xl bg-[#0A0A0F]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-3">
               <div className="flex items-center gap-4">
                  <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                     Question {currentIndex + 1} of {questions.length}
                  </div>
                  <span className="text-slate-400 text-sm font-medium">{role} Session</span>
               </div>
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GPT-2 Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${currentFeedback ? 'bg-emerald-500' : 'bg-slate-700'}`}/>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BERT Eval</span>
                  </div>
               </div>
            </div>
            <div className="w-full bg-slate-800/50 h-1.5 rounded-b-2xl overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + (currentFeedback ? 1 : 0)) / questions.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
               />
            </div>
         </div>
      </div>

      <div className="space-y-10">
        {/* Question Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-xl shadow-blue-500/10">
            <Bot className="w-7 h-7 text-blue-400" />
          </div>
          <div className="glass-card p-8 border-blue-500/20 bg-blue-500/5 rounded-tl-none relative w-full shadow-2xl">
            <h3 className="text-xl font-bold leading-relaxed text-white">
              {questions[currentIndex]}
            </h3>
          </div>
        </motion.div>

        {/* User Answer Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-6 flex-row-reverse">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-xl shadow-purple-500/10">
            <User className="w-7 h-7 text-purple-400" />
          </div>
          <div className="w-full relative">
            {!currentFeedback ? (
              <div className="space-y-4">
                <textarea
                  className="w-full min-h-[180px] p-8 bg-black/40 border border-slate-800 rounded-3xl rounded-tr-none text-white text-lg outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none shadow-2xl"
                  placeholder="Type your technical response here..."
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                />
                <div className="flex justify-end">
                  <button onClick={handleAnalyze} disabled={isEvaluating} className="btn-primary py-4 px-10 text-lg rounded-2xl shadow-purple-500/30 shadow-2xl hover:scale-105 transition-transform">
                    {isEvaluating ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Analyzing with BERT...</> : 'Submit Final Answer'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 border-purple-500/10 rounded-tr-none bg-black/40">
                <p className="text-slate-300 text-lg italic">"{currentFeedback.answer}"</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Feedback */}
        <AnimatePresence>
          {currentFeedback && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xl shadow-emerald-500/10">
                <Bot className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="w-full space-y-6">
                <div className={`glass-card p-10 rounded-tl-none border-2 shadow-2xl relative overflow-hidden transition-all duration-500 ${
                  currentFeedback.score >= 80 ? 'border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/5' :
                  currentFeedback.score >= 60 ? 'border-amber-500/30 bg-amber-500/10 shadow-amber-500/5' :
                  'border-rose-500/30 bg-rose-500/10 shadow-rose-500/5'
                }`}>
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Technical Alignment</span>
                        <div className="flex items-baseline gap-1">
                           <motion.div 
                              initial={{ opacity: 0, x: -10 }} 
                              animate={{ opacity: 1, x: 0 }}
                              className={`text-6xl font-black ${
                                 currentFeedback.score >= 80 ? 'text-emerald-400' :
                                 currentFeedback.score >= 60 ? 'text-amber-400' : 'text-rose-400'
                              }`}
                           >
                              {Math.round(currentFeedback.score)}
                           </motion.div>
                           <span className="text-2xl font-bold text-slate-600">%</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className={`w-20 h-20 rounded-3xl border-4 flex flex-col items-center justify-center shadow-2xl transition-transform duration-500 hover:rotate-6 ${
                           currentFeedback.score >= 80 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' :
                           currentFeedback.score >= 60 ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 
                           'border-rose-500 bg-rose-500/10 text-rose-400'
                        }`}>
                           <span className="text-3xl font-black leading-none">{getGrade(currentFeedback.score).label}</span>
                           <span className="text-[8px] font-black uppercase mt-1 opacity-60 tracking-widest">{getGrade(currentFeedback.score).desc}</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="w-full bg-black/60 rounded-full h-4 border border-white/5 overflow-hidden mb-8 p-1">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${currentFeedback.score}%` }} 
                      transition={{ duration: 1.5, ease: "backOut" }}
                      className={`h-full rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                        currentFeedback.score >= 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                        currentFeedback.score >= 60 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
                        'bg-gradient-to-r from-rose-600 to-rose-400'
                      }`}
                    />
                  </div>
                  
                  <div className="space-y-6">
                     <div>
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <MessageSquare className="w-4 h-4" /> AI Feedback
                        </h4>
                        <p className="text-white text-lg leading-relaxed">{currentFeedback.feedback}</p>
                     </div>
                     
                     {currentFeedback.ideal_answer_hint && (
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                           <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Model Approach</h4>
                           <p className="text-slate-400 text-base italic leading-relaxed">"{currentFeedback.ideal_answer_hint}"</p>
                        </div>
                     )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleNext} className="btn-primary py-4 px-10 text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
