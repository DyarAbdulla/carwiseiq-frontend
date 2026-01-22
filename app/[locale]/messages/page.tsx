"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { useLocale } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, Star, Trash2, MoreVertical, 
  ChevronLeft, Image as ImageIcon, Send, Paperclip
} from 'lucide-react'
import ChatInterface from '@/components/messaging/ChatInterface'

interface Conversation {
  id: number
  listing_id: number
  other_user_id: number
  other_user_email: string
  last_message: string | null
  last_message_time: string | null
  unread_count: number
  is_starred: boolean
  listing: {
    id: number
    make: string
    model: string
    year: number
    price: number
    image_url: string | null
  }
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Get initial conversation from URL params
  const listingIdParam = searchParams.get('listing')
  const userIdParam = searchParams.get('user')

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push(`/${locale}/login`)
      return
    }
    loadConversations()
    loadUnreadCount()
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    // Auto-select conversation from URL params
    if (listingIdParam && userIdParam && conversations.length > 0) {
      const conv = conversations.find(
        c => c.listing_id === parseInt(listingIdParam) && c.other_user_id === parseInt(userIdParam)
      )
      if (conv) {
        setSelectedConversation(conv)
      } else {
        // Create new conversation if it doesn't exist
        setSelectedConversation({
          id: 0,
          listing_id: parseInt(listingIdParam),
          other_user_id: parseInt(userIdParam),
          other_user_email: '',
          last_message: null,
          last_message_time: null,
          unread_count: 0,
          is_starred: false,
          listing: {
            id: parseInt(listingIdParam),
            make: '',
            model: '',
            year: 0,
            price: 0,
            image_url: null
          }
        })
      }
    }
  }, [listingIdParam, userIdParam, conversations])

  const loadConversations = async () => {
    try {
      const data = await apiClient.getConversations()
      setConversations(data.conversations || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load conversations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const count = await apiClient.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      // Ignore errors
    }
  }

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await apiClient.deleteConversation(conversationId)
      setConversations(conversations.filter(c => c.id !== conversationId))
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
      }
      toast({ title: 'Conversation deleted' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete conversation',
        variant: 'destructive'
      })
    }
  }

  const handleStarConversation = async (conversationId: number, starred: boolean) => {
    try {
      await apiClient.starConversation(conversationId, !starred)
      setConversations(conversations.map(c => 
        c.id === conversationId ? { ...c, is_starred: !starred } : c
      ))
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, is_starred: !starred })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to star conversation',
        variant: 'destructive'
      })
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto pt-20 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <div className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
            <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-gray-400 text-center">Loading...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-gray-400 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm mt-2">Start a conversation from a listing!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {conversations
                        .sort((a, b) => {
                          // Starred first, then by last message time
                          if (a.is_starred !== b.is_starred) {
                            return a.is_starred ? -1 : 1
                          }
                          const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0
                          const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0
                          return timeB - timeA
                        })
                        .map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv)}
                            className={`p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
                              selectedConversation?.id === conv.id ? 'bg-gray-700' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {conv.listing.image_url ? (
                                  <img
                                    src={conv.listing.image_url}
                                    alt={`${conv.listing.make} ${conv.listing.model}`}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-gray-600 flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-white font-semibold truncate">
                                    {conv.listing.make} {conv.listing.model} {conv.listing.year}
                                  </p>
                                  {conv.is_starred && (
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm truncate">
                                  {conv.last_message || 'No messages yet'}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-gray-500 text-xs">
                                    {formatTime(conv.last_message_time)}
                                  </p>
                                  {conv.unread_count > 0 && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                      {conv.unread_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className={`lg:col-span-2 ${!selectedConversation ? 'hidden lg:block' : ''}`}>
            {selectedConversation ? (
              <ChatInterface
                conversation={selectedConversation}
                onBack={() => setSelectedConversation(null)}
                onDelete={() => handleDeleteConversation(selectedConversation.id)}
                onStar={() => handleStarConversation(selectedConversation.id, selectedConversation.is_starred)}
                onMessageSent={() => {
                  loadConversations()
                  loadUnreadCount()
                }}
              />
            ) : (
              <Card className="bg-gray-800 border-gray-700 h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">Select a conversation to start messaging</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
