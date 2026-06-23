import Navbar from './Navbar'

export default function PageLayout({ children, className = '' }) {
  return (
    <div className="min-h-screen bg-[#080d18]">
      <Navbar />
      <main className={`pt-16 ${className}`}>
        {children}
      </main>
    </div>
  )
}
