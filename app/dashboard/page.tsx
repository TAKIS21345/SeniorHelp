"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, Brain, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// import toast, { Toaster } from 'react-hot-toast'; // Import Toaster if you want to show toasts
// import { Bot } from '@botpress/client';

interface AIConversation {
  id: string;
  message: string;
  response: string;
  created_at: string;
  user_id?: string; // Added user_id to interface
}

// const bot = new Bot({ /* TODO: Add your Botpress credentials here */ });

export default function DashboardPage() {
  const { user, isLoading, supabase } = useAuth(); // Use supabase from context if needed
  const router = useRouter();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false); // Separate loading for AI

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Check for supabase client from context as well before calling loadConversations
    if (user && supabase) { 
      loadConversations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, router, supabase]); // Added supabase to dependency array

  const loadConversations = async () => {
    if (!supabase || !user) return; // Guard if supabase client or user isn't ready
    console.log("Attempting to load conversations for user:", user.id);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id) // Ensure user_id matches
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // toast.error('Failed to load conversations');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !supabase || !user) return; // Guard if supabase/user isn't ready
    setAiLoading(true);
    console.log("Form submitted with message:", message);
    
    // Placeholder for Botpress logic
    // const botResponse = await bot.sendMessage(message); 
    const placeholderResponse = "This is a placeholder AI response to: " + message;

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .insert([{ message: message, response: placeholderResponse, user_id: user.id }]); // Ensure user_id is inserted
      
      if (error) throw error;

      setMessage('');
      loadConversations(); // Reload conversations
      // toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message to Supabase:', error);
      // toast.error('Failed to send message');
    } finally {
      setAiLoading(false);
    }
  };
  
  if (isLoading || !user) { // Initial loading or no user, show loading
    return <div className="min-h-screen flex items-center justify-center"><p>Loading dashboard...</p></div>;
  }

  // If done loading and still no user (should be caught by useEffect redirect, but as a fallback)
  // This specific check might be redundant if useEffect handles redirect reliably.
  // if (!user) {
  //   return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to login...</p></div>;
  // }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      {/* <Toaster /> */} {/* Add Toaster for react-hot-toast */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.email}!</h1>
        <p className="text-gray-600 mb-8">This is your dashboard.</p>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div whileHover={{ y: -5 }} className="card bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-lg shadow">
                <MessageCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Chat with Helpers</h2>
                <p className="text-gray-600 mb-4">Connect with our caring support team for personalized assistance.</p>
                <button className="btn-primary bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600">Start Chat</button>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="card bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
                <Brain className="w-12 h-12 text-blue-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
                <p className="text-gray-600 mb-4">Get quick answers from our AI helper.</p>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask anything..." className="input flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={aiLoading} />
                    <button type="submit" className="btn-primary bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center" disabled={aiLoading}>
                        {aiLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </motion.div>
        </div>
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Recent AI Conversations</h2>
            {conversations.length === 0 && !aiLoading && <p className="text-gray-500">No conversations yet. Ask the AI assistant something!</p>}
            {conversations.map((conversation) => (
            <motion.div key={conversation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 rounded-lg shadow bg-white">
                <div className="flex items-start gap-4">
                <div className="flex-1">
                    <p className="text-gray-600 text-sm mb-1">You asked:</p>
                    <p className="mb-4 whitespace-pre-wrap">{conversation.message}</p>
                    <p className="text-gray-600 text-sm mb-1">AI response:</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{conversation.response}</p>
                </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">{new Date(conversation.created_at).toLocaleDateString()}</p>
            </motion.div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
