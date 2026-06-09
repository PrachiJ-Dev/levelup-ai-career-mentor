import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from session or localStorage
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  let token = session ? (session as any).accessToken : null
  
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('levelup_token')
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Resume ────────────────────────────────────────────────────────────────────

export const uploadResume = async (file: File, userId: string = 'demo_user_123') => {
  const form = new FormData()
  form.append('file', file)
  form.append('user_id', userId)
  const { data } = await api.post('/api/resume/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const getResume = async (resumeId: string) => {
  const { data } = await api.get(`/api/resume/${resumeId}`)
  return data
}

export const getJobRoles = async (): Promise<string[]> => {
  const { data } = await api.get('/api/resume/jobs/roles')
  return data.roles
}

// ── Skill Gap ─────────────────────────────────────────────────────────────────

export const predictSkillGap = async (resumeId: string, targetRole: string) => {
  const { data } = await api.post('/api/skill-gap/predict', {
    resume_id: resumeId,
    target_role: targetRole,
  })
  return data
}

export const getSkillGap = async (gapId: string) => {
  const { data } = await api.get(`/api/skill-gap/${gapId}`)
  return data
}

// ── Interview ─────────────────────────────────────────────────────────────────

export const getInterviewQuestions = async (
  role: string,
  difficulty: string,
  count: number = 5
) => {
  const { data } = await api.get('/api/interview/questions', {
    params: { role, difficulty, count },
  })
  return data.questions as string[]
}

export const evaluateAnswer = async (
  question: string,
  answer: string,
  role: string = 'Software Engineer'
) => {
  const { data } = await api.post('/api/interview/evaluate', { question, answer, role })
  return data
}

export const saveInterview = async (payload: {
  user_id: string
  role: string
  difficulty: string
  questions: any[]
  overall_score: number
}) => {
  const { data } = await api.post('/api/interview/save', payload)
  return data
}

export const getInterviewHistory = async () => {
  const { data } = await api.get('/api/interview/history')
  return data
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

export const recommendRoadmap = async (skillGapId: string) => {
  const { data } = await api.post('/api/roadmap/recommend', { skill_gap_id: skillGapId })
  return data
}

export const toggleRoadmapPhase = async (roadmapId: string, phaseIndex: number) => {
  const { data } = await api.patch(`/api/roadmap/${roadmapId}/phase/${phaseIndex}/complete`)
  return data
}

// ── Career ────────────────────────────────────────────────────────────────────

export const predictCareer = async (userId: string, history: any[]) => {
  const { data } = await api.post('/api/career/predict', { user_id: userId, history })
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = async (name: string, email: string, password: string) => {
  const { data } = await api.post('/api/auth/register', { name, email, password })
  return data
}

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data
}

export const getDashboardStats = async () => {
  const { data } = await api.get('/api/auth/me/dashboard')
  return data
}

export default api
