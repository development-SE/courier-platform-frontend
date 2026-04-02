import { useMemo, useState } from 'react'
import { centerData } from '../../mock/courier'
import './CenterPage.css'

const TABS = ['Notifications', 'Support', 'Announcements']

export default function CenterPage() {
  const [tab, setTab] = useState(TABS[0])

  const items = useMemo(() => {
    if (tab === 'Notifications') return centerData.notifications
    if (tab === 'Support') return centerData.support
    return centerData.announcements
  }, [tab])

  return (
    <section className="page center-page">
      <h1 className="page-title">Center</h1>

      <div className="center-tabs card">
        {TABS.map(item => (
          <button
            key={item}
            type="button"
            className={`center-tabs__tab${tab === item ? ' center-tabs__tab--active' : ''}`}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="center-list">
        {items.map(item => (
          <article key={item.id} className="card center-list__item">
            <div className="center-list__head">
              <strong>{item.title}</strong>
              {'priority' in item && item.priority === 'high' && <span className="chip">High</span>}
              {'status' in item && <span className="chip">{item.status}</span>}
            </div>
            <p>{item.text ?? item.updated}</p>
            <small className="muted">{'time' in item ? item.time : item.date}</small>
          </article>
        ))}
      </div>
    </section>
  )
}
