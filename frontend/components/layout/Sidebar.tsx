'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Target,
  Users,
  Map,
  TrendingUp,
  LogOut,
  Brain
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resume NLP', href: '/dashboard/resume', icon: FileText },
  { name: 'Skill Gap', href: '/dashboard/skill-gap', icon: Target },
  { name: 'Interviews', href: '/dashboard/interview', icon: Users },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: Map },
  { name: 'Career Path', href: '/dashboard/career', icon: TrendingUp },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      backgroundColor: '#0f1117',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 40,
      padding: '16px',
    }}>

      {/* Logo */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            flexShrink: 0,
          }}>
            <Brain style={{ width: '18px', height: '18px', color: '#fff' }} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>LevelUp</span>
        </div>
        <p style={{
          fontSize: '9px', fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginLeft: '2px',
        }}>
          AI Deep Learning Core
        </p>
      </div>

      {/* Nav Items */}
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '10px',
                marginBottom: '6px',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? '#1e3a5f' : 'transparent',
                boxShadow: isActive ? '0 0 0 1px rgba(59,130,246,0.2)' : 'none',
                color: isActive ? '#fff' : '#94A3B8',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'
                    ; (e.currentTarget as HTMLElement).style.color = '#e2e8f0'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    ; (e.currentTarget as HTMLElement).style.color = '#94A3B8'
                }
              }}
            >
              <Icon style={{
                width: '17px', height: '17px', flexShrink: 0,
                color: isActive ? '#3B82F6' : '#64748B',
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
              }}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', marginBottom: '8px' }}>
          <div style={{
            width: '8px', height: '8px',
            backgroundColor: '#10B981', borderRadius: '50%',
            animation: 'pulse 2s infinite',
            boxShadow: '0 0 8px rgba(16,185,129,0.5)',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Atlas Live
          </span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '10px 14px',
            borderRadius: '10px', border: 'none',
            backgroundColor: 'transparent',
            color: '#64748B', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s ease',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(244,63,94,0.1)'
              ; (e.currentTarget as HTMLElement).style.color = '#F43F5E'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              ; (e.currentTarget as HTMLElement).style.color = '#64748B'
          }}
        >
          <LogOut style={{ width: '16px', height: '16px' }} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}