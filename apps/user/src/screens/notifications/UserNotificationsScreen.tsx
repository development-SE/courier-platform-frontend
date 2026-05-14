import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  formatPushNotificationTime,
  loadStoredPushNotifications,
  markAllPushNotificationsRead,
  markPushNotificationRead,
  type PushInboxCategory,
  type PushInboxNotification,
} from '../../data/notificationsInbox'

const filters: Array<'All' | PushInboxCategory> = ['All', 'Orders', 'Promotions', 'System']

type UserNotificationsScreenProps = {
  reloadKey?: number
  onBackPress?: () => void
  onNotificationPress?: (notification: PushInboxNotification) => void
  onNotificationsChanged?: () => void
}

function resolveNotificationPresentation(notification: PushInboxNotification) {
  if (notification.category === 'Orders') {
    return {
      titleColor: '#001A43',
      messageColor: '#004397',
      timeColor: 'rgba(0, 26, 67, 0.70)',
      cardColor: '#D8E2FF',
      iconBg: '#FFFFFF',
      icon: <MaterialCommunityIcons name="card-text" size={20} color="#1E5BBA" />,
    }
  }

  if (notification.category === 'Promotions') {
    return {
      cardColor: '#FFFFFF',
      iconBg: '#FFDAD2',
      icon: <Feather name="tag" size={20} color="#A7391E" />,
    }
  }

  return {
    cardColor: '#FFFFFF',
    iconBg: '#E6E8EA',
    icon: <FontAwesome5 name="check-circle" size={18} color="#446744" />,
  }
}

export function UserNotificationsScreen({
  reloadKey = 0,
  onBackPress,
  onNotificationPress,
  onNotificationsChanged,
}: UserNotificationsScreenProps) {
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState<'All' | PushInboxCategory>('All')
  const [notifications, setNotifications] = useState<PushInboxNotification[]>([])

  const refreshNotifications = useCallback(async () => {
    const nextNotifications = await loadStoredPushNotifications()
    setNotifications(nextNotifications)
  }, [])

  useEffect(() => {
    void refreshNotifications()
  }, [refreshNotifications, reloadKey])

  const visibleNotifications = useMemo(() => {
    if (activeFilter === 'All') {
      return notifications
    }

    return notifications.filter(notification => notification.category === activeFilter)
  }, [activeFilter, notifications])

  return (
    <SafeAreaView edges={[]} style={styles.screen}>
      <View style={[styles.header, { height: 64 + insets.top, paddingTop: insets.top }]}>
        <Pressable onPress={onBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#191C1E" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={async () => {
            await markAllPushNotificationsRead()
            await refreshNotifications()
            onNotificationsChanged?.()
          }}
          disabled={!notifications.length}
        >
          <Text
            allowFontScaling={false}
            style={[styles.markRead, !notifications.length && styles.markReadDisabled]}
          >
            Mark all as read
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 128 + insets.bottom }]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filters.map(filter => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive,
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {!visibleNotifications.length ? (
            <View style={styles.emptyCard}>
              <Feather name="bell" size={22} color="#8B716B" />
              <Text allowFontScaling={false} style={styles.emptyTitle}>No notifications yet</Text>
              <Text allowFontScaling={false} style={styles.emptyText}>
                Incoming push notifications will appear here once the device receives them.
              </Text>
            </View>
          ) : (
            visibleNotifications.map(notification => {
              const presentation = resolveNotificationPresentation(notification)

              return (
                <Pressable
                  key={notification.id}
                  onPress={async () => {
                    if (notification.unread) {
                      await markPushNotificationRead(notification.id)
                      await refreshNotifications()
                      onNotificationsChanged?.()
                    }
                    onNotificationPress?.(notification)
                  }}
                  style={({ pressed }) => [
                    styles.notificationCard,
                    { backgroundColor: presentation.cardColor },
                    notification.unread && styles.unreadCard,
                    pressed && styles.notificationCardPressed,
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: presentation.iconBg }]}>
                    {presentation.icon}
                  </View>

                  <View style={styles.notificationBody}>
                    <View style={styles.notificationTop}>
                      <Text
                        allowFontScaling={false}
                        numberOfLines={2}
                        style={[
                          styles.notificationTitle,
                          presentation.titleColor ? { color: presentation.titleColor } : null,
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        numberOfLines={1}
                        style={[
                          styles.notificationTime,
                          presentation.timeColor ? { color: presentation.timeColor } : null,
                        ]}
                      >
                        {formatPushNotificationTime(notification.createdAt)}
                      </Text>
                    </View>

                    <Text
                      allowFontScaling={false}
                      numberOfLines={3}
                      style={[
                        styles.notificationMessage,
                        presentation.messageColor ? { color: presentation.messageColor } : null,
                      ]}
                    >
                      {notification.message}
                    </Text>
                  </View>

                  {notification.unread ? <View style={styles.unreadDot} /> : null}
                </Pressable>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  header: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F9FB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(25, 28, 30, 0.08)',
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#191C1E',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  markRead: {
    color: '#FF7A59',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  markReadDisabled: {
    opacity: 0.45,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 24,
  },
  filtersRow: {
    gap: 10,
    paddingRight: 24,
  },
  filterPill: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6E8EA',
  },
  filterPillActive: {
    backgroundColor: '#FF7A59',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 3,
  },
  filterText: {
    color: '#58423C',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#701500',
  },
  list: {
    gap: 16,
  },
  emptyCard: {
    minHeight: 220,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    color: '#191C1E',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  emptyText: {
    color: '#58423C',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  notificationCard: {
    minHeight: 126,
    padding: 24,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 3,
  },
  notificationCardPressed: {
    opacity: 0.96,
  },
  unreadCard: {
    shadowOpacity: 0.03,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
    gap: 4,
  },
  notificationTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  notificationTitle: {
    flex: 1,
    color: '#191C1E',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
  },
  notificationTime: {
    color: 'rgba(88, 66, 60, 0.60)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    marginTop: 4,
  },
  notificationMessage: {
    color: '#58423C',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  unreadDot: {
    position: 'absolute',
    top: 32,
    right: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E5BBA',
  },
})
