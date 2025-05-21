import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface AIConversation {
  id: string
  message: string
  response: string
  created_at: string
}

export function Dashboard() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<AIConversation[]>([])

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
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="space-y-6">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 mb-2">Your message:</p>
            <p className="mb-4">{conversation.message}</p>
            <p className="text-gray-600 mb-2">AI response:</p>
            <p>{conversation.response}</p>
            <p className="text-sm text-gray-500 mt-4">
              {new Date(conversation.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}