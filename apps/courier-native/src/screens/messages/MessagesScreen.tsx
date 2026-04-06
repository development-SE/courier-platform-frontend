import { SectionList, StyleSheet, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import type { CourierMessage } from '@swiftdeliver/core'
import { fetchMessagesViewFromCore } from '../../data/coreClient'
import { appTheme } from '../../theme/appTheme'
import { Screen } from '../../ui/Screen'
import { AppCard, AppText } from '../../ui/primitives'

type MessageSection = {
  title: string
  data: CourierMessage[]
}

function MessageCard({ item }: { item: CourierMessage }) {
  return (
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
  )
}

export function MessagesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['messages-view'],
    queryFn: fetchMessagesViewFromCore,
  })

  const sections = Object.entries(data?.groupedMessages ?? {}).map(([title, messages]) => ({
    title,
    data: messages,
  })) as MessageSection[]

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
        renderItem={({ item }) => <MessageCard item={item} />}
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
