import { SectionList, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useMessagesViewModel } from '../../../pages/Messages/useMessagesViewModel'

function MessageItem({ item }) {
  return (
    <View style={[styles.messageCard, item.unread ? styles.messageCardUnread : null]}>
      <View style={styles.messageTop}>
        <Text style={styles.messageSource}>{item.source}</Text>
        <Text style={styles.messageTime}>{item.date === 'Сегодня' ? item.time : item.date}</Text>
      </View>
      <Text style={styles.messageTitle}>{item.title}</Text>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  )
}

export function NativeMessagesScreen() {
  const { unreadCount, groupedMessages } = useMessagesViewModel()
  const sections = Object.entries(groupedMessages).map(([title, data]) => ({ title, data }))

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Сообщения</Text>
        {unreadCount > 0 && <Text style={styles.badge}>{unreadCount} новых</Text>}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => <MessageItem item={item} />}
        ListEmptyComponent={<Text style={styles.empty}>Нет сообщений</Text>}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f2f3f7',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff3f5',
    backgroundColor: '#c7495e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  sectionHeader: {
    color: '#8f93a9',
    fontSize: 12,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 8,
  },
  messageCard: {
    backgroundColor: '#151620',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  messageCardUnread: {
    borderColor: '#cd5e3d',
  },
  messageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageSource: {
    color: '#f2f3f7',
    fontSize: 13,
    fontWeight: '600',
  },
  messageTime: {
    color: '#9ca1b7',
    fontSize: 12,
  },
  messageTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  messageText: {
    color: '#b7bbcf',
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: '#8a8ea5',
    textAlign: 'center',
    marginTop: 32,
  },
})
