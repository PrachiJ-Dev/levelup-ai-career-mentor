'use client'

import { useSession } from 'next-auth/react'
import { Bell, Info, Settings, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors" title="Check .env configuration">
          <Info className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-500">DEMO MODE</span>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-black animate-pulse" />
        </button>

        <div className="h-6 w-px bg-white/10" />

        <div className="relative">
          {session?.user ? (
            <button 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{session.user.name}</p>
                <p className="text-[11px] text-slate-400 mt-1">{session.user.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20 border border-white/10">
                {session.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-24 h-4 animate-pulse rounded bg-white/5" />
              <div className="w-9 h-9 animate-pulse rounded-full bg-white/5" />
            </div>
          )}

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#111118] border border-white/10 shadow-2xl py-1 overflow-hidden z-50 glass-card">
              <button className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                <User className="w-4 h-4" /> Profile
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
