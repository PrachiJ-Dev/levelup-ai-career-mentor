import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Background blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <Sidebar />

      <div
        style={{ marginLeft: '260px', width: 'calc(100% - 260px)' }}
        className="flex flex-col min-h-screen relative z-10 overflow-x-hidden"
      >
        <Navbar />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}