import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type AboutAppScreenProps = {
  onBackPress: () => void
  safeBottom: number
}

export function AboutAppScreen({ onBackPress, safeBottom }: AboutAppScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          About app
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
          <View style={styles.heroIconWrap}>
            <Feather name="package" size={44} color="#a7391e" />
          </View>

          <Text allowFontScaling={false} style={styles.appTitle}>
            The Courier App
          </Text>

          <View style={styles.versionPill}>
            <Text allowFontScaling={false} style={styles.versionText}>
              VERSION 2.4.0
            </Text>
          </View>
        </View>

        <View style={styles.infoList}>
          <InfoCard
            accentColor="#ffd7cc"
            icon="grid"
            iconColor="#a7391e"
            label="COMPANY"
            value="Velo Modern Logistics Inc."
          />

          <InfoCard
            accentColor="#d8e2ff"
            icon="mail"
            iconColor="#1e5bba"
            label="CONTACT SUPPORT"
            trailing="chevron-right"
            trailingColor="#dfc0b8"
            value="support@velomodern.com"
          />

          <InfoCard
            accentColor="#c5edc1"
            icon="globe"
            iconColor="#446744"
            label="WEBSITE"
            trailing="external-link"
            trailingColor="#dfc0b8"
            value="www.velomodern.com"
          />

          <View style={styles.connectCard}>
            <Text allowFontScaling={false} style={styles.connectLabel}>
              CONNECT WITH US
            </Text>

            <View style={styles.socialRow}>
              <SocialButton icon="camera" />
              <SocialButton icon="at-sign" />
              <SocialButton icon="briefcase" />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text allowFontScaling={false} style={styles.footerPrimary}>
            {'\u00a9 2024 Velo Modern Logistics Inc.'}
          </Text>
          <Text allowFontScaling={false} style={styles.footerSecondary}>
            All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type InfoCardProps = {
  accentColor: string
  icon: keyof typeof Feather.glyphMap
  iconColor: string
  label: string
  trailing?: keyof typeof Feather.glyphMap
  trailingColor?: string
  value: string
}

function InfoCard({
  accentColor,
  icon,
  iconColor,
  label,
  trailing,
  trailingColor = '#dfc0b8',
  value,
}: InfoCardProps) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconWrap, { backgroundColor: accentColor }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>

      <View style={styles.infoCopy}>
        <Text allowFontScaling={false} style={styles.infoLabel}>
          {label}
        </Text>
        <Text allowFontScaling={false} style={styles.infoValue}>
          {value}
        </Text>
      </View>

      {trailing ? <Feather name={trailing} size={18} color={trailingColor} /> : null}
    </View>
  )
}

type SocialButtonProps = {
  icon: keyof typeof Feather.glyphMap
}

function SocialButton({ icon }: SocialButtonProps) {
  return (
    <Pressable style={styles.socialButton}>
      <Feather name={icon} size={20} color="#58423c" />
    </Pressable>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 48,
  },
  hero: {
    alignItems: 'center',
  },
 
  heroIconWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#f7f9fb',
    shadowColor: '#191c1e',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 20 },
    elevation: 4,
  },
  appTitle: {
    marginTop: 20,
    color: '#191c1e',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  versionPill: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f2f4f6',
  },
  versionText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 1.4,
  },
  infoList: {
    gap: 16,
  },
  infoCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  infoCopy: {
    flex: 1,
  },
  infoLabel: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.7,
  },
  infoValue: {
    marginTop: 4,
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
  },
  connectCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
  },
  connectLabel: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.7,
  },
  socialRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  footerPrimary: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    textAlign: 'center',
  },
  footerSecondary: {
    color: '#8b716b',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
})
