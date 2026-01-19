import { useState, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { AuthProvider, useAuth } from './context/AuthContext'

// Lazy load pages for code splitting - improves initial load time
const HomePage = lazy(() => import('./pages/HomePage'))
const AddItemPage = lazy(() => import('./pages/AddItemPage'))
const FindItemPage = lazy(() => import('./pages/FindItemPage'))
const StoredItemsPage = lazy(() => import('./pages/StoredItemsPage'))
const ImportantDocumentsPage = lazy(() => import('./pages/ImportantDocumentsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const SignInPage = lazy(() => import('./pages/SignInPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))

// Loading spinner component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-3 text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
)

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home')
  const { user, loading } = useAuth()
  useSmoothScroll()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show auth pages
  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        {currentPage === 'signup' && <SignUpPage onNavigate={setCurrentPage} />}
        {currentPage !== 'signup' && <SignInPage onNavigate={setCurrentPage} />}
      </Suspense>
    )
  }

  // Authenticated - show main app
  return (
    <div className="app">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <Suspense fallback={<PageLoader />}>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'add' && <AddItemPage />}
        {currentPage === 'find' && <FindItemPage />}
        {currentPage === 'stored' && <StoredItemsPage />}
        {currentPage === 'documents' && <ImportantDocumentsPage />}
        {currentPage === 'about' && <AboutPage />}
      </Suspense>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
