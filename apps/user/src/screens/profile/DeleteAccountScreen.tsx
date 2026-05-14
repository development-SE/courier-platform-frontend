import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type DeleteAccountScreenProps = {
  onBackPress: () => void
  safeBottom: number
}

const lossItems = [
  {
    description: 'Past deliveries, receipts, and\ntracking data will be erased.',
    icon: 'clock',
    title: 'Order history will be removed',
  },
  {
    description: 'Home, work, and custom delivery\nspots will be wiped.',
    icon: 'map-pin',
    title: 'Saved addresses deleted',
  },
  {
    description: 'Linked cards and wallet balances\nwill be securely detached.',
    icon: 'credit-card',
    title: 'Payment methods removed',
  },
] as const

export function DeleteAccountScreen({
  onBackPress,
  safeBottom,
}: DeleteAccountScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          Delete Account
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.intro}>
          <Text allowFontScaling={false} style={styles.introTitle}>
            Delete Account
          </Text>
          <Text allowFontScaling={false} style={styles.introCopy}>
            We're sorry to see you go. Please review{'\n'}what happens when you leave.
          </Text>
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Feather name="alert-triangle" size={24} color="#93000a" />
            <Text allowFontScaling={false} style={styles.warningTitle}>
              This action cannot be{'\n'}undone
            </Text>
          </View>
          <Text allowFontScaling={false} style={styles.warningCopy}>
            All your data will be permanently deleted from our servers. You will not be able to
            recover your account or any related information once this process is complete.
          </Text>
        </View>

        <View style={styles.lossCard}>
          <Text allowFontScaling={false} style={styles.lossLabel}>
            WHAT YOU'LL LOSE
          </Text>

          <View style={styles.lossList}>
            {lossItems.map((item) => (
              <View key={item.title} style={styles.lossRow}>
                <View style={styles.lossIconWrap}>
                  <Feather name={item.icon} size={18} color="#58423c" />
                </View>

                <View style={styles.lossTextWrap}>
                  <Text allowFontScaling={false} style={styles.lossTitle}>
                    {item.title}
                  </Text>
                  <Text allowFontScaling={false} style={styles.lossDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomActions, { paddingBottom: Math.max(32, safeBottom + 16) }]}>
        <Pressable style={styles.deleteButton}>
          <Feather name="trash-2" size={16} color="#ffffff" />
          <Text allowFontScaling={false} style={styles.deleteButtonText}>
            Delete Account
          </Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={onBackPress}>
          <Text allowFontScaling={false} style={styles.cancelButtonText}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(247, 249, 251, 0.80)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 220,
    gap: 32,
  },
  intro: {
    gap: 8,
  },
  introTitle: {
    color: '#191c1e',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
  },
  introCopy: {
    color: '#58423c',
    fontSize: 18,
    lineHeight: 29.25,
    fontWeight: '400',
  },
  warningCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#ffdad6',
    gap: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningTitle: {
    color: '#93000a',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  warningCopy: {
    color: '#93000a',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  lossCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#f2f4f6',
    gap: 24,
  },
  lossLabel: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  lossList: {
    gap: 16,
  },
  lossRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  lossIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f9fb',
  },
  lossTextWrap: {
    flex: 1,
    gap: 4,
  },
  lossTitle: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  lossDescription: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: '#f7f9fb',
  },
  deleteButton: {
    height: 60,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff7a59',
    shadowColor: '#ba1a1a',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  cancelButton: {
    height: 60,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  cancelButtonText: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
})
