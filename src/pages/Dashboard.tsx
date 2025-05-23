import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Brain, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Client } from '@botpress/client'

interface AIConversation {
  id: string
  message: string
  response: string
  created_at: string
}

const client = new Client({ 
  // Add your Botpress credentials here
})

export function Dashboard() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    try {
      const response = await client.createConversation({
        message: message,
        integration: 'default'
      })
      
      const { error } = await supabase
        .from('ai_conversations')
        .insert([
          {
            message: message,
            response: response.message,
            user_id: user?.id
          }
        ])

      if (error) throw error

      setMessage('')
      loadConversations()
      toast.success('Message sent successfully')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Welcome to Your Dashboard</h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="card bg-gradient-to-br from-rose-50 to-rose-100"
          >
            <MessageCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chat with Helpers</h2>
            <p className="text-gray-600 mb-4">Connect with our caring support team for personalized assistance.</p>
            <button className="btn-primary">Start Chat</button>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="card bg-gradient-to-br from-blue-50 to-blue-100"
          >
            <Brain className="w-12 h-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
            <p className="text-gray-600 mb-4">Get quick answers from our AI helper.</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything..."
                className="input flex-1"
                disabled={loading}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Recent Conversations</h2>
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm mb-1">You asked:</p>
                  <p className="mb-4">{conversation.message}</p>
                  <p className="text-gray-600 text-sm mb-1">AI response:</p>
                  <p className="text-gray-800">{conversation.response}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {new Date(conversation.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}