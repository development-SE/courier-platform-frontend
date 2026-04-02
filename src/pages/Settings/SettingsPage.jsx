import { useState } from 'react'
import { settingsData } from '../../mock/courier'
import './SettingsPage.css'

export default function SettingsPage() {
  const [language] = useState(settingsData.language)
  const [theme] = useState(settingsData.theme)

  return (
    <section className="page settings-page">
      <h1 className="page-title">Settings</h1>

      <article className="card settings-group">
        <h2>General</h2>
        <div className="settings-row"><span>Language</span><strong>{language}</strong></div>
        <div className="settings-row"><span>Theme</span><strong>{theme}</strong></div>
      </article>

      <article className="card settings-group">
        <h2>Notifications</h2>
        <div className="settings-row"><span>Push notifications</span><strong>{settingsData.notifications ? 'On' : 'Off'}</strong></div>
      </article>

      <article className="card settings-group">
        <h2>Map preferences</h2>
        <div className="settings-row"><span>Traffic layer</span><strong>{settingsData.mapTraffic ? 'On' : 'Off'}</strong></div>
        <div className="settings-row"><span>3D buildings</span><strong>{settingsData.map3d ? 'On' : 'Off'}</strong></div>
      </article>

      <article className="card settings-group">
        <h2>About app</h2>
        <p className="muted">SwiftDeliver Courier · v1.0.0</p>
      </article>
    </section>
  )
}
