import { useMemo } from 'react'
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { getCourierInitials } from '@swiftdeliver/core'
import { fetchCourierProfileFromCore } from '../../data/coreClient'
import { appTheme } from '../../theme/appTheme'
import { useAuthStore } from '../../store/authStore'
import { AppButton, AppText } from '../../ui/primitives'

const PROFILE_ITEMS = [
  'Статус на линии',
  'Тип транспорта',
  'Проверка личности',
  'Доступ к парку',
  'Счёт для выплат',
  'История выплат',
  'Уведомления',
  'Язык',
]

export function ProfileScreen() {
  const signOut = useAuthStore(state => state.signOut)

  const { data: courier } = useQuery({
    queryKey: ['courier-profile'],
    queryFn: fetchCourierProfileFromCore,
  })

  const initials = useMemo(() => (courier ? getCourierInitials(courier) : '--'), [courier])
  const fullName = courier ? `${courier.name} ${courier.lastName}`.trim() : 'Курьер'
  const park = courier?.park ?? '—'
  const rating = courier?.rating ?? 0

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="title">Профиль</AppText>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <AppText variant="label" style={styles.avatarText}>{initials}</AppText>
          </View>
          <View style={styles.identityInfo}>
            <AppText variant="body" style={styles.identityName}>{fullName}</AppText>
            <AppText variant="label" style={styles.identityMuted}>{park}</AppText>
            <AppText variant="label" style={styles.identityMuted}>Рейтинг {rating} · Курьер</AppText>
          </View>
        </View>

        <View style={styles.groupCard}>
          {PROFILE_ITEMS.map((label, index) => (
            <Pressable
              key={label}
              style={[styles.profileRow, index === 0 ? styles.profileRowFirst : null]}
            >
              <AppText variant="body" style={styles.profileRowText}>{label}</AppText>
              <Ionicons name="chevron-forward" size={16} color="#7b7b96" />
            </Pressable>
          ))}
        </View>

        <AppButton
          title="Выйти"
          variant="danger"
          onPress={() => void signOut()}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f2e1db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: appTheme.colors.primary,
    fontWeight: '700',
  },
  identityInfo: {
    gap: 2,
    flex: 1,
  },
  identityName: {
    fontWeight: '700',
  },
  identityMuted: {
    color: appTheme.colors.textMuted,
  },
  groupCard: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    overflow: 'hidden',
  },
  profileRow: {
    minHeight: 46,
    paddingHorizontal: appTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },
  profileRowFirst: {
    borderTopWidth: 0,
  },
  profileRowText: {
    color: appTheme.colors.text,
  },
  logoutBtn: {
    marginTop: 4,
    width: '100%',
  },
})
