'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts'

interface Props {
  currentSkills: string[]
  requiredSkills: string[]
}

export default function SkillRadarChart({ currentSkills, requiredSkills }: Props) {
  // Compute dummy scores for visualization (In a real app, the DNN would return confidence scores for each skill)
  const allSkills = Array.from(new Set([...currentSkills, ...requiredSkills])).slice(0, 8) // Limit to 8 for clear radar
  
  const data = allSkills.map(skill => ({
    subject: skill,
    A: Math.round(currentSkills.includes(skill) ? 90 + Math.random() * 10 : 20 + Math.random() * 20), // Current user
    B: Math.round(requiredSkills.includes(skill) ? 85 + Math.random() * 15 : 40), // Target role
  }))

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          
          <Radar
            name="Target Role Required"
            dataKey="B"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.2}
          />
          <Radar
            name="Your Current Skills"
            dataKey="A"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.5}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111118', borderColor: '#1E293B', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
            itemStyle={{ color: '#E2E8F0', fontWeight: 'bold' }}
            formatter={(value: any) => [`${value}%`, '']}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
