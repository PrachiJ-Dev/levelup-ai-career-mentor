'use client'

import { ResumeEntities } from '@/types'

interface Props {
  entities: ResumeEntities
}

export default function EntityHighlighter({ entities }: Props) {
  const allEmpty = !entities.skills?.length && !entities.job_titles?.length && !entities.certifications?.length

  if (allEmpty) {
    return (
      <div className="text-center p-8 text-slate-500 glass-card">
        No entities detected by the model.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Job Roles */}
      {entities.job_titles?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Detected Roles</h3>
          <div className="flex flex-wrap gap-2">
            {entities.job_titles.map((role, i) => (
              <span key={i} className="chip chip-missing">{role}</span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {entities.skills?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Extracted Skills</h3>
          <div className="flex flex-wrap gap-2">
            {entities.skills.map((skill, i) => (
              <span key={i} className="chip chip-skill">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications and Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entities.certifications?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Certifications</h3>
            <ul className="space-y-2">
              {entities.certifications.map((cert, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entities.education?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Education</h3>
            <ul className="space-y-2">
              {entities.education.map((edu, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  {edu}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {entities.experience_years && (
        <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Estimated Experience</span>
          <span className="text-lg font-bold text-blue-400">{entities.experience_years} Years</span>
        </div>
      )}
    </div>
  )
}
