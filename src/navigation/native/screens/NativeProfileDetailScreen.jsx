import { useMemo, useState } from 'react'
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SCREEN_IDS } from '../../../constants/routes'
import { PROFILE_SCREEN_TITLE } from '../profileScreenMeta'

const LANGUAGES = Object.freeze([
  { code: 'ru', label: 'Русский' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'en', label: 'English' },
])

const DEFAULT_DESCRIPTION = 'Экран будет доработан на следующем этапе миграции.'

const SCREEN_DESCRIPTION = Object.freeze({
  [SCREEN_IDS.PROFILE_STATUS]: 'Управляйте доступностью перед началом и завершением смены.',
  [SCREEN_IDS.PROFILE_TRANSPORT]: 'Укажите тип транспорта для корректного расчета маршрутов.',
  [SCREEN_IDS.PROFILE_IDENTITY]: 'Проверьте документы, чтобы получить доступ к заказам.',
  [SCREEN_IDS.PROFILE_PARK_ACCESS]: 'Запросите или обновите доступ в ваш курьерский парк.',
  [SCREEN_IDS.PROFILE_PAYOUT_ACCOUNT]: 'Настройте счет, куда будут приходить выплаты.',
  [SCREEN_IDS.PROFILE_PAYOUT_HISTORY]: 'История поступлений и выводов будет доступна здесь.',
  [SCREEN_IDS.PROFILE_NOTIFICATIONS]: 'Настройте push и служебные уведомления.',
  [SCREEN_IDS.PROFILE_LANGUAGE]: 'Выберите язык интерфейса приложения.',
})

function SettingsToggle({ label, value, onChange }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? '#fff6f1' : '#d3d6e6'}
        trackColor={{ false: '#3f4258', true: '#cd5e3d' }}
      />
    </View>
  )
}

export function NativeProfileDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const screenId = route.name

  const title = PROFILE_SCREEN_TITLE[screenId] ?? 'Настройки'
  const description = SCREEN_DESCRIPTION[screenId] ?? DEFAULT_DESCRIPTION

  const [isOnline, setIsOnline] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [serviceEnabled, setServiceEnabled] = useState(false)
  const [language, setLanguage] = useState('ru')

  const isStatusScreen = screenId === SCREEN_IDS.PROFILE_STATUS
  const isNotificationsScreen = screenId === SCREEN_IDS.PROFILE_NOTIFICATIONS
  const isLanguageScreen = screenId === SCREEN_IDS.PROFILE_LANGUAGE

  const statusText = useMemo(
    () => (isOnline ? 'Вы на линии' : 'Вы не на линии'),
    [isOnline],
  )

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Назад</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.description}>{description}</Text>
        </View>

        {isStatusScreen ? (
          <View style={styles.card}>
            <Text style={styles.value}>{statusText}</Text>
            <SettingsToggle
              label="Статус курьера"
              value={isOnline}
              onChange={setIsOnline}
            />
          </View>
        ) : null}

        {isNotificationsScreen ? (
          <View style={styles.card}>
            <SettingsToggle
              label="Push-уведомления"
              value={pushEnabled}
              onChange={setPushEnabled}
            />
            <SettingsToggle
              label="Звуковые сигналы"
              value={soundEnabled}
              onChange={setSoundEnabled}
            />
            <SettingsToggle
              label="Служебные сообщения"
              value={serviceEnabled}
              onChange={setServiceEnabled}
            />
          </View>
        ) : null}

        {isLanguageScreen ? (
          <View style={styles.card}>
            {LANGUAGES.map(item => (
              <Pressable
                key={item.code}
                onPress={() => setLanguage(item.code)}
                style={styles.languageRow}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                {language === item.code ? (
                  <Text style={styles.selectedLabel}>Выбрано</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2030',
  },
  backButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1b1d2c',
  },
  backButtonText: {
    color: '#edf0fb',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#f2f3f7',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 62,
  },
  content: {
    padding: 14,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#141621',
    padding: 12,
    gap: 8,
  },
  description: {
    color: '#b8bdd0',
    fontSize: 13,
    lineHeight: 18,
  },
  value: {
    color: '#f4f5fb',
    fontSize: 15,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#eef0f8',
    fontSize: 14,
    fontWeight: '500',
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  selectedLabel: {
    color: '#cd5e3d',
    fontSize: 12,
    fontWeight: '700',
  },
})
