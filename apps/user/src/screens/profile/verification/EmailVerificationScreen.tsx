import { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import EmailIllustration from '../../../../assets/email.svg'
import { styles } from '../styles'

type EmailVerificationScreenProps = {
  email: string
  onBackPress: () => void
  onSave: (email: string) => Promise<{ ok: boolean; message?: string }>
  safeBottom: number
  safeTop: number
}

export function EmailVerificationScreen({
  email,
  onBackPress,
  onSave,
  safeBottom,
  safeTop,
}: EmailVerificationScreenProps) {
  const [draftEmail, setDraftEmail] = useState(email)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = draftEmail.trim()

    if (!trimmed) {
      Alert.alert('Error', 'Email is required')
      return
    }

    if (trimmed === email) {
      onBackPress()
      return
    }

    setSaving(true)
    const result = await onSave(trimmed)
    setSaving(false)

    if (result.ok) {
      onBackPress()
    } else {
      Alert.alert('Error', result.message ?? 'Failed to update email')
    }
  }

  return (
    <View style={styles.nameScreen}>
      <View style={[styles.nameHeader, { paddingTop: safeTop }]}>
        <Pressable style={styles.editBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.nameHeaderTitle}>Email</Text>
        <View style={styles.editHeaderSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.emailContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text allowFontScaling={false} style={styles.nameVerificationTitle}>Email Verification</Text>

        <View style={styles.emailForm}>
          <Text allowFontScaling={false} style={styles.nameFieldLabel}>Email</Text>
          <TextInput
            allowFontScaling={false}
            value={draftEmail}
            onChangeText={setDraftEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Example@gmail.com"
            placeholderTextColor="rgba(0, 0, 0, 0.35)"
            style={styles.nameInput}
            editable={!saving}
          />
        </View>

        <View style={styles.emailIllustrationWrap}>
          <EmailIllustration width={400} height={300} />
        </View>
      </ScrollView>

      <View style={[styles.nameSaveArea, { paddingBottom: Math.max(24, safeBottom + 16) }]}>
        <Pressable style={[styles.nameSaveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text allowFontScaling={false} style={styles.nameSaveText}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}
