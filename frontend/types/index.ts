export interface Resume {
  id: string
  user_id: string
  original_filename: string
  stored_path: string
  file_url: string
  extracted_text?: string
  entities: ResumeEntities
  resume_score: number
  uploaded_at: string
  demo?: boolean
}

export interface ResumeEntities {
  skills: string[]
  job_titles: string[]
  experience_years?: number
  certifications: string[]
  education: string[]
}

export interface SkillGap {
  id: string
  user_id: string
  resume_id: string
  target_role: string
  current_skills: string[]
  missing_skills: string[]
  match_score: number
  skill_scores: Record<string, number>
  created_at: string
  demo?: boolean
}

export interface InterviewQuestion {
  question: string
  user_answer?: string
  score?: number
  feedback?: string
  answered_at?: string
}

export interface Interview {
  id: string
  user_id: string
  role: string
  difficulty: string
  questions: InterviewQuestion[]
  overall_score: number
  started_at: string
  completed_at?: string
}

export interface EvaluateResponse {
  score: number
  feedback: string
  ideal_answer_hint?: string
  demo?: boolean
}

export interface Course {
  course_title?: string
  title?: string
  platform: string
  url: string
  skill_covered: string
  difficulty: string
  estimated_hours: number
  why_important: string
  is_completed?: boolean

  // Pipeline enriched fields
  priority_score?: number
  cnn_difficulty?: string
  cnn_confidence?: number
  sequence_score?: number
  phase?: number
}

export interface Roadmap {
  id: string
  _id?: string // For compatibility
  user_id: string
  skill_gap_id: string
  target_role: string
  recommended_courses: Course[]
  timeline_weeks: number
  pipeline_metadata?: {
    models_used: string[]
    execution_times_ms: Record<string, number>
    total_time_ms: number
    demo_mode: boolean
  }
  created_at: string
}

export interface CareerStep {
  role: string
  year: number
  skills: string[]
}

export interface CareerHistory {
  id: string
  user_id: string
  history: CareerStep[]
  predicted_roles: string[]
  confidence_scores: number[]
  predicted_at: string
  demo?: boolean
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  target_role?: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface DashboardStats {
  resume_score: number
  skill_match: number
  interviews_done: number
  skills_count: number
  missing_skills_count: number
}
