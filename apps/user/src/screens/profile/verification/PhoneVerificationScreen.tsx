import { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import PhoneIllustration from '../../../../assets/phone.svg'
import { styles } from '../styles'

type PhoneVerificationScreenProps = {
  phone?: string
  onBackPress: () => void
  onSave: (phone: string) => Promise<{ ok: boolean; message?: string }>
  safeBottom: number
  safeTop: number
}

export function PhoneVerificationScreen({
  phone,
  onBackPress,
  onSave,
  safeBottom,
  safeTop,
}: PhoneVerificationScreenProps) {
  const existingPhone = phone ?? ''
  const initialCode = existingPhone.startsWith('+') ? existingPhone.slice(0, existingPhone.indexOf(' ') > 0 ? existingPhone.indexOf(' ') : 2) : '+7'
  const initialNumber = existingPhone.startsWith('+') ? existingPhone.slice(existingPhone.indexOf(' ') > 0 ? existingPhone.indexOf(' ') + 1 : 2).trim() : existingPhone

  const [countryCode, setCountryCode] = useState(initialCode)
  const [phoneNumber, setPhoneNumber] = useState(initialNumber || '708 557 53 33')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const fullPhone = `${countryCode.trim()}${phoneNumber.replace(/\s/g, '')}`

    if (fullPhone === existingPhone?.replace(/\s/g, '')) {
      onBackPress()
      return
    }

    setSaving(true)
    const result = await onSave(fullPhone)
    setSaving(false)

    if (result.ok) {
      onBackPress()
    } else {
      Alert.alert('Error', result.message ?? 'Failed to update phone')
    }
  }

  return (
    <View style={styles.nameScreen}>
      <View style={[styles.nameHeader, { paddingTop: safeTop }]}>
        <Pressable style={styles.editBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.nameHeaderTitle}>Phone</Text>
        <View style={styles.editHeaderSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.phoneContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text allowFontScaling={false} style={styles.nameVerificationTitle}>Phone Verification</Text>

        <View style={styles.phoneForm}>
          <View style={styles.countryInputWrap}>
            <View style={styles.flagCircle}>
              <Text allowFontScaling={false} style={styles.flagText}>KZ</Text>
            </View>
            <TextInput
              allowFontScaling={false}
              value={countryCode}
              onChangeText={setCountryCode}
              keyboardType="phone-pad"
              placeholder="+7"
              placeholderTextColor="rgba(0, 0, 0, 0.35)"
              style={styles.countryInput}
              editable={!saving}
            />
          </View>

          <TextInput
            allowFontScaling={false}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="708 557 53 33"
            placeholderTextColor="rgba(0, 0, 0, 0.35)"
            style={styles.phoneInput}
            editable={!saving}
          />
        </View>

        <View style={styles.phoneIllustrationWrap}>
          <PhoneIllustration width={286} height={434}/>
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
