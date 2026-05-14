import { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import PasswordIllustration from '../../../../assets/password.svg'
import { styles } from '../styles'

type PasswordVerificationScreenProps = {
  onBackPress: () => void
  safeBottom: number
  safeTop: number
}

export function PasswordVerificationScreen({
  onBackPress,
  safeBottom,
  safeTop,
}: PasswordVerificationScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('password1')
  const [newPassword, setNewPassword] = useState('')

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
        </View>

        <View style={styles.passwordIllustrationWrap}>
          <PasswordIllustration width={368} height={412} />
        </View>
      </ScrollView>

      <View style={[styles.nameSaveArea, { paddingBottom: Math.max(24, safeBottom + 16) }]}>
        <Pressable style={styles.nameSaveButton} onPress={onBackPress}>
          <Text allowFontScaling={false} style={styles.nameSaveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  )
}
