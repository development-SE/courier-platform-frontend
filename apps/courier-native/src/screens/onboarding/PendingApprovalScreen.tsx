import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { appTheme } from '../../theme/appTheme'
import { AppButton, AppText } from '../../ui/primitives'
import { useAuthStore } from '../../store/authStore'


export function PendingApprovalScreen() {
  const signOut = useAuthStore(state => state.signOut)
  

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="time-outline" size={64} color={appTheme.colors.primary} />
        </View>
        <AppText variant="title" style={styles.title}>Under Review</AppText>
        <AppText variant="subtitle" style={styles.subtitle}>
          Your profile has been submitted and is being reviewed by our team.
          You'll be able to start taking orders once approved.
        </AppText>
        <View style={styles.stepsCard}>
          {[
            { icon: 'checkmark-circle', label: 'Profile created', done: true },
            { icon: 'time-outline',     label: 'Admin review',    done: false },
            { icon: 'bicycle-outline',  label: 'Start delivering', done: false },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <Ionicons
                name={step.icon as any}
                size={20}
                color={step.done ? '#34d399' : appTheme.colors.textMuted}
              />
              <AppText
                variant="body"
                style={!step.done ? styles.stepLabelMuted : styles.stepLabel}
                >
                {step.label}
                </AppText>
            </View>
          ))}
        </View>
        <AppButton
          title="Sign Out"
          variant="danger"
          onPress={() => void signOut()}
          style={styles.signOutBtn}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.xl,
    gap: appTheme.spacing.lg,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(205, 94, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsCard: {
    width: '100%',
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
  },
  stepLabel: {
    fontWeight: '600',
  },
  stepLabelMuted: {
    color: appTheme.colors.textMuted,
  },
  signOutBtn: {
    width: '100%',
  },
})