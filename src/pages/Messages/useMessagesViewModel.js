import { useMemo } from 'react'
import { getMessagesSnapshot } from '../../services/courierDataService'
import { countUnreadMessages, groupMessagesByDate } from '../../domain/messages/model'

export function useMessagesViewModel() {
  const messages = useMemo(() => getMessagesSnapshot(), [])

  const unreadCount = useMemo(
    () => countUnreadMessages(messages),
    [messages],
  )

  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages],
  )

  return {
    messages,
    unreadCount,
    groupedMessages,
  }
}
