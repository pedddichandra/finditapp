import { motion } from 'framer-motion'

const AboutPage = () => {
  const techStack = [
    { category: 'Frontend', items: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion', 'GSAP', 'Lenis'] },
    { category: 'Backend', items: ['Python', 'Flask', 'SQLite'] },
    { category: 'AI/ML', items: ['YOLOv8', 'Computer Vision', 'NLP', 'TensorFlow'] }
  ]

  const features = [
    '🤖 AI-powered object detection',
    '🧠 Natural language processing',
    '⚡ Instant search and recall',
    '🔒 Privacy-first local storage',
    '📱 Responsive design',
    '🎨 Cinematic scroll experience'
  ]

  const futureScope = [
    'Multi-user support with authentication',
    'Cloud sync across devices',
    'Mobile app (iOS & Android)',
    'Smart reminders and notifications',
    'Voice-only mode',
    'Integration with smart home devices',
    'AR visualization of item locations',
    'Collaborative family storage'
  ]

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center">
            About <span className="gradient-text">FindIt AI</span>
          </h1>
          <p className="text-xl text-gray-400 text-center mb-16">
            Your personal AI memory assistant
          </p>

          {/* Problem Statement */}
          <section className="mb-12">
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-4xl">❓</div>
                <h2 className="text-3xl font-bold">The Problem</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">
                We all forget where we put our everyday items. Keys, wallets, phones, chargers – 
                the mental load of remembering the location of hundreds of objects is exhausting. 
                Studies show people waste an average of <span className="text-primary-cyan font-semibold">2.5 days per year</span> 
                {' '}searching for misplaced items. This constant "Where did I put it?" stress adds up, 
                affecting productivity and mental well-being.
              </p>
            </div>
          </section>

          {/* Solution */}
          <section className="mb-12">
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-4xl">💡</div>
                <h2 className="text-3xl font-bold">The Solution</h2>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg mb-6">
                FindIt AI is an intelligent memory assistant that remembers where you stored your items. 
                Simply take a photo, describe the location, and our AI does the rest. When you need to 
                find something, just ask in natural language and get instant results.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                  >
                    <span className="text-xl">{feature.split(' ')[0]}</span>
                    <span className="text-gray-300">{feature.substring(feature.indexOf(' ') + 1)}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="mb-12">
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-4xl">🛠️</div>
                <h2 className="text-3xl font-bold">Tech Stack</h2>
              </div>
              <div className="space-y-6">
                {techStack.map((stack, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-xl font-semibold text-primary-cyan mb-3">{stack.category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {stack.items.map((item, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-white/5 border border-primary-cyan/30 rounded-lg text-sm font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-12">
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-4xl">⚙️</div>
                <h2 className="text-3xl font-bold">How It Works</h2>
              </div>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl font-bold text-primary-cyan">1.</span>
                  <p><strong>Image Capture:</strong> You upload a photo of an item. Our computer vision model (YOLOv8) 
                  automatically detects and identifies the object.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl font-bold text-primary-cyan">2.</span>
                  <p><strong>Storage:</strong> You describe where you placed it in natural language. 
                  The system stores the item name, location, image, and timestamp in a local SQLite database.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl font-bold text-primary-cyan">3.</span>
                  <p><strong>Recall:</strong> When searching, NLP extracts keywords from your query 
                  and matches them against stored items, returning the exact location instantly.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Future Scope */}
          <section>
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="text-4xl">🚀</div>
                <h2 className="text-3xl font-bold">Future Scope</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {futureScope.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-primary-cyan/30 transition-colors"
                  >
                    <span className="text-primary-cyan font-bold">•</span>
                    <span className="text-gray-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-16 text-gray-500"
          >
            <p className="text-sm">© 2025 FindIt AI - Academic Project</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutPage
