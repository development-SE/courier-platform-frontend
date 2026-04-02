import { BellRing, Headphones, AlertTriangle, Info } from 'lucide-react'
import { useMessagesViewModel } from './useMessagesViewModel'
import './MessagesPage.css'

const SOURCE_CONFIG = {
  system: { Icon: BellRing, label: 'Система', className: 'msg-icon--system' },
  support: { Icon: Headphones, label: 'Поддержка', className: 'msg-icon--support' },
}

const PRIORITY_CONFIG = {
  high: { Icon: AlertTriangle, className: 'badge--error' },
  normal: { Icon: Info, className: 'badge--info' },
  low: { Icon: Info, className: 'badge--neutral' },
}

function MessageItem({ msg }) {
  const sourceKey = msg.sourceType ?? 'system'
  const src = SOURCE_CONFIG[sourceKey] ?? SOURCE_CONFIG.system
  const priority = PRIORITY_CONFIG[msg.priority] ?? PRIORITY_CONFIG.normal

  return (
    <article className={`msg-item${msg.unread ? ' msg-item--unread' : ''}`} aria-label={`Сообщение от ${msg.source}: ${msg.title}`}>
      <div className={`msg-item__icon ${src.className}`}>
        <src.Icon size={18} strokeWidth={1.8} />
      </div>

      <div className="msg-item__body">
        <div className="msg-item__meta">
          <span className="msg-item__source">{msg.source}</span>
          <span className="msg-item__time">{msg.date === 'Сегодня' ? msg.time : msg.date}</span>
        </div>

        <div className="msg-item__title">{msg.title}</div>
        <p className="msg-item__text">{msg.text}</p>

        {msg.priority === 'high' && (
          <span className={`badge ${priority.className}`}>
            <priority.Icon size={10} strokeWidth={2.5} />
            Требует внимания
          </span>
        )}
      </div>

      {msg.unread && <div className="msg-item__dot" aria-hidden="true" />}
    </article>
  )
}

export default function MessagesPage() {
  const { messages, unreadCount, groupedMessages } = useMessagesViewModel()

  return (
    <div className="messages-page">
      <header className="page-header">
        <h1 className="page-title">Сообщения</h1>
        {unreadCount > 0 && <span className="badge badge--error">{unreadCount} новых</span>}
      </header>

      {Object.entries(groupedMessages).map(([date, items]) => (
        <section key={date} className="messages-group">
          <div className="messages-group__date">{date}</div>
          {items.map(message => (
            <MessageItem key={message.id} msg={message} />
          ))}
        </section>
      ))}

      {messages.length === 0 && (
        <div className="messages-empty">
          <BellRing size={44} strokeWidth={1} />
          <span>Нет сообщений</span>
        </div>
      )}
    </div>
  )
}
