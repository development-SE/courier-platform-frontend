import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_IDS } from '../../constants/screenIds'
import type { RootStackParamList } from '../../navigation/types'
import { appTheme } from '../../theme/appTheme'
import { loginWithBackend } from '../../data/authApi'
import { createCourierProfile } from '../../data/courierApi'
import { persistAuthTokens, persistAuthorizedState } from '../../platform/authStorage'
import { useAuthStore } from '../../store/authStore'

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.CREATE_COURIER_PROFILE>

const TRANSPORT_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'FOOT', label: 'On foot', icon: 'walk-outline' },
  { value: 'BIKE', label: 'Bicycle', icon: 'bicycle-outline' },
  { value: 'SCOOTER', label: 'Scooter', icon: 'flash-outline' },
  { value: 'CAR', label: 'Car', icon: 'car-outline' },
  { value: 'VAN', label: 'Van', icon: 'bus-outline' },
]

function decodeJwtSub(token: string): string | undefined {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let output = ''
    const str = base64.replace(/=+$/, '')
    for (
      let bc = 0, bs = 0, buffer, idx = 0;
      (buffer = str.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer)
    }
    return JSON.parse(output)?.sub
  } catch {
    return undefined
  }
}

export function CreateCourierProfileScreen({ navigation, route }: Props) {
  const { email, password } = route.params
  const insets = useSafeAreaInsets()

  const [transport, setTransport] = useState<string>('FOOT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setError('')
    setLoading(true)
    try {
      const loginRes = await loginWithBackend({ email, password })
      if (!loginRes.ok || !loginRes.data?.success || !loginRes.data.data?.accessToken) {
        setError('Login failed. Please go back and try again.')
        return
      }

      const { accessToken, refreshToken } = loginRes.data.data as any
      const userId = decodeJwtSub(accessToken)
      if (!userId) {
        setError('Could not read user ID from token.')
        return
      }

      const createRes = await createCourierProfile(accessToken, {
        userId,
        transportType: transport,
        courierType: 'CONTRACTOR',
        employmentStatus: 'ONBOARDING',
        canTakeOrders: false,
        maxActiveOrders: 3,
      })

      if (!createRes.ok || !createRes.data?.success) {
        const msg = createRes.ok ? createRes.data?.message : createRes.error?.message
        setError(msg || 'Failed to create courier profile. Please contact support.')
        return
      }

      await persistAuthTokens({ accessToken, refreshToken: refreshToken ?? '' })
      await persistAuthorizedState(true)
      await useAuthStore.getState().hydrate()
    } catch (err: any) {
      setError(err?.message || 'Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons color="#ffffff" name="arrow-back" size={18} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Set Up Profile</Text>
            <Text style={styles.subtitle}>Choose your transport type to get started</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.sectionLabel}>Transport type</Text>

        <View style={styles.optionsGrid}>
          {TRANSPORT_OPTIONS.map(opt => {
            const selected = transport === opt.value
            return (
              <Pressable
                key={opt.value}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setTransport(opt.value)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={28}
                  color={selected ? appTheme.colors.primary : '#aaa'}
                />
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                {selected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Profile</Text>
          )}
        </Pressable>

        <Text style={styles.hint}>
          You can update transport type and other settings later in your profile.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#2d292b',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.primary,
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#cdc9c9',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionLabel: {
    color: '#c9c5c5',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    width: '47%',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#5a5556',
    backgroundColor: '#3a3637',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: appTheme.colors.primary,
    backgroundColor: '#3d2e2b',
  },
  optionLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: appTheme.colors.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ffd1d7',
    fontSize: 12,
    marginLeft: 4,
  },
  submitButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: appTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  hint: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
  },
})
