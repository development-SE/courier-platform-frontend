import { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import PasswordIllustration from '../../../../assets/password.svg'
import { styles } from '../styles'

type PasswordVerificationScreenProps = {
  accessToken: string
  onBackPress: () => void
  onSave: (oldPassword: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>
  safeBottom: number
  safeTop: number
}

export function PasswordVerificationScreen({
  accessToken: _accessToken,
  onBackPress,
  onSave,
  safeBottom,
  safeTop,
}: PasswordVerificationScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!currentPassword || !newPassword) {
      setError('Please fill in both fields')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    setSaving(true)
    setError(null)
    const result = await onSave(currentPassword, newPassword)
    setSaving(false)
    if (result.ok) {
      onBackPress()
    } else {
      setError(result.message ?? 'Failed to change password')
    }
  }

  return (
    <View style={styles.nameScreen}>
      <View style={[styles.nameHeader, { paddingTop: safeTop }]}>
        <Pressable style={styles.editBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.nameHeaderTitle}>Password</Text>
        <View style={styles.editHeaderSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.passwordContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text allowFontScaling={false} style={styles.nameVerificationTitle}>Change Password</Text>

        <View style={styles.passwordForm}>
          <View style={styles.nameFieldGroup}>
            <Text allowFontScaling={false} style={styles.nameFieldLabel}>Current Password</Text>
            <TextInput
              allowFontScaling={false}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current password"
              placeholderTextColor="rgba(0, 0, 0, 0.35)"
              secureTextEntry
              style={styles.passwordInput}
            />
          </View>

          <View style={styles.nameFieldGroup}>
            <Text allowFontScaling={false} style={styles.nameFieldLabel}>New Password</Text>
            <TextInput
              allowFontScaling={false}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              placeholderTextColor="rgba(0, 0, 0, 0.50)"
              secureTextEntry
              style={styles.passwordInput}
            />
          </View>

          {error ? (
            <Text allowFontScaling={false} style={{ color: '#e53935', fontSize: 13, marginTop: 8 }}>
              {error}
            </Text>
          ) : null}
        </View>

        <View style={styles.passwordIllustrationWrap}>
          <PasswordIllustration width={368} height={412} />
        </View>
      </ScrollView>

      <View style={[styles.nameSaveArea, { paddingBottom: Math.max(24, safeBottom + 16) }]}>
        <Pressable style={[styles.nameSaveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text allowFontScaling={false} style={styles.nameSaveText}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}
