import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addDocument, getAllDocuments, deleteDocument, updateDocument, DOCUMENT_TYPES, getDocumentSuggestions } from '../lib/documents'
import LazyImage from '../components/LazyImage'
import { useCachedData } from '../hooks/useDataCache'

const ImportantDocumentsPage = () => {
  // Form state
  const [documentName, setDocumentName] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  // Documents state
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Edit state
  const [editingDoc, setEditingDoc] = useState(null)

  // View image modal
  const [viewingImage, setViewingImage] = useState(null)

  // Card menu state
  const [activeMenu, setActiveMenu] = useState(null)

  // Filter state
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // View mode state
  const [viewMode, setViewMode] = useState('type') // 'type' or 'timeline'

  // Auto-suggestions state
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const suggestionsRef = useRef(null)
  const searchInputRef = useRef(null)

  // Use cached data hook for optimized fetching
  const { 
    data: cachedDocs, 
    loading: cacheLoading, 
    refresh: refreshDocs 
  } = useCachedData(getAllDocuments, 30000)

  // Load documents on mount or when cache updates
  useEffect(() => {
    if (cachedDocs) {
      setDocuments(cachedDocs)
      setLoadingDocs(false)
    } else if (!cacheLoading) {
      setLoadingDocs(false)
    }
  }, [cachedDocs, cacheLoading])

  // Fetch suggestions as user types in search (debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoadingSuggestions(true)
      const result = await getDocumentSuggestions(searchQuery)
      if (result.success && result.data.length > 0) {
        setSuggestions(result.data)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
      setLoadingSuggestions(false)
    }

    const debounceTimer = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
      // Also close active menu when clicking outside
      if (activeMenu && !event.target.closest('[data-menu-button]')) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenu])

  const handleSelectSuggestion = (doc) => {
    setSearchQuery(doc.document_name)
    setShowSuggestions(false)
    setSuggestions([])
    // Filter to show only this document
    setFilterType('all')
  }

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true)
    await refreshDocs()
    setLoadingDocs(false)
  }, [refreshDocs])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError('')
    } else {
      setError('Please drop a valid image file')
    }
  }

  const resetForm = () => {
    setDocumentName('')
    setDocumentType('')
    setNotes('')
    setImageFile(null)
    setImagePreview(null)
    setEditingDoc(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!documentName.trim() || !documentType) {
      setError('Document name and type are required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await addDocument({
      document_name: documentName,
      document_type: documentType,
      notes: notes,
      image: imageFile
    })

    if (result.success) {
      setSuccessMessage('')
      setSuccess(true)
      resetForm()
      loadDocuments()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || 'Failed to add document')
    }

    setLoading(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingDoc) return

    setLoading(true)
    setError('')

    const result = await updateDocument(editingDoc.id, {
      document_name: documentName,
      document_type: documentType,
      notes: notes
    })

    if (result.success) {
      setDocuments(docs => docs.map(d => d.id === editingDoc.id ? result.data : d))
      setSuccessMessage('')
      setSuccess(true)
      resetForm()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    
    const result = await deleteDocument(deleteId)
    if (result.success) {
      setDocuments(docs => docs.filter(d => d.id !== deleteId))
    } else {
      setError(result.error)
    }
    
    setDeleting(false)
    setDeleteId(null)
  }

  const startEdit = (doc) => {
    setEditingDoc(doc)
    setDocumentName(doc.document_name)
    setDocumentType(doc.document_type)
    setNotes(doc.notes || '')
    setActiveMenu(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Download document image
  const handleDownload = async (doc) => {
    setActiveMenu(null)
    if (!doc.image_url) {
      setError('No image available to download')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    try {
      // Show loading feedback
      const response = await fetch(doc.image_url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Generate filename from document name
      const extension = doc.image_url.split('.').pop()?.split('?')[0] || 'jpg'
      const sanitizedName = doc.document_name.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
      link.download = `${sanitizedName}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download document. Please check your connection and try again.')
      setTimeout(() => setError(''), 4000)
    }
  }

  // Copy public Supabase Storage URL to clipboard (only exposes file, not user data)
  const handleCopyLink = async (doc) => {
    setActiveMenu(null)
    
    if (!doc.image_url) {
      setError('No document file available to share')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      // Only copy the public Supabase Storage URL - no user data exposed
      await navigator.clipboard.writeText(doc.image_url)
      setSuccessMessage('Link copied to clipboard!')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      console.error('Copy link error:', err)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = doc.image_url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setSuccessMessage('Link copied to clipboard!')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2500)
      } catch (fallbackErr) {
        setError('Failed to copy link. Please try again.')
        setTimeout(() => setError(''), 3000)
      }
    }
  }

  // Share document via Web Share API (only shares the public URL, not user data)
  const handleShare = async (doc) => {
    setActiveMenu(null)
    
    if (!doc.image_url) {
      setError('No document file available to share')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      if (navigator.share) {
        // Only share the public file URL - no personal data
        await navigator.share({
          title: 'Shared Document',
          url: doc.image_url
        })
      } else {
        // Fallback to copy link
        await handleCopyLink(doc)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err)
        // Fallback to copy link on share failure
        await handleCopyLink(doc)
      }
    }
  }

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getDocTypeIcon = (type) => {
    const docType = DOCUMENT_TYPES.find(t => t.value === type)
    return docType?.icon || '📄'
  }

  const getDocTypeLabel = (type) => {
    const docType = DOCUMENT_TYPES.find(t => t.value === type)
    return docType?.label || type
  }

  // Helper function to get timeline group for a date
  const getTimelineGroup = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (itemDate.getTime() === today.getTime()) {
      return 'Today'
    } else if (itemDate.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else if (itemDate >= lastWeek) {
      return 'Last 7 Days'
    } else {
      return 'Earlier'
    }
  }

  // Helper to check if a document was recently added (within last 5 minutes)
  // Used to show a "NEW" badge on recently uploaded documents
  const isRecentlyAdded = (dateString) => {
    const addedTime = new Date(dateString).getTime()
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
    return (now - addedTime) < fiveMinutes
  }

  // Format time for timeline
  const formatTimelineTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Format date for timeline
  const formatTimelineDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesType = filterType === 'all' || doc.document_type === filterType
    const matchesSearch = !searchQuery || 
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesType && matchesSearch
  })

  // Group documents by type
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const type = doc.document_type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(doc)
    return acc
  }, {})

  // Group documents by timeline
  const timelineGroups = useMemo(() => {
    if (!filteredDocuments.length) return []

    const groups = filteredDocuments.reduce((acc, doc) => {
      const group = getTimelineGroup(doc.created_at)
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(doc)
      return acc
    }, {})

    // Sort documents within each group by date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })

    // Define order of timeline groups
    const order = ['Today', 'Yesterday', 'Last 7 Days', 'Earlier']
    return order
      .filter(key => groups[key]?.length > 0)
      .map(key => ({ groupName: key, documents: groups[key] }))
  }, [filteredDocuments])

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 bg-gradient-to-b from-dark-100 via-dark-100 to-dark-200">
      <div className="max-w-7xl mx-auto">
        
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* HEADER - More formal/serious styling */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase">Secure Document Vault</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Important Documents
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Store and organize your critical documents securely. IDs, certificates, contracts, and more.
          </p>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-8 flex items-center gap-3 max-w-3xl mx-auto"
            >
              <span className="text-2xl">⚠️</span>
              <span className="text-red-300 flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 text-xl">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500/10 border border-green-500/40 rounded-xl p-4 mb-8 flex items-center gap-3 max-w-3xl mx-auto"
            >
              <span className="text-2xl">{successMessage ? '📋' : '✅'}</span>
              <span className="text-green-300">
                {successMessage || `Document ${editingDoc ? 'updated' : 'saved'} successfully!`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: ADD IMPORTANT DOCUMENT */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-2xl">{editingDoc ? '✏️' : '➕'}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {editingDoc ? 'Edit Document' : 'Add Important Document'}
              </h2>
              <p className="text-gray-500 text-sm">Fill in the details below to store a new document</p>
            </div>
          </div>

          <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl">
            <form onSubmit={editingDoc ? handleUpdate : handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Document Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Document Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Driver's License, Passport"
                    className="w-full px-4 py-3 rounded-xl bg-dark-100 border border-white/10 text-gray-100 font-medium placeholder-gray-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all caret-amber-400"
                    required
                  />
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Document Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-dark-100 border border-white/10 text-gray-100 font-medium focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    required
                  >
                    <option value="" className="bg-dark-100">Select type...</option>
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value} className="bg-dark-100">
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Notes <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any important details, expiry dates, or notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-dark-100 border border-white/10 text-gray-100 font-medium placeholder-gray-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none caret-amber-400"
                />
              </div>

              {/* Image Upload - Only for new documents */}
              {!editingDoc && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Document Image <span className="text-gray-500 text-xs">(for reference)</span>
                  </label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-white/10 hover:border-amber-500/50 bg-dark-100/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg mx-auto" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl mb-2 block">📷</span>
                        <p className="text-gray-400 text-sm">Drag & drop or click to upload</p>
                        <p className="text-gray-500 text-xs mt-1">Max 10MB • PNG, JPG, GIF</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{editingDoc ? '💾' : '📋'}</span>
                      <span>{editingDoc ? 'Update Document' : 'Save Document'}</span>
                    </>
                  )}
                </motion.button>
                
                {editingDoc && (
                  <motion.button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-4 rounded-xl font-semibold bg-dark-100 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* DIVIDER */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-dark-100 text-gray-500 text-sm">Your Stored Documents</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: STORED IMPORTANT DOCUMENTS */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-2xl">🗄️</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Document Library</h2>
                <p className="text-gray-500 text-sm">
                  {documents.length} {documents.length === 1 ? 'document' : 'documents'} stored securely
                </p>
              </div>
            </div>

            {/* Search & Filter */}
            {documents.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <div ref={searchInputRef}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Search documents..."
                      className="w-48 md:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-dark-200 border border-white/10 text-gray-100 font-medium text-sm placeholder-gray-500 focus:border-amber-500/50 caret-amber-400"
                      autoComplete="off"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                    {loadingSuggestions && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"
                      />
                    )}
                  </div>
                  
                  {/* Auto-suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-dark-200/95 backdrop-blur-xl rounded-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden z-50"
                      >
                        <div className="p-2 border-b border-white/5">
                          <span className="text-xs text-gray-400 px-2">Suggestions ({suggestions.length})</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {suggestions.map((doc, index) => (
                            <motion.button
                              key={doc.id}
                              type="button"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => handleSelectSuggestion(doc)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-500/10 transition-colors text-left group"
                            >
                              {doc.image_url ? (
                                <img 
                                  src={doc.image_url} 
                                  alt={doc.document_name}
                                  className="w-10 h-10 rounded-lg object-cover border border-white/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-xl">
                                  {getDocTypeIcon(doc.document_type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
                                  {doc.document_name}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                  {getDocTypeLabel(doc.document_type)}
                                </div>
                              </div>
                              <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-dark-200 border border-white/10 text-white text-sm focus:border-amber-500/50"
                >
                  <option value="all">All Types</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-dark-200 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => setViewMode('type')}
                    className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === 'type'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>📁</span> Type
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                      viewMode === 'timeline'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>📅</span> Timeline
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Documents Display */}
          {loadingDocs ? (
            <div className="text-center py-20 bg-dark-200/30 rounded-2xl border border-white/5">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading your documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-20 bg-dark-200/30 rounded-2xl border border-white/5">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl mb-6"
              >
                {searchQuery || filterType !== 'all' ? '🔍' : '📂'}
              </motion.div>
              <h3 className="text-2xl font-bold mb-2 text-white">
                {searchQuery || filterType !== 'all' ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Add your first important document using the form above'
                }
              </p>
            </div>
          ) : viewMode === 'timeline' ? (
            /* Timeline View */
            <div className="space-y-8">
              {timelineGroups.map(({ groupName, documents: groupDocs }) => (
                <section key={groupName}>
                  {/* Timeline Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      groupName === 'Today' 
                        ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                        : groupName === 'Yesterday'
                        ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                        : groupName === 'Last 7 Days'
                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                        : 'bg-gray-500/15 border border-gray-500/30 text-gray-400'
                    }`}>
                      {groupName === 'Today' ? '📍' : groupName === 'Yesterday' ? '⏪' : groupName === 'Last 7 Days' ? '📆' : '📚'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{groupName}</h2>
                      <p className="text-sm text-gray-500">{groupDocs.length} {groupDocs.length === 1 ? 'document' : 'documents'}</p>
                    </div>
                  </div>

                  {/* Timeline Items - Vertical List */}
                  <div className="relative ml-6 pl-6 border-l-2 border-white/10 space-y-4">
                    {groupDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="relative bg-dark-200/50 rounded-xl border border-white/5 p-4 hover:border-amber-500/30 transition-colors"
                      >
                        {/* Timeline Dot */}
                        <div className="absolute -left-[31px] top-5 w-4 h-4 rounded-full bg-amber-500/20 border-2 border-amber-500" />
                        
                        <div className="flex items-start gap-4">
                          {/* Image Thumbnail with NEW badge for recently added docs */}
                          <div className="relative">
                            {doc.image_url ? (
                              <div 
                                className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 cursor-pointer"
                                onClick={() => setViewingImage(doc.image_url)}
                              >
                                <img src={doc.image_url} alt={doc.document_name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-2xl">
                                {getDocTypeIcon(doc.document_type)}
                              </div>
                            )}
                            {/* NEW badge for recently added documents */}
                            {isRecentlyAdded(doc.created_at) && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-green-500/30"
                              >
                                NEW ✨
                              </motion.div>
                            )}
                          </div>

                          {/* Document Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-white truncate">{doc.document_name}</h3>
                                <p className="text-sm text-amber-400/80">{getDocTypeLabel(doc.document_type)}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-medium text-amber-400">{formatTimelineTime(doc.created_at)}</div>
                                <div className="text-xs text-gray-500">{formatTimelineDate(doc.created_at)}</div>
                              </div>
                            </div>
                            {doc.notes && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{doc.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={!doc.image_url}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                              doc.image_url
                                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                          <button
                            onClick={() => handleCopyLink(doc)}
                            disabled={!doc.image_url}
                            className="flex-1 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 rounded-lg flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy Link
                          </button>
                          <button 
                            onClick={() => startEdit(doc)}
                            className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 rounded-lg"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteId(doc.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Type View */
            <div className="space-y-6">
              {Object.entries(groupedDocuments).map(([type, docs]) => (
                <div key={type} className="bg-dark-200/40 rounded-2xl border border-white/5 overflow-hidden">
                  {/* Category Header */}
                  <div className="px-6 py-4 bg-dark-100/60 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <span className="text-xl">{getDocTypeIcon(type)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{getDocTypeLabel(type)}</h3>
                        <p className="text-xs text-gray-500">{docs.length} {docs.length === 1 ? 'document' : 'documents'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div className="p-5">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <AnimatePresence mode="popLayout">
                        {docs.map((doc) => {
                          const { date, time } = formatDateTime(doc.created_at)
                          return (
                            <motion.div
                              key={doc.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="bg-dark-100 rounded-xl border border-white/5 overflow-hidden hover:border-amber-500/20 transition-colors"
                            >
                              {/* Image Preview */}
                              <div 
                                className="h-36 bg-dark-200 relative cursor-pointer"
                                onClick={() => doc.image_url && setViewingImage(doc.image_url)}
                              >
                                {doc.image_url ? (
                                  <>
                                    <img
                                      src={doc.image_url}
                                      alt={doc.document_name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 flex items-center justify-center">
                                    <span className="text-4xl opacity-30">{getDocTypeIcon(type)}</span>
                                  </div>
                                )}
                                
                                {/* Type Badge */}
                                <div className="absolute top-3 left-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-xs text-white/80 border border-white/10">
                                    <span>{getDocTypeIcon(type)}</span>
                                    <span className="hidden sm:inline">{getDocTypeLabel(type).split(' ')[0]}</span>
                                  </span>
                                </div>

                                {/* NEW badge for recently added documents */}
                                {isRecentlyAdded(doc.created_at) && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-green-500/30 flex items-center gap-1"
                                  >
                                    <span>NEW</span>
                                    <span className="animate-pulse">✨</span>
                                  </motion.div>
                                )}

                                {/* Menu Button */}
                                <div className="absolute top-3 right-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveMenu(activeMenu === doc.id ? null : doc.id)
                                    }}
                                    className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
                                  >
                                    ⋮
                                  </button>
                                  
                                  {/* Dropdown Menu */}
                                  <AnimatePresence>
                                    {activeMenu === doc.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute top-10 right-0 w-36 bg-dark-200 border border-white/10 rounded-lg shadow-xl overflow-hidden z-20"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={() => startEdit(doc)}
                                          className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                                        >
                                          <span>✏️</span> Edit
                                        </button>
                                        <button
                                          onClick={() => {
                                            setActiveMenu(null)
                                            setDeleteId(doc.id)
                                          }}
                                          className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                        >
                                          <span>🗑️</span> Delete
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="p-4">
                                {/* Document Name */}
                                <h4 className="font-semibold text-white text-sm mb-2 truncate">
                                  {doc.document_name}
                                </h4>
                                
                                {/* Date & Time */}
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {date}
                                  </span>
                                  <span className="text-gray-600">•</span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {time}
                                  </span>
                                </div>

                                {/* Primary Actions: Download, Copy Link, Share */}
                                <div className="space-y-2">
                                  {/* Download Button - Full Width */}
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    disabled={!doc.image_url}
                                    className={`w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                      doc.image_url
                                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                                        : 'bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed'
                                    }`}
                                    title={doc.image_url ? 'Download document' : 'No file to download'}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                  </button>
                                  
                                  {/* Copy Link & Share - Side by Side */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleCopyLink(doc)}
                                      disabled={!doc.image_url}
                                      className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                                        doc.image_url
                                          ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                                          : 'bg-gray-500/5 border border-gray-500/10 text-gray-600 cursor-not-allowed'
                                      }`}
                                      title={doc.image_url ? 'Copy public link' : 'No file to share'}
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                      </svg>
                                      Copy Link
                                    </button>
                                    <button
                                      onClick={() => handleShare(doc)}
                                      disabled={!doc.image_url}
                                      className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                                        doc.image_url
                                          ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                                          : 'bg-gray-500/5 border border-gray-500/10 text-gray-600 cursor-not-allowed'
                                      }`}
                                      title={doc.image_url ? 'Share document' : 'No file to share'}
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                      </svg>
                                      Share
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => !deleting && setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-200 rounded-2xl p-8 max-w-md w-full border border-red-500/20 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🗑️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Delete Document?</h3>
                <p className="text-gray-400 mb-6">This action cannot be undone. The document will be permanently removed.</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeleteId(null)}
                    disabled={deleting}
                    className="flex-1 py-3 rounded-xl font-semibold bg-dark-100 border border-white/10 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 px-4"
            onClick={() => setViewingImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh]"
            >
              <img
                src={viewingImage}
                alt="Document"
                className="max-w-full max-h-[90vh] rounded-lg object-contain"
              />
              <button
                onClick={() => setViewingImage(null)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/20"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ImportantDocumentsPage
