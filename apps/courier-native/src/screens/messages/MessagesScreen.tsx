import { SectionList, StyleSheet, View, Pressable, Linking, AppState, Platform } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import * as IntentLauncher from 'expo-intent-launcher'
import type { CourierMessage } from '@swiftdeliver/core'
import { fetchMessagesViewFromCore } from '../../data/coreClient'
import { appTheme } from '../../theme/appTheme'
import { Screen } from '../../ui/Screen'
import { AppCard, AppText } from '../../ui/primitives'


type MessageSection = {
  title: string
  data: CourierMessage[]
}

function MessageCard({ item, onPress }: { item: CourierMessage; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <AppCard style={item.unread ? styles.cardUnread : undefined}>
        <View style={styles.cardTop}>
          <AppText variant="label">{item.source}</AppText>
          <AppText variant="subtitle">
            {item.date === 'Today' || item.date === 'Сегодня' ? item.time : item.date}
          </AppText>
        </View>
        <AppText style={styles.title}>{item.title}</AppText>
        <AppText variant="subtitle">{item.text}</AppText>
      </AppCard>
    </Pressable>
  )
}

export function MessagesScreen() {
  const [backgroundLocationRequested, setBackgroundLocationRequested] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['messages-view'],
    queryFn: fetchMessagesViewFromCore,
  })

  // Check background location permission on mount
  useEffect(() => {
    const checkBackgroundLocationPermission = async () => {
      try {
        const foregroundStatus = await Location.getForegroundPermissionsAsync()
        if (foregroundStatus.status === 'granted') {
          const backgroundStatus = await Location.getBackgroundPermissionsAsync()
          if (backgroundStatus.status !== 'granted') {
            setBackgroundLocationRequested(true)
          }
        }
      } catch (err) {
        console.warn('Error checking location permission:', err)
      }
    }

    checkBackgroundLocationPermission()
  }, [])

  // Re-check permission when user returns from Settings
  useEffect(() => {
    if (!backgroundLocationRequested) return

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const status = await Location.getBackgroundPermissionsAsync()
        if (status.status === 'granted') {
          setBackgroundLocationRequested(false)
        }
      }
    })

    return () => subscription.remove()
  }, [backgroundLocationRequested])

  const handleBackgroundLocationRequest = async () => {
    try {
      const backgroundStatus = await Location.getBackgroundPermissionsAsync()

      if (backgroundStatus.canAskAgain) {
        const result = await Location.requestBackgroundPermissionsAsync()
        if (result.status === 'granted') {
          setBackgroundLocationRequested(false)
        }
      } else if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:location')
      } else {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: 'package:com.swiftdeliver.courier' } // ← replace with your actual bundle ID
        )
      }
    } catch (err) {
      await Linking.openSettings()
      console.warn('Error requesting background location:', err)
    }
  }

  const sections = Object.entries(data?.groupedMessages ?? {}).map(([title, messages]) => ({
    title,
    data: messages,
  })) as MessageSection[]

  if (backgroundLocationRequested) {
    sections.unshift({
      title: 'PERMISSIONS',
      data: [
        {
          id: 'bg-location-request',
          source: 'System',
          title: 'Background Location Permission',
          text: 'Tap to enable background location tracking for receiving orders while the app is closed.',
          date: 'Today',
          time: 'Now',
          unread: true,
        } as CourierMessage,
      ],
    })
  }

  return (
    <Screen
      title="Messages"
      subtitle={isLoading ? 'Loading messages...' : `${data?.unreadCount ?? 0} unread`}
    >
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section }) => (
          <AppText variant="label" style={styles.sectionHeader}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item }) => (
          <MessageCard
            item={item}
            onPress={item.id === 'bg-location-request' ? handleBackgroundLocationRequest : undefined}
          />
        )}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: appTheme.spacing.sm }} />}
        ListEmptyComponent={
          <AppText variant="subtitle" style={styles.empty}>
            {isLoading ? 'Loading...' : 'No messages yet'}
          </AppText>
        }
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionHeader: {
    textTransform: 'uppercase',
    marginTop: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
    color: '#8f93a9',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardUnread: {
    borderColor: appTheme.colors.primary,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
  },
})