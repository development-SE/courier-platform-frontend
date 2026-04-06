import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { PROFILE_NAV_ITEMS } from '../profileScreenMeta'
import { useNativeProfileViewModel } from './useNativeProfileViewModel'

function ProfileRow({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  )
}

export function NativeProfileScreen({ onSignOut }) {
  const navigation = useNavigation()
  const { courier, initials, ratingLabel } = useNativeProfileViewModel()

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Профиль</Text>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.name}>
              {courier.name} {courier.lastName}
            </Text>
            <Text style={styles.park}>{courier.park}</Text>
            <Text style={styles.rating}>{ratingLabel}</Text>
          </View>
        </View>

        <View style={styles.rowsCard}>
          {PROFILE_NAV_ITEMS.map(item => (
            <ProfileRow
              key={item.screenId}
              label={item.label}
              onPress={() => navigation.navigate(item.screenId)}
            />
          ))}
        </View>

        <Pressable onPress={onSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutButtonText}>Выйти</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  content: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  title: {
    color: '#f2f3f7',
    fontSize: 24,
    fontWeight: '700',
  },
  identityCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#151620',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#cd5e3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff8f5',
    fontSize: 18,
    fontWeight: '800',
  },
  identityInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: '#f8f9ff',
    fontSize: 16,
    fontWeight: '700',
  },
  park: {
    color: '#b0b5ca',
    fontSize: 13,
  },
  rating: {
    color: '#8f95ac',
    fontSize: 12,
  },
  rowsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#151620',
    overflow: 'hidden',
  },
  row: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#202236',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#eef0f8',
    fontSize: 14,
    fontWeight: '500',
  },
  rowChevron: {
    color: '#8f95ac',
    fontSize: 20,
    marginTop: -2,
  },
  signOutButton: {
    borderRadius: 12,
    backgroundColor: '#3a1f2a',
    borderWidth: 1,
    borderColor: '#7e3646',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signOutButtonText: {
    color: '#ffd9df',
    fontSize: 14,
    fontWeight: '700',
  },
})
