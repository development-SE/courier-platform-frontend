import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { fetchMyCourierProfile, fetchMyProfile, type CourierProfile } from '../../data/profileApi'
import { appTheme } from '../../theme/appTheme'
import { useAuthStore } from '../../store/authStore'
import { AppButton, AppText } from '../../ui/primitives'

type ProfileDetails = {
  user: Awaited<ReturnType<typeof unwrapUserProfile>>
  courier: CourierProfile
}

type DetailRow = {
  label: string
  value: string
}

function unwrapUserProfile(profile: {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  companyId?: string | null
  role: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}) {
  return profile
}

export function ProfileScreen() {
  const signOut = useAuthStore(state => state.signOut)
  const accessToken = useAuthStore(state => state.accessToken)

  const { data, isLoading, error } = useQuery<ProfileDetails>({
    queryKey: ['courier-profile', accessToken],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Missing access token')
      }

      const [profileResponse, courierResponse] = await Promise.all([
        fetchMyProfile(accessToken),
        fetchMyCourierProfile(accessToken),
      ])

      if (!profileResponse.ok) {
        throw new Error(profileResponse.error.message)
      }

      if (!courierResponse.ok) {
        throw new Error(courierResponse.error.message)
      }

      return {
        user: unwrapUserProfile(profileResponse.data),
        courier: courierResponse.data,
      }
    },
  })

  const user = data?.user
  const courier = data?.courier
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.trim() || '--'
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Courier'
  const subtitle = user?.email ?? 'No email'
  const meta = user
    ? `${user.phone ?? 'No phone'} · ${formatRole(user.role)}`
    : isLoading
      ? 'Loading profile...'
      : 'Profile unavailable'

  const detailRows = courier ? buildDetailRows(courier, user?.companyId ?? null) : []

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="title">Profile</AppText>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <AppText variant="label" style={styles.avatarText}>{initials}</AppText>
          </View>
          <View style={styles.identityInfo}>
            <AppText variant="body" style={styles.identityName}>{fullName}</AppText>
            <AppText variant="label" style={styles.identityMuted}>{subtitle}</AppText>
            <AppText variant="label" style={styles.identityMuted}>{meta}</AppText>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <AppText variant="label" style={styles.errorText}>
              {error instanceof Error ? error.message : 'Unable to load profile'}
            </AppText>
          </View>
        ) : null}

        {courier && courier.courierType === 'CONTRACTOR' && !courier.isVerified ? (
          <View style={styles.warningCard}>
            <AppText variant="body" style={styles.warningTitle}>Photo Control Required</AppText>
            <AppText variant="label" style={styles.warningText}>
              As a contractor, you need to complete photo verification to take orders. Please contact support to arrange your photo control session.
            </AppText>
          </View>
        ) : null}

        <View style={styles.groupCard}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.profileRow, index === 0 ? styles.profileRowFirst : null]}
            >
              <AppText variant="label" style={styles.profileRowLabel}>{row.label}</AppText>
              <AppText variant="body" style={styles.profileRowValue}>{row.value}</AppText>
            </View>
          ))}
        </View>

        {courier?.notes ? (
          <View style={styles.noteCard}>
            <AppText variant="label" style={styles.noteLabel}>Courier note</AppText>
            <AppText variant="body" style={styles.noteText}>{courier.notes}</AppText>
          </View>
        ) : null}

        <AppButton
          title="Sign out"
          variant="danger"
          onPress={() => void signOut()}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

function buildDetailRows(courier: CourierProfile, userCompanyId: string | null): DetailRow[] {
  const schedules = Array.isArray(courier.schedules) ? courier.schedules : []
  const activeSchedules = schedules.filter(schedule => schedule.active).length
  const hasCompanyAccess = Boolean(courier.companyId ?? userCompanyId)

  return [
    {
      label: 'Courier type',
      value: formatCourierType(courier.courierType),
    },
    {
      label: 'Employment',
      value: formatEmploymentStatus(courier.employmentStatus),
    },
    {
      label: 'Transport',
      value: formatTransportType(courier.transportType),
    },
    {
      label: 'Verification',
      value: courier.isVerified ? 'Verified' : 'Pending verification',
    },
    {
      label: 'Orders access',
      value: courier.canTakeOrders ? 'Can take orders' : 'Not ready yet',
    },
    {
      label: 'Park access',
      value: hasCompanyAccess ? 'Assigned to company park' : 'Independent contractor',
    },
    {
      label: 'Max active orders',
      value: String(courier.maxActiveOrders),
    },
    {
      label: 'Schedule',
      value: formatScheduleSummary(courier.courierType, activeSchedules),
    },
  ]
}

function formatRole(role: string) {
  return role
    .split('_')
    .filter(Boolean)
    .map(part => part[0] + part.slice(1).toLowerCase())
    .join(' ')
}

function formatCourierType(courierType?: CourierProfile['courierType']) {
  switch (courierType) {
    case 'CONTRACTOR':
      return 'Contractor'
    case 'EMPLOYEE':
      return 'Employee'
    default:
      return 'Not assigned yet'
  }
}

function formatEmploymentStatus(status?: CourierProfile['employmentStatus']) {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'ONBOARDING':
      return 'Onboarding'
    case 'SUSPENDED':
      return 'Suspended'
    case 'INACTIVE':
      return 'Inactive'
    default:
      return 'Unknown'
  }
}

function formatTransportType(transportType?: CourierProfile['transportType']) {
  switch (transportType) {
    case 'FOOT':
      return 'On foot'
    case 'BIKE':
      return 'Bike'
    case 'SCOOTER':
      return 'Scooter'
    case 'CAR':
      return 'Car'
    case 'VAN':
      return 'Van'
    default:
      return 'Not selected'
  }
}

function formatScheduleSummary(
  courierType: CourierProfile['courierType'] | undefined,
  activeSchedules: number,
) {
  if (activeSchedules > 0) {
    return `${activeSchedules} active schedule${activeSchedules === 1 ? '' : 's'}`
  }

  if (courierType === 'CONTRACTOR') {
    return 'No fixed schedule'
  }

  return 'Schedule not configured'
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f2e1db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: appTheme.colors.primary,
    fontWeight: '700',
  },
  identityInfo: {
    gap: 2,
    flex: 1,
  },
  identityName: {
    fontWeight: '700',
  },
  identityMuted: {
    color: appTheme.colors.textMuted,
  },
  errorCard: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: '#5d3340',
    padding: appTheme.spacing.md,
  },
  errorText: {
    color: '#ffd1d7',
  },
  warningCard: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.sm,
  },
  warningTitle: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 16,
  },
  warningText: {
    color: '#d97706',
    lineHeight: 20,
  },
  groupCard: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    overflow: 'hidden',
  },
  profileRow: {
    minHeight: 52,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
  },
  profileRowFirst: {
    borderTopWidth: 0,
  },
  profileRowLabel: {
    color: appTheme.colors.textMuted,
    flex: 1,
  },
  profileRowValue: {
    color: appTheme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  noteCard: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.card,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.xs,
  },
  noteLabel: {
    color: appTheme.colors.textMuted,
  },
  noteText: {
    color: appTheme.colors.text,
  },
  logoutBtn: {
    marginTop: 4,
    width: '100%',
  },
})
