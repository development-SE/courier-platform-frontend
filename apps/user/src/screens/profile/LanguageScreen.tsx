import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export type LanguageCode = 'english' | 'russian' | 'kazakh' | 'spanish'

type LanguageScreenProps = {
  onBackPress: () => void
  onSelectLanguage: (language: LanguageCode) => void
  safeBottom: number
  selectedLanguage: LanguageCode
}

const languageOptions: Array<{
  code: LanguageCode
  label: string
  subtitle: string
  subtitleSerif?: boolean
}> = [
  {
    code: 'english',
    label: 'English',
    subtitle: 'English (US)',
  },
  {
    code: 'russian',
    label: 'Russian',
    subtitle: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
    subtitleSerif: true,
  },
  {
    code: 'kazakh',
    label: 'Kazakh',
    subtitle: '\u049a\u0430\u0437\u0430\u049b\u0448\u0430',
    subtitleSerif: true,
  },
  {
    code: 'spanish',
    label: 'Spanish',
    subtitle: 'Espa\u00f1ol',
  },
]

export function LanguageScreen({
  onBackPress,
  onSelectLanguage,
  safeBottom,
  selectedLanguage,
}: LanguageScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          Language
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(24, safeBottom + 16) },
        ]}
      >
        <View style={styles.list}>
          {languageOptions.map((option) => {
            const isSelected = option.code === selectedLanguage

            return (
              <Pressable
                key={option.code}
                onPress={() => onSelectLanguage(option.code)}
                style={[styles.languageCard, isSelected && styles.languageCardSelected]}
              >
                <View style={styles.languageTextWrap}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.languageLabel, isSelected && styles.languageLabelSelected]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.languageSubtitle,
                      option.subtitleSerif && styles.languageSubtitleSerif,
                      isSelected && styles.languageSubtitleSelected,
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>

                {isSelected ? (
                  <View style={styles.selectedCheck}>
                    <Feather name="check" size={14} color="#ffffff" />
                  </View>
                ) : (
                  <View style={styles.unselectedCircle} />
                )}
              </Pressable>
            )
          })}
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
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  list: {
    gap: 16,
  },
  languageCard: {
    minHeight: 88,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageCardSelected: {
    backgroundColor: 'rgba(255, 218, 210, 0.30)',
  },
  languageTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  languageLabel: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
  },
  languageLabelSelected: {
    fontWeight: '700',
  },
  languageSubtitle: {
    marginTop: 4,
    color: 'rgba(88, 66, 60, 0.50)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  languageSubtitleSelected: {
    color: 'rgba(88, 66, 60, 0.70)',
  },
  languageSubtitleSerif: {
    fontFamily: 'serif',
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
    shadowColor: '#ff7a59',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(223, 192, 184, 0.50)',
  },
})
