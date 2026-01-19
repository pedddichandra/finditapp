import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllItems, deleteItem } from '../lib/items'
import LazyImage from '../components/LazyImage'
import { useCachedData } from '../hooks/useDataCache'

/**
 * StoredItemsPage - Displays all user's stored items
 * Supports two view modes: Category (grouped by category) and Timeline (grouped by date)
 * Features: Edit, Delete with confirmation, Recently added highlighting
 */
const StoredItemsPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    item_name: '',
    location: '',
    category: ''
  })
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('category') // 'category' or 'timeline'

  /**
   * Check if an item was recently added (within last 5 minutes)
   * Used to highlight newly added items for better UX
   */
  const isRecentlyAdded = (dateString) => {
    const created = new Date(dateString)
    const now = new Date()
    const diffMinutes = (now - created) / (1000 * 60)
    return diffMinutes <= 5
  }

  /**
   * Get timeline group label for a given date
   * Groups: Today, Yesterday, Last 7 Days, Earlier
   */
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

  // Format time for timeline
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  // Format date for timeline
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Group items by timeline
  const timelineGroups = useMemo(() => {
    if (!items.length) return []

    const groups = items.reduce((acc, item) => {
      const group = getTimelineGroup(item.created_at)
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(item)
      return acc
    }, {})

    // Sort items within each group by date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })

    // Define order of timeline groups
    const order = ['Today', 'Yesterday', 'Last 7 Days', 'Earlier']
    return order
      .filter(key => groups[key]?.length > 0)
      .map(key => ({ groupName: key, items: groups[key] }))
  }, [items])

  const groupedItems = useMemo(() => {
    if (!items.length) return []

    const categories = items.reduce((acc, item) => {
      const key = item.category?.trim() || 'Uncategorized'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {})

    return Object.entries(categories)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([categoryName, categoryItems]) => ({ categoryName, items: categoryItems }))
  }, [items])

  // Use cached data hook for optimized fetching
  const { 
    data: cachedItems, 
    loading: cacheLoading, 
    refresh: refreshItems,
    invalidateCache 
  } = useCachedData(getAllItems, 30000) // Cache for 30 seconds

  useEffect(() => {
    if (cachedItems) {
      setItems(cachedItems)
      setLoading(false)
    } else if (!cacheLoading) {
      setLoading(false)
    }
  }, [cachedItems, cacheLoading])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    await refreshItems()
    setLoading(false)
  }, [refreshItems])

  const handleEditClick = (item) => {
    setEditingId(item.id)
    setEditForm({
      item_name: item.item_name,
      location: item.location,
      category: item.category || ''
    })
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    const result = await deleteItem(id)
    
    if (result.success) {
      setItems(items.filter(item => item.id !== id))
      setDeleteId(null)
    } else {
      setError(result.error || 'Failed to delete item')
    }
    
    setDeleting(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="text-7xl mb-4"
            >
              🗂️
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Stored <span className="gradient-text">Items</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400">
              All your saved items in one place
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/40 rounded-xl p-5 mb-8 flex items-start gap-3"
              >
                <span className="text-3xl">⚠️</span>
                <div>
                  <div className="font-semibold text-red-400 mb-1">Error</div>
                  <div className="text-red-300/90">{error}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-primary-cyan/20 border-t-primary-cyan rounded-full mb-6"
              />
              <p className="text-gray-400 text-lg">Loading your items...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </div>
          ) : items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-12 text-center border border-primary-cyan/20"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                📦
              </motion.div>
              <h3 className="text-3xl font-bold mb-3">No items stored yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start adding items to never forget where they are. Your AI-powered memory awaits!
              </p>
            </motion.div>
          ) : (
            <>
              {/* Item count and View Toggle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between mb-6 flex-wrap gap-4"
              >
                <div className="flex items-center gap-4 text-gray-400 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <span className="text-lg">
                      <span className="font-bold text-primary-cyan">{items.length}</span> {items.length === 1 ? 'item' : 'items'} stored
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🗂️</span>
                    <span className="text-lg">
                      <span className="font-bold text-primary-cyan">{groupedItems.length}</span> {groupedItems.length === 1 ? 'category' : 'categories'}
                    </span>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => setViewMode('category')}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                      viewMode === 'category'
                        ? 'bg-primary-cyan/20 text-primary-cyan border border-primary-cyan/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>📁</span> Category
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                      viewMode === 'timeline'
                        ? 'bg-primary-cyan/20 text-primary-cyan border border-primary-cyan/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>📅</span> Timeline
                  </button>
                </div>
              </motion.div>

              {/* Timeline View */}
              {viewMode === 'timeline' ? (
                <div className="space-y-8">
                  {timelineGroups.map(({ groupName, items: groupItems }) => (
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
                          <p className="text-sm text-gray-500">{groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}</p>
                        </div>
                      </div>

                      {/* Timeline Items - Vertical List */}
                      <div className="relative ml-6 pl-6 border-l-2 border-white/10 space-y-4">
                        {groupItems.map((item) => (
                          <div
                            key={item.id}
                            className="relative bg-dark-200/50 rounded-xl border border-white/5 p-4 hover:border-primary-cyan/30 transition-colors"
                          >
                            {/* Timeline Dot */}
                            <div className="absolute -left-[31px] top-5 w-4 h-4 rounded-full bg-primary-cyan/20 border-2 border-primary-cyan" />
                            
                            <div className="flex items-start gap-4">
                              {/* Image Thumbnail */}
                              {item.image_url ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                  <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-primary-cyan/10 flex items-center justify-center flex-shrink-0 text-2xl">
                                  📦
                                </div>
                              )}

                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="font-semibold text-white truncate">{item.item_name}</h3>
                                    <p className="text-sm text-gray-400 truncate">📍 {item.location}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-medium text-primary-cyan">{formatTime(item.created_at)}</div>
                                    <div className="text-xs text-gray-500">{formatDate(item.created_at)}</div>
                                  </div>
                                </div>
                                {item.category && (
                                  <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/20">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                              <button 
                                onClick={() => handleEditClick(item)}
                                className="flex-1 px-3 py-1.5 text-xs font-medium bg-primary-cyan/10 border border-primary-cyan/20 text-primary-cyan rounded-lg hover:bg-primary-cyan/20 transition-all"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteId(item.id)}
                                className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                /* Category View */
                <div className="space-y-10">
                  {groupedItems.map(({ categoryName, items: categoryItems }) => (
                    <section key={categoryName}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-cyan/15 border border-primary-cyan/30 flex items-center justify-center text-2xl shadow-lg shadow-primary-cyan/10">
                          📁
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-white capitalize">{categoryName}</h2>
                          <p className="text-sm text-gray-400">
                            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      <AnimatePresence mode="popLayout">
                        {categoryItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className={`glass rounded-2xl overflow-hidden border transition-all group ${
                              isRecentlyAdded(item.created_at)
                                ? 'border-green-500/50 ring-2 ring-green-500/20'
                                : 'border-primary-cyan/10 hover:border-primary-cyan/30'
                            }`}
                          >
                            {/* Recently Added Badge */}
                            {isRecentlyAdded(item.created_at) && (
                              <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-green-500/90 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                NEW
                              </div>
                            )}
                            {/* Image */}
                            {item.image_url ? (
                              <div className="h-48 overflow-hidden bg-white/5 relative">
                                <img
                                  src={item.image_url}
                                  alt={item.item_name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ) : (
                              <div className="h-48 bg-gradient-to-br from-primary-cyan/10 via-blue-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                  className="text-7xl"
                                >
                                  📦
                                </motion.div>
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}

                            {/* Content */}
                            <div className="p-6 space-y-4">
                              <h3 className="text-xl font-bold text-white group-hover:text-primary-cyan transition-colors line-clamp-1">
                                {item.item_name}
                              </h3>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2 text-gray-400">
                                  <span>📍</span>
                                  <span className="line-clamp-1">{item.location}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-400">
                                  <span>📅</span>
                                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2 pt-2">
                                <button 
                                  onClick={() => handleEditClick(item)}
                                  className="flex-1 px-4 py-2 bg-primary-cyan/10 border border-primary-cyan/30 text-primary-cyan rounded-lg hover:bg-primary-cyan/20 transition-all text-sm font-semibold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteId(item.id)}
                                  className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm font-semibold"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </section>
                ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4"
            onClick={() => !deleting && setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-md w-full border border-red-500/30 shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-6xl mb-6 text-center"
              >
                ⚠️
              </motion.div>
              
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center">
                Delete <span className="text-red-400">Item?</span>
              </h3>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-gray-300 text-center text-sm leading-relaxed">
                  This action <span className="font-bold text-red-400">cannot be undone</span>. The item and its image will be permanently removed from your storage.
                </p>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  whileHover={{ scale: deleting ? 1 : 1.02 }}
                  whileTap={{ scale: deleting ? 1 : 0.98 }}
                  className="flex-1 px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  whileHover={{ scale: deleting ? 1 : 1.02 }}
                  whileTap={{ scale: deleting ? 1 : 0.98 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold shadow-lg shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ⏳
                      </motion.span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Delete Forever</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal (Placeholder for future implementation) */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4"
            onClick={() => setEditingId(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 max-w-md w-full border border-primary-cyan/30"
            >
              <div className="text-5xl mb-4 text-center">✏️</div>
              <h3 className="text-2xl font-bold mb-4 text-center">
                Edit <span className="gradient-text">Item</span>
              </h3>
              <p className="text-gray-400 text-center mb-6">
                Edit functionality coming soon! For now, you can delete and re-add items.
              </p>
              <motion.button
                onClick={() => setEditingId(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-cyan to-blue-500 text-white rounded-xl font-bold"
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StoredItemsPage
