export const MESSAGE_SOURCE = {
  SYSTEM: 'system',
  SUPPORT: 'support',
}

const SOURCE_BY_NAME = {
  Система: MESSAGE_SOURCE.SYSTEM,
  Поддержка: MESSAGE_SOURCE.SUPPORT,
}

export function normalizeMessage(rawMessage) {
  return {
    ...rawMessage,
    sourceType: rawMessage.sourceType ?? SOURCE_BY_NAME[rawMessage.source] ?? MESSAGE_SOURCE.SYSTEM,
    priority: rawMessage.priority ?? 'normal',
    unread: Boolean(rawMessage.unread),
  }
}

export function normalizeMessages(rawMessages) {
  return rawMessages.map(message => normalizeMessage(message))
}

export function countUnreadMessages(messages) {
  return messages.reduce((total, message) => total + (message.unread ? 1 : 0), 0)
}

export function groupMessagesByDate(messages) {
  return messages.reduce((accumulator, message) => {
    if (!accumulator[message.date]) {
      accumulator[message.date] = []
    }
    accumulator[message.date].push(message)
    return accumulator
  }, {})
}
