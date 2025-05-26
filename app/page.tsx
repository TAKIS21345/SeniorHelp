"use client";
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { // Add transition to item for smoother appearance
        duration: 0.5,
        ease: "easeOut"
      }
    },
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Hero Section (remains unchanged from previous step) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-100"
      >
        <div className="max-w-4xl mx-auto text-center py-24 sm:py-32 px-6 sm:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }} // Added duration/ease
            className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-6"
          >
            Caring Support for Seniors
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }} // Added duration/ease
            className="text-lg lg:text-xl text-neutral-700 mb-8"
          >
            Get instant help, connect with caring volunteers, and access AI assistance - all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }} // Added duration/ease
          >
            <Link href="/signup" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants} // Apply container variants
            initial="hidden"             // Set initial state for container
            whileInView="show"           // Animate to "show" state when in view
            viewport={{ once: true, amount: 0.2 }} // amount:0.2 triggers when 20% of element is visible
          >
            {/* Card 1 */}
            <motion.div
              className="card"
              variants={itemVariants} // Apply item variants (will inherit initial/animate from parent)
              whileHover={{ y: -5, scale: 1.03 }} // Refined hover effect
            >
              <div className="card-content">
                <Heart className="w-12 h-12 text-primary-DEFAULT mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-neutral-900">Caring Community</h3>
                <p className="text-neutral-600">Join our supportive community of volunteers ready to help seniors with their daily needs.</p>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              className="card"
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.03 }}
            >
              <div className="card-content">
                <MessageCircle className="w-12 h-12 text-primary-DEFAULT mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-neutral-900">24/7 Chat Support</h3>
                <p className="text-neutral-600">Connect with our volunteers anytime through our easy-to-use chat platform.</p>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              className="card"
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.03 }}
            >
              <div className="card-content">
                <Brain className="w-12 h-12 text-primary-DEFAULT mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-neutral-900">AI Assistant</h3>
                <p className="text-neutral-600">Get instant answers to your questions with our intelligent AI helper.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
