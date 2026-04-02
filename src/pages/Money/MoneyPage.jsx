import { useState } from 'react'
import { TrendingUp, ArrowUpRight, ArrowDownLeft, ReceiptText } from 'lucide-react'
import { getBalanceSnapshot } from '../../services/courierDataService'
import { getBalanceAmountByPeriod, getMaxWeekDayEarnings } from '../../domain/balance/model'
import './MoneyPage.css'

const BALANCE = getBalanceSnapshot()

const PERIOD_TABS = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
]

const TX_ICONS = {
  order: ArrowUpRight,
  payout: ArrowDownLeft,
}

export default function MoneyPage() {
  const [period, setPeriod] = useState('week')
  const { weekDays, balance, currency, park, nextPayout, commission, history } = BALANCE
  const maxEarnings = getMaxWeekDayEarnings(weekDays)
  const periodAmount = getBalanceAmountByPeriod(BALANCE, period)

  return (
    <div className="money-page">
      <header className="page-header money-page__header">
        <h1 className="page-title">Деньги</h1>
        <button type="button" className="icon-btn" aria-label="История операций">
          <ReceiptText size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="money-page__periods">
        {PERIOD_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`money-page__period-btn${period === tab.key ? ' money-page__period-btn--active' : ''}`}
            onClick={() => setPeriod(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="money-page__earnings card">
        <div className="money-page__earnings-header">
          <span className="money-page__earnings-label">Заработано за период</span>
          <TrendingUp size={16} strokeWidth={2} className="money-page__trend-icon" />
        </div>
        <div className="money-page__earnings-amount">
          {periodAmount.toLocaleString('ru-RU')}
          <span className="money-page__earnings-currency"> {currency}</span>
        </div>

        {period === 'week' && (
          <div className="money-chart">
            <div className="money-chart__bars">
              {weekDays.map(day => (
                <div key={day.date} className={`money-chart__col${day.isToday ? ' money-chart__col--today' : ''}`}>
                  <div
                    className="money-chart__bar"
                    style={{ height: `${Math.max(4, Math.round((day.earnings / maxEarnings) * 52))}px` }}
                    aria-label={`${day.label} ${day.earnings} ${currency}`}
                  />
                </div>
              ))}
            </div>
            <div className="money-chart__labels">
              {weekDays.map(day => (
                <div key={`${day.date}-${day.label}`} className={`money-chart__label${day.isToday ? ' money-chart__label--today' : ''}`}>
                  <span>{day.date}</span>
                  <span>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="money-page__balance card">
        <div className="money-page__balance-row">
          <span className="money-page__balance-label">Баланс</span>
          <span className="money-page__balance-amount">
            {balance.toLocaleString('ru-RU')} <span className="money-page__balance-currency">{currency}</span>
          </span>
        </div>
        <div className="divider" style={{ margin: `var(--sp-3) 0` }} />
        <div className="money-page__detail-row">
          <span className="money-page__detail-label">Парк</span>
          <span className="money-page__detail-value">{park}</span>
        </div>
        <div className="money-page__detail-row">
          <span className="money-page__detail-label">Комиссия парка</span>
          <span className="money-page__detail-value">{commission}%</span>
        </div>
        <div className="money-page__detail-row">
          <span className="money-page__detail-label">Следующая выплата</span>
          <span className="money-page__detail-value money-page__detail-value--brand">{nextPayout}</span>
        </div>
      </div>

      <div className="money-page__history">
        <div className="money-page__history-title">История</div>
        {history.map(tx => {
          const Icon = TX_ICONS[tx.type] ?? ArrowUpRight
          const isIncome = tx.amount > 0

          return (
            <div key={tx.id} className="tx-item">
              <div className={`tx-item__icon${isIncome ? ' tx-item__icon--income' : ' tx-item__icon--payout'}`}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="tx-item__info">
                <span className="tx-item__label">{tx.label}</span>
                <span className="tx-item__date">{tx.date}</span>
              </div>
              <span className={`tx-item__amount${isIncome ? ' tx-item__amount--income' : ' tx-item__amount--payout'}`}>
                {isIncome ? '+' : ''}
                {tx.amount.toLocaleString('ru-RU')} ₸
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
