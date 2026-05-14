import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type TermsConditionsScreenProps = {
  onBackPress: () => void
  safeBottom: number
}

const serviceUsageNotes = [
  'Ensure accurate drop-off details for a seamless handoff.',
  'Respect our couriers, who are the heartbeat of this service.',
  'Items must comply with local safety and transport regulations.',
]

export function TermsConditionsScreen({
  onBackPress,
  safeBottom,
}: TermsConditionsScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          Terms & Conditions
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(40, safeBottom + 24) },
        ]}
      >
        <View style={styles.hero}>
          <Text allowFontScaling={false} style={styles.updatedLabel}>
            LAST UPDATED: JANUARY 2024
          </Text>
          <Text allowFontScaling={false} style={styles.heroTitle}>
            Welcome to the Delivery{'\n'}Breeze
          </Text>
          <View style={styles.heroDivider} />
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              1. Acceptance of Terms
            </Text>
            <Text allowFontScaling={false} style={styles.sectionBody}>
              By accessing or using our fluid delivery services, you agree to be bound by these
              gentle guidelines. We believe in transparency without the heavy legal jargon. Think
              of this as our mutual handshake for a smooth, reliable journey.
            </Text>
          </View>

          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              2. Service Usage & Delivery Expectations
            </Text>
            <Text allowFontScaling={false} style={styles.sectionBody}>
              We strive to make every delivery feel effortless. While we aim for the estimated
              times shown on your serene dashboard, slight variations may occur due to the organic
              nature of travel. We promise to keep you updated with real-time, smooth transitions.
            </Text>

            <View style={styles.noteCard}>
              {serviceUsageNotes.map((note) => (
                <View key={note} style={styles.noteRow}>
                  <View style={styles.noteBullet} />
                  <Text allowFontScaling={false} style={styles.noteText}>
                    {note}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              3. Privacy & Data Handling
            </Text>
            <Text allowFontScaling={false} style={styles.sectionBody}>
              Your personal space is respected. We only collect data necessary to fulfill your
              delivery and enhance your experience. We do not sell your information. It remains
              securely layered within our systems, protected by modern encryption standards.
            </Text>
          </View>

          <View style={styles.sectionLast}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              4. Modifications to Terms
            </Text>
            <Text allowFontScaling={false} style={styles.sectionBody}>
              As our services evolve, so might these terms. We will gently notify you of
              significant shifts in our policies. Continued use of the platform signifies your
              comfort with these updates.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text allowFontScaling={false} style={styles.footerText}>
            Have questions? We are here to help.
          </Text>

          <Pressable style={styles.supportButton}>
            <Feather name="message-circle" size={16} color="#ffffff" />
            <Text allowFontScaling={false} style={styles.supportButtonText}>
              Contact Support
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
    backgroundColor: '#f7f9fb',
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
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flexGrow: 1,
    paddingTop: 32,
    paddingHorizontal: 24,
    gap: 40,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  updatedLabel: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  heroTitle: {
    color: '#191c1e',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroDivider: {
    width: 64,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#ff7a59',
  },
  card: {
    padding: 32,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOpacity: 0.04,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  section: {
    marginBottom: 48,
  },
  sectionLast: {},
  sectionTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionBody: {
    marginTop: 16,
    color: '#58423c',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  noteCard: {
    marginTop: 16,
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#f2f4f6',
    borderWidth: 1,
    borderColor: 'rgba(223, 192, 184, 0.15)',
    gap: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteBullet: {
    width: 8,
    height: 8,
    marginTop: 8,
    marginRight: 15,
    borderRadius: 4,
    backgroundColor: '#58423c',
  },
  noteText: {
    flex: 1,
    color: '#58423c',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  footer: {
    alignItems: 'center',
    gap: 24,
    paddingTop: 8,
  },
  footerText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 48,
    backgroundColor: '#ff7a59',
  },
  supportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
})
