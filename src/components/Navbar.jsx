import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const Navbar = ({ currentPage, setCurrentPage }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await signOut()
    setCurrentPage('home')
    setMobileMenuOpen(false)
  }

  const handleNavClick = (itemId) => {
    setCurrentPage(itemId)
    setMobileMenuOpen(false)
    
    // Smooth scroll to top for all pages
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Public nav items (shown when logged out)
  const publicNavItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'about', label: 'About', icon: 'ℹ️' }
  ]

  // Protected nav items (shown when logged in) - in required order
  const protectedNavItems = [
    { id: 'add', label: 'Add Item', icon: '➕' },
    { id: 'stored', label: 'Stored Items', icon: '📦' },
    { id: 'documents', label: 'Documents', icon: '📋' },
    { id: 'find', label: 'Find Item', icon: '🔍' },
    { id: 'about', label: 'About', icon: 'ℹ️' }
  ]

  // Select appropriate nav items based on auth state
  const navItems = user ? protectedNavItems : publicNavItems

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-dark-100/90 backdrop-blur-xl shadow-lg shadow-black/10 border-b border-primary-cyan/10' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group"
            onClick={() => handleNavClick('home')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-lg shadow-primary-cyan/30 group-hover:shadow-primary-cyan/50 transition-shadow overflow-hidden"
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <img src="/logo.svg" alt="FindIt AI" className="w-full h-full" />
            </motion.div>
            <span className="text-lg sm:text-xl font-bold gradient-text">FindIt AI</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all relative group ${
                  currentPage === item.id
                    ? 'text-primary-cyan'
                    : 'text-gray-300 hover:text-white'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {currentPage === item.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-primary-cyan/10 to-blue-500/10 rounded-lg border border-primary-cyan/40 shadow-lg shadow-primary-cyan/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {currentPage !== item.id && (
                  <div className="absolute inset-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </motion.button>
            ))}
            
            {/* User Info and Logout */}
            {user && (
              <div className="ml-4 pl-4 border-l border-gray-700/50 flex items-center space-x-3">
                <motion.div 
                  className="flex items-center space-x-2 px-3 py-1.5 bg-primary-cyan/5 rounded-lg border border-primary-cyan/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-lg">👤</span>
                  <span className="text-sm text-gray-400">
                    <span className="text-primary-cyan font-medium">{user?.user_metadata?.name || user?.email?.split('@')[0]}</span>
                  </span>
                </motion.div>
                <motion.button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-400 rounded-lg font-medium hover:from-red-500/20 hover:to-red-600/20 transition-all border border-red-500/20 hover:border-red-500/40"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center gap-2">
                    <span>🚪</span>
                    <span>Logout</span>
                  </span>
                </motion.button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="lg:hidden mt-4 pt-4 border-t border-gray-700/50"
            >
              <div className="space-y-1">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-primary-cyan/15 to-blue-500/10 text-primary-cyan border border-primary-cyan/40 shadow-lg shadow-primary-cyan/10'
                        : 'text-gray-300 hover:bg-white/5 border border-transparent hover:border-gray-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                    {currentPage === item.id && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-primary-cyan"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Mobile User Info */}
              {user && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 mt-4 border-t border-gray-700/50 space-y-3"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-cyan/5 rounded-lg border border-primary-cyan/20">
                    <span className="text-xl">👤</span>
                    <span className="text-sm text-gray-400">
                      <span className="text-primary-cyan font-medium">{user?.user_metadata?.name || user?.email?.split('@')[0]}</span>
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-400 rounded-lg font-medium hover:from-red-500/20 hover:to-red-600/20 transition-all border border-red-500/20"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar