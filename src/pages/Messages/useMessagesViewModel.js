import { useMemo } from 'react'
import { getMessagesSnapshot } from '../../services/courierDataService'
import { buildMessagesView } from '@core/use-cases/messages/buildMessagesView'

export function useMessagesViewModel() {
  const { messages, unreadCount, groupedMessages } = useMemo(
    () => buildMessagesView(getMessagesSnapshot()),
    [],
  )

  return {
    messages,
    unreadCount,
    groupedMessages,
  }
}
