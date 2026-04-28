import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { getBalanceAmountByPeriod, getMaxWeekDayEarnings } from '@swiftdeliver/core'
import { fetchBalanceFromCore } from '../../data/coreClient'
import { appTheme } from '../../theme/appTheme'
import { AppText } from '../../ui/primitives'

const PERIOD_TABS = [
  { key: 'today', label: 'Сегодня' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
] as const

type PeriodKey = typeof PERIOD_TABS[number]['key']

export function MoneyScreen() {
  const [period, setPeriod] = useState<PeriodKey>('week')

  const { data: balance, isLoading } = useQuery({
    queryKey: ['balance'],
    queryFn: fetchBalanceFromCore,
  })

  const weekDays = balance?.weekDays ?? []
  const maxEarnings = useMemo(() => getMaxWeekDayEarnings(weekDays), [weekDays])
  const periodAmount = balance ? getBalanceAmountByPeriod(balance, period) : 0

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title">Деньги</AppText>
        <Pressable style={styles.headerIconBtn} accessibilityLabel="История операций">
          <Ionicons name="receipt-outline" size={18} color={appTheme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.periodsRow}>
        {PERIOD_TABS.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setPeriod(tab.key)}
            style={[
              styles.periodButton,
              period === tab.key ? styles.periodButtonActive : null,
            ]}
          >
            <AppText variant="label" style={period === tab.key ? styles.periodActiveText : styles.periodText}>
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {isLoading || !balance ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={appTheme.colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <AppText variant="label" style={styles.earningsLabel}>
                Заработано за период
              </AppText>
              <Ionicons name="trending-up" size={16} color="#6bdc9a" />
            </View>
            <View style={styles.earningsAmountRow}>
              <AppText variant="title" style={styles.earningsAmount}>
                {periodAmount.toLocaleString('ru-RU')}
              </AppText>
              <AppText variant="label" style={styles.earningsCurrency}>
                {balance.currency}
              </AppText>
            </View>

            {period === 'week' ? (
              <View style={styles.chart}>
                <View style={styles.chartBars}>
                  {weekDays.map(day => {
                    const height = Math.max(4, Math.round((day.earnings / maxEarnings) * 52))
                    return (
                      <View key={day.date} style={styles.chartCol}>
                        <View
                          style={[
                            styles.chartBar,
                            day.isToday ? styles.chartBarToday : null,
                            { height },
                          ]}
                        />
                      </View>
                    )
                  })}
                </View>
                <View style={styles.chartLabels}>
                  {weekDays.map(day => (
                    <View key={`${day.date}-${day.label}`} style={styles.chartLabel}>
                      <AppText variant="label" style={day.isToday ? styles.chartLabelToday : styles.chartLabelText}>
                        {day.date}
                      </AppText>
                      <AppText variant="label" style={day.isToday ? styles.chartLabelToday : styles.chartLabelSub}>
                        {day.label}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <AppText variant="label" style={styles.balanceLabel}>Баланс</AppText>
              <AppText variant="title" style={styles.balanceAmount}>
                {balance.balance.toLocaleString('ru-RU')} <AppText variant="label" style={styles.balanceCurrency}>{balance.currency}</AppText>
              </AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <AppText variant="label" style={styles.detailLabel}>Парк</AppText>
              <AppText variant="label" style={styles.detailValue}>{balance.park}</AppText>
            </View>
            <View style={styles.detailRow}>
              <AppText variant="label" style={styles.detailLabel}>Комиссия парка</AppText>
              <AppText variant="label" style={styles.detailValue}>{balance.commission}%</AppText>
            </View>
            <View style={styles.detailRow}>
              <AppText variant="label" style={styles.detailLabel}>Следующая выплата</AppText>
              <AppText variant="label" style={styles.detailValueBrand}>{balance.nextPayout}</AppText>
            </View>
          </View>

          <View style={styles.history}>
            <AppText variant="label" style={styles.historyTitle}>История</AppText>
            {balance.history.map(tx => {
              const isIncome = tx.amount > 0
              return (
                <View key={tx.id} style={styles.txItem}>
                  <View style={[styles.txIcon, isIncome ? styles.txIconIncome : styles.txIconPayout]}>
                    <Ionicons name={isIncome ? 'arrow-up-outline' : 'arrow-down-outline'} size={16} color={isIncome ? '#6bdc9a' : '#7ab7ff'} />
                  </View>
                  <View style={styles.txInfo}>
                    <AppText variant="body" style={styles.txLabel}>{tx.label}</AppText>
                    <AppText variant="label" style={styles.txDate}>{tx.date}</AppText>
                  </View>
                  <AppText
                    variant="body"
                    style={{ ...styles.txAmount, ...(isIncome ? styles.txAmountIncome : styles.txAmountPayout) }}
                  >
                    {isIncome ? '+' : ''}
                    {tx.amount.toLocaleString('ru-RU')} ₸
                  </AppText>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  header: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#151725',
    borderWidth: 1,
    borderColor: '#26293a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodsRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: '#141621',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(205,94,61,0.18)',
    borderColor: 'rgba(205,94,61,0.35)',
  },
  periodText: {
    color: appTheme.colors.textMuted,
  },
  periodActiveText: {
    color: appTheme.colors.primary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.lg,
    gap: appTheme.spacing.lg,
  },
  earningsCard: {
    backgroundColor: appTheme.colors.card,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsLabel: {
    color: appTheme.colors.textMuted,
  },
  earningsAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  earningsCurrency: {
    color: appTheme.colors.textMuted,
  },
  chart: {
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  chartCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    maxWidth: 24,
    backgroundColor: '#1b1e2b',
    borderRadius: 4,
  },
  chartBarToday: {
    backgroundColor: appTheme.colors.primary,
    opacity: 0.85,
  },
  chartLabels: {
    flexDirection: 'row',
    gap: 4,
  },
  chartLabel: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  chartLabelText: {
    color: appTheme.colors.text,
    fontSize: 11,
  },
  chartLabelSub: {
    color: appTheme.colors.textMuted,
    fontSize: 10,
  },
  chartLabelToday: {
    color: appTheme.colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  balanceCard: {
    backgroundColor: appTheme.colors.card,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: appTheme.colors.textMuted,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceCurrency: {
    color: appTheme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: appTheme.colors.border,
    opacity: 0.7,
    marginVertical: appTheme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: appTheme.colors.textMuted,
  },
  detailValue: {
    color: appTheme.colors.text,
  },
  detailValueBrand: {
    color: appTheme.colors.primary,
  },
  history: {
    gap: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.lg,
  },
  historyTitle: {
    color: appTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1c2b',
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconIncome: {
    backgroundColor: 'rgba(107,220,154,0.2)',
  },
  txIconPayout: {
    backgroundColor: 'rgba(122,183,255,0.18)',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    color: appTheme.colors.text,
    fontWeight: '500',
  },
  txDate: {
    color: appTheme.colors.textMuted,
    fontSize: 11,
  },
  txAmount: {
    fontWeight: '700',
  },
  txAmountIncome: {
    color: '#6bdc9a',
  },
  txAmountPayout: {
    color: '#7ab7ff',
  },
})
