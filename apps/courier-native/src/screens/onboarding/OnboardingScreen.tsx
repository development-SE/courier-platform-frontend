import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/authStore'
import { appTheme } from '../../theme/appTheme'
import { AppText } from '../../ui/primitives'
import { apiRequest } from '../../data/apiClient'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/types'
import { SCREEN_IDS } from '../../constants/screenIds'


type TransportType = 'FOOT' | 'BIKE' | 'SCOOTER' | 'CAR' | 'VAN'

type TransportOption = {
  type: TransportType
  label: string
  icon: string
  description: string
}

const TRANSPORT_OPTIONS: TransportOption[] = [
  { type: 'FOOT',    icon: 'walk-outline',      label: 'On Foot',  description: 'Walking deliveries' },
  { type: 'BIKE',    icon: 'bicycle-outline',   label: 'Bike',     description: 'Bicycle deliveries' },
  { type: 'SCOOTER', icon: 'flash-outline',     label: 'Scooter',  description: 'Scooter deliveries' },
  { type: 'CAR',     icon: 'car-outline',       label: 'Car',      description: 'Car deliveries' },
  { type: 'VAN',     icon: 'bus-outline',       label: 'Van',      description: 'Large van deliveries' },
]

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.ONBOARDING>

export function OnboardingScreen({ navigation }: Props) {
  const accessToken = useAuthStore(state => state.accessToken)
  const [selectedTransport, setSelectedTransport] = useState<TransportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!selectedTransport) {
      setError('Please select your transport type.')
      return
    }

    if (!accessToken) {
      setError('Session expired. Please sign in again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Decode userId from JWT
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const userId = payload.sub

      const result = await apiRequest('/api/v1/couriers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        json: {
          userId,
          courierType: 'CONTRACTOR',
          employmentStatus: 'ONBOARDING',
          transportType: selectedTransport,
          isVerified: false,
          canTakeOrders: false,
          maxActiveOrders: 1,
        },
      })

      if (!result.ok) {
        setError(result.error.message || 'Failed to create profile. Please try again.')
        return
      }

      navigation.replace(SCREEN_IDS.PENDING_APPROVAL)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="bicycle" size={48} color={appTheme.colors.primary} />
          </View>
          <AppText variant="title" style={styles.title}>Welcome, Courier!</AppText>
          <AppText variant="subtitle" style={styles.subtitle}>
            Let's set up your profile. Select your primary transport type to get started.
          </AppText>
        </View>

        <View style={styles.optionsSection}>
          <AppText variant="label" style={styles.sectionLabel}>Transport Type</AppText>
          <View style={styles.optionsList}>
            {TRANSPORT_OPTIONS.map(option => {
              const isSelected = selectedTransport === option.type
              return (
                <Pressable
                  key={option.type}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => {
                    setSelectedTransport(option.type)
                    setError('')
                  }}
                >
                  <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? '#fff' : appTheme.colors.textMuted}
                    />
                  </View>
                  <View style={styles.optionInfo}>
                    <AppText
                    variant="body"
                    style={isSelected ? { ...styles.optionLabel, ...styles.optionLabelSelected } : styles.optionLabel}
                    >
                    {option.label}
                    </AppText>
                    <AppText variant="label" style={styles.optionDescription}>
                      {option.description}
                    </AppText>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={appTheme.colors.primary}
                    />
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={appTheme.colors.textMuted} />
          <AppText variant="label" style={styles.infoText}>
            Your profile will be reviewed by our team before you can start taking orders.
          </AppText>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <AppText variant="label" style={styles.errorText}>{error}</AppText>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.submitButton,
            (!selectedTransport || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedTransport || loading}
        >
          <AppText variant="body" style={styles.submitButtonText}>
            {loading ? 'Setting up your profile...' : 'Continue'}
          </AppText>
          {!loading && (
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.xl,
    paddingBottom: appTheme.spacing.xl,
    gap: appTheme.spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.sm,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(205, 94, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: appTheme.spacing.xs,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: appTheme.spacing.md,
  },
  optionsSection: {
    gap: appTheme.spacing.sm,
  },
  sectionLabel: {
    color: appTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: appTheme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  optionCardSelected: {
    borderColor: appTheme.colors.primary,
    backgroundColor: 'rgba(205, 94, 61, 0.08)',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: appTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: appTheme.colors.primary,
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: appTheme.colors.text,
  },
  optionDescription: {
    color: appTheme.colors.textMuted,
  },
  infoCard: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radius.lg,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    color: appTheme.colors.textMuted,
    lineHeight: 18,
  },
  errorCard: {
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radius.lg,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: '#6d2d3b',
  },
  errorText: {
    color: '#ffd1d7',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appTheme.spacing.sm,
    height: 52,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.primary,
    marginTop: appTheme.spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})