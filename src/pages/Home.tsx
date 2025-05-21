import { motion } from 'framer-motion'
import { Heart, MessageCircle, Brain, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-rose-50 to-white py-20 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-gray-900 mb-6"
          >
            Caring Support for Seniors
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 mb-8"
          >
            Get instant help, connect with caring volunteers, and access AI assistance - all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          <motion.div 
            whileHover={{ y: -5 }}
            className="card"
          >
            <Heart className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Caring Community</h3>
            <p className="text-gray-600">Join our supportive community of volunteers ready to help seniors with their daily needs.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="card"
          >
            <MessageCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">24/7 Chat Support</h3>
            <p className="text-gray-600">Connect with our volunteers anytime through our easy-to-use chat platform.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="card"
          >
            <Brain className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600">Get instant answers to your questions with our intelligent AI helper.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}