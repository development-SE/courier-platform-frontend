import { useState } from 'react'
import { CalendarCheck, Lock } from 'lucide-react'
import { getSlotsSnapshot } from '../../services/courierDataService'
import { SLOT_STATE, countBookedSlots, getSlotState, groupSlotsByDate } from '../../domain/slots/model'
import './SlotsPage.css'

const SLOT_STATUS = {
  [SLOT_STATE.BOOKED]: {
    label: 'Забронирован',
    className: 'badge--success',
    btnLabel: 'Отменить',
    btnClass: 'btn--danger',
  },
  [SLOT_STATE.AVAILABLE]: {
    label: 'Доступен',
    className: 'badge--neutral',
    btnLabel: 'Забронировать',
    btnClass: 'btn--primary',
  },
  [SLOT_STATE.CLOSED]: {
    label: 'Недоступен',
    className: 'badge--error',
    btnLabel: null,
    btnClass: null,
  },
}

export default function SlotsPage() {
  const [slotState, setSlotState] = useState(getSlotsSnapshot())

  const toggle = id => {
    setSlotState(prev => prev.map(slot => (slot.id === id ? { ...slot, booked: !slot.booked } : slot)))
  }

  const grouped = groupSlotsByDate(slotState)

  const bookedCount = countBookedSlots(slotState)

  return (
    <div className="slots-page">
      <header className="page-header">
        <h1 className="page-title">Слоты</h1>
        {bookedCount > 0 && (
          <span className="badge badge--brand">
            <CalendarCheck size={11} strokeWidth={2.5} />
            {bookedCount} забронировано
          </span>
        )}
      </header>

      <p className="slots-page__subtitle">Выберите рабочие интервалы на ближайшие дни</p>

      {Object.entries(grouped).map(([, group]) => (
        <section key={group.label} className="slots-group">
          <div className="slots-group__date">{group.label}</div>

          <div className="slots-group__list">
            {group.slots.map(slot => {
              const slotKey = getSlotStatus(slot)
              const cfg = SLOT_STATUS[slotKey]

              return (
                <div
                  key={slot.id}
                  className={`slot-card${slot.booked ? ' slot-card--booked' : ''}${!slot.available ? ' slot-card--closed' : ''}`}
                >
                  {!slot.available && <Lock size={14} strokeWidth={2} className="slot-card__lock" />}

                  <div className="slot-card__info">
                    <span className="slot-card__time">{slot.time}</span>
                    <span className={`badge ${cfg.className}`}>{cfg.label}</span>
                  </div>

                  {cfg.btnLabel && (
                    <button
                      type="button"
                      className={`btn btn--sm ${cfg.btnClass}`}
                      onClick={() => toggle(slot.id)}
                      aria-label={`${cfg.btnLabel} слот ${slot.time}`}
                    >
                      {cfg.btnLabel}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
