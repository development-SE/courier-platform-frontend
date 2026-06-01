import { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import NameIllustration from '../../../../assets/name.svg'
import { styles } from '../styles'

type NameVerificationScreenProps = {
  firstName: string
  lastName: string
  onBackPress: () => void
  onSave: (firstName: string, lastName: string) => Promise<{ ok: boolean; message?: string }>
  safeBottom: number
  safeTop: number
}

export function NameVerificationScreen({
  firstName,
  lastName,
  onBackPress,
  onSave,
  safeBottom,
  safeTop,
}: NameVerificationScreenProps) {
  const [draftFirstName, setDraftFirstName] = useState(firstName)
  const [draftLastName, setDraftLastName] = useState(lastName)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmedFirst = draftFirstName.trim()
    const trimmedLast = draftLastName.trim()

    if (!trimmedFirst || !trimmedLast) {
      Alert.alert('Error', 'First name and last name are required')
      return
    }

    if (trimmedFirst === firstName && trimmedLast === lastName) {
      onBackPress()
      return
    }

    setSaving(true)
    const result = await onSave(trimmedFirst, trimmedLast)
    setSaving(false)

    if (result.ok) {
      onBackPress()
    } else {
      Alert.alert('Error', result.message ?? 'Failed to update name')
    }
  }

  return (
    <View style={styles.nameScreen}>
      <View style={[styles.nameHeader, { paddingTop: safeTop }]}>
        <Pressable style={styles.editBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.nameHeaderTitle}>Name</Text>
        <View style={styles.editHeaderSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.nameContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text allowFontScaling={false} style={styles.nameVerificationTitle}>Name Verification</Text>

        <View style={styles.nameForm}>
          <View style={styles.nameFieldGroup}>
            <Text allowFontScaling={false} style={styles.nameFieldLabel}>Name</Text>
            <TextInput
              allowFontScaling={false}
              value={draftFirstName}
              onChangeText={setDraftFirstName}
              placeholder="Name"
              placeholderTextColor="rgba(0, 0, 0, 0.35)"
              style={styles.nameInput}
              editable={!saving}
            />
          </View>

          <View style={styles.nameFieldGroup}>
            <Text allowFontScaling={false} style={styles.nameFieldLabel}>Surname</Text>
            <TextInput
              allowFontScaling={false}
              value={draftLastName}
              onChangeText={setDraftLastName}
              placeholder="Surname"
              placeholderTextColor="rgba(0, 0, 0, 0.35)"
              style={styles.nameInput}
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.signatureWrap}>
          <NameIllustration width={402} height={344} />
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
