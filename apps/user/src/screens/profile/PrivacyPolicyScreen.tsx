import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type PrivacyPolicyScreenProps = {
  onBackPress: () => void
  safeBottom: number
}

const dataCollectionItems = [
  'Profile information (name, phone number, email address) provided during registration.',
  'Delivery addresses and specific drop-off instructions to ensure accurate routing.',
  'Payment details, securely processed through our encrypted third-party payment gateways.',
]

const rightsCards = [
  {
    icon: 'download',
    title: 'Access',
    description: 'Request a copy of\nyour data.',
  },
  {
    icon: 'trash-2',
    title: 'Deletion',
    description: 'Request account\nremoval.',
  },
] as const

export function PrivacyPolicyScreen({
  onBackPress,
  safeBottom,
}: PrivacyPolicyScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          Privacy Policy
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
        <View style={styles.intro}>
          <Text allowFontScaling={false} style={styles.updatedLabel}>
            LAST UPDATED: JANUARY 2024
          </Text>
          <Text allowFontScaling={false} style={styles.introTitle}>
            Your trust is our top{'\n'}priority.
          </Text>
          <Text allowFontScaling={false} style={styles.introBody}>
            We believe that transparency is the foundation of trust. This policy outlines exactly
            how we handle your information when you use our delivery services, ensuring you have
            complete control and understanding of your digital footprint with us.
          </Text>
        </View>

        <View style={styles.sections}>
          <PolicySection icon="database" title="Data Collection">
            <Text allowFontScaling={false} style={styles.bodyText}>
              We collect information necessary to provide you with seamless delivery experiences.
              This includes:
            </Text>

            <View style={styles.bulletList}>
              {dataCollectionItems.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <View style={styles.greenBullet} />
                  <Text allowFontScaling={false} style={styles.bodyText}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </PolicySection>

          <PolicySection icon="send" title="Data Usage">
            <Text allowFontScaling={false} style={styles.bodyText}>
              Your data is utilized exclusively to enhance your experience and fulfill our
              services:
            </Text>

            <View style={styles.usageCard}>
              <Text allowFontScaling={false} style={styles.usageText}>
                <Text style={styles.usageTextStrong}>Service Execution:</Text> Processing orders,
                tracking deliveries in real-time, and facilitating communication between you and
                your courier.
              </Text>

              <Text allowFontScaling={false} style={styles.usageText}>
                <Text style={styles.usageTextStrong}>Platform Improvement:</Text> Analyzing usage
                patterns to optimize routes, improve app performance, and develop new features
                tailored to user needs.
              </Text>
            </View>
          </PolicySection>

          <PolicySection icon="lock" title="Data Security">
            <Text allowFontScaling={false} style={styles.bodyText}>
              We employ industry-standard security measures, including end-to-end encryption and
              regular security audits, to protect your personal information against unauthorized
              access, alteration, or destruction. We do not sell your personal data to third
              parties under any circumstances.
            </Text>
          </PolicySection>

          <PolicySection icon="shield" title="Your Rights">
            <Text allowFontScaling={false} style={styles.bodyText}>
              You maintain complete control over your data. You have the right to:
            </Text>

            <View style={styles.rightsRow}>
              {rightsCards.map((card) => (
                <View key={card.title} style={styles.rightCard}>
                  <Feather name={card.icon} size={18} color="#ff7a59" />
                  <Text allowFontScaling={false} style={styles.rightCardTitle}>
                    {card.title}
                  </Text>
                  <Text allowFontScaling={false} style={styles.rightCardText}>
                    {card.description}
                  </Text>
                </View>
              ))}
            </View>
          </PolicySection>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.contactButton}>
            <Text allowFontScaling={false} style={styles.contactButtonText}>
              CONTACT PRIVACY TEAM
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type PolicySectionProps = {
  children: React.ReactNode
  icon: keyof typeof Feather.glyphMap
  title: string
}

function PolicySection({ children, icon, title }: PolicySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Feather name={icon} size={16} color="#ff7a59" />
        </View>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          {title}
        </Text>
      </View>

      <View style={styles.sectionContent}>{children}</View>
    </View>
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
    flexGrow: 1,
    paddingTop: 16,
    paddingHorizontal: 24,
    gap: 32,
  },
  intro: {
    gap: 8,
  },
  updatedLabel: {
    color: 'rgba(88, 66, 60, 0.70)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.7,
  },
  introTitle: {
    color: '#191c1e',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
  },
  introBody: {
    paddingTop: 8,
    color: '#58423c',
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '400',
  },
  sections: {
    gap: 48,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 122, 89, 0.20)',
  },
  sectionTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionContent: {
    paddingLeft: 44,
    gap: 16,
  },
  bodyText: {
    color: '#58423c',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  bulletList: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  greenBullet: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginTop: 4,
    backgroundColor: '#446744',
  },
  usageCard: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: '#f2f4f6',
    gap: 12,
  },
  usageText: {
    color: '#58423c',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  usageTextStrong: {
    color: '#191c1e',
    fontWeight: '600',
  },
  rightsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rightCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(223, 192, 184, 0.15)',
    shadowColor: '#191c1e',
    shadowOpacity: 0.03,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  rightCardTitle: {
    paddingTop: 8,
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  rightCardText: {
    paddingTop: 4,
    color: '#58423c',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  footer: {
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  contactButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#f2f4f6',
  },
  contactButtonText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.7,
  },
})
