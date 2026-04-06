import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { SLOT_STATE, countBookedSlots, getSlotState, groupSlotsByDate, type CourierSlot } from '@swiftdeliver/core'
import { fetchSlotsFromCore } from '../../data/coreClient'
import { appTheme } from '../../theme/appTheme'
import { AppText } from '../../ui/primitives'

type Slot = CourierSlot

type SlotGroup = {
  label: string
  slots: Slot[]
}

export function SlotsScreen() {
  const SLOT_STATUS = useMemo(() => ({
    [SLOT_STATE.BOOKED]: {
      label: 'Забронирован',
      badgeStyle: styles.badgeSuccess,
      badgeText: styles.badgeSuccessText,
      btnLabel: 'Отменить',
      btnStyle: styles.btnDanger,
      btnText: styles.btnDangerText,
    },
    [SLOT_STATE.AVAILABLE]: {
      label: 'Доступен',
      badgeStyle: styles.badgeNeutral,
      badgeText: styles.badgeNeutralText,
      btnLabel: 'Забронировать',
      btnStyle: styles.btnPrimary,
      btnText: styles.btnPrimaryText,
    },
    [SLOT_STATE.CLOSED]: {
      label: 'Недоступен',
      badgeStyle: styles.badgeError,
      badgeText: styles.badgeErrorText,
      btnLabel: null,
      btnStyle: null,
      btnText: null,
    },
  }), [])

  const { data: slotsSnapshot = [], isLoading } = useQuery({
    queryKey: ['slots'],
    queryFn: fetchSlotsFromCore,
  })

  const [slots, setSlots] = useState<Slot[]>([])
  const hasHydratedRef = useRef(false)

  useEffect(() => {
    if (hasHydratedRef.current) return
    if (!Array.isArray(slotsSnapshot) || slotsSnapshot.length === 0) return
    setSlots(slotsSnapshot as Slot[])
    hasHydratedRef.current = true
  }, [slotsSnapshot])

  const grouped = useMemo(
    () => groupSlotsByDate(slots) as Record<string, SlotGroup>,
    [slots],
  )
  const bookedCount = countBookedSlots(slots)

  const toggle = (id: string) => {
    setSlots(prev =>
      prev.map(slot => (slot.id === id ? { ...slot, booked: !slot.booked } : slot)),
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title">Слоты</AppText>
        {bookedCount > 0 ? (
          <View style={styles.headerBadge}>
            <Ionicons name="calendar-outline" size={12} color="#ffd7c9" />
            <AppText variant="label" style={styles.headerBadgeText}>
              {bookedCount} забронировано
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="subtitle" style={styles.subtitle}>
        Выберите рабочие интервалы на ближайшие дни
      </AppText>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={appTheme.colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {Object.entries(grouped).map(([key, group]) => (
            <View key={key} style={styles.group}>
              <AppText variant="label" style={styles.groupTitle}>
                {group.label}
              </AppText>

              <View style={styles.groupList}>
                {group.slots.map(slot => {
                  const slotKey = getSlotState(slot)
                  const cfg = SLOT_STATUS[slotKey]
                  const isClosed = !slot.available

                  return (
                    <View
                      key={slot.id}
                      style={[
                        styles.slotCard,
                        slot.booked ? styles.slotCardBooked : null,
                        isClosed ? styles.slotCardClosed : null,
                      ]}
                    >
                      {isClosed ? (
                        <Ionicons name="lock-closed" size={14} color="#8f94a8" style={styles.lockIcon} />
                      ) : null}

                      <View style={styles.slotInfo}>
                        <AppText variant="body" style={styles.slotTime}>
                          {slot.time}
                        </AppText>
                        <View style={[styles.badge, cfg.badgeStyle]}>
                          <AppText variant="label" style={cfg.badgeText}>
                            {cfg.label}
                          </AppText>
                        </View>
                      </View>

                      {cfg.btnLabel ? (
                        <Pressable
                          onPress={() => toggle(slot.id)}
                          style={[styles.slotBtn, cfg.btnStyle]}
                          accessibilityLabel={`${cfg.btnLabel} слот ${slot.time}`}
                        >
                          <AppText variant="label" style={cfg.btnText}>
                            {cfg.btnLabel}
                          </AppText>
                        </Pressable>
                      ) : null}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTheme.spacing.sm,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(205, 94, 61, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(205, 94, 61, 0.4)',
  },
  headerBadgeText: {
    color: '#ffd7c9',
  },
  subtitle: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.md,
    marginTop: -appTheme.spacing.xs,
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
  group: {
    gap: appTheme.spacing.sm,
  },
  groupTitle: {
    color: appTheme.colors.textMuted,
    textTransform: 'capitalize',
  },
  groupList: {
    gap: appTheme.spacing.sm,
  },
  slotCard: {
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTheme.spacing.md,
  },
  slotCardBooked: {
    borderColor: 'rgba(52, 211, 153, 0.25)',
    backgroundColor: 'rgba(52, 211, 153, 0.04)',
  },
  slotCardClosed: {
    opacity: 0.5,
  },
  lockIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  slotInfo: {
    gap: appTheme.spacing.xs,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
  },
  badgeSuccessText: {
    color: '#7ef1bf',
  },
  badgeNeutral: {
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  badgeNeutralText: {
    color: '#d1d5db',
  },
  badgeError: {
    backgroundColor: 'rgba(248, 113, 113, 0.18)',
  },
  badgeErrorText: {
    color: '#fca5a5',
  },
  slotBtn: {
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: appTheme.colors.primary,
  },
  btnPrimaryText: {
    color: '#fff7f3',
  },
  btnDanger: {
    borderWidth: 1,
    borderColor: '#6d2d3b',
    backgroundColor: '#351c24',
  },
  btnDangerText: {
    color: '#ffd9df',
  },
})
