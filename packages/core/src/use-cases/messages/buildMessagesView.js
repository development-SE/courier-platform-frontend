import { countUnreadMessages, groupMessagesByDate, normalizeMessages } from '../../domain/messages/model'

export function buildMessagesView(rawMessages) {
  const messages = normalizeMessages(rawMessages)

  return {
    messages,
    unreadCount: countUnreadMessages(messages),
    groupedMessages: groupMessagesByDate(messages),
  }
}
