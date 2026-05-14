import { useRef, useState } from 'react'
import { Feather, FontAwesome5 } from '@expo/vector-icons'
import { Animated, Easing, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import PaymentIllustration from '../../../assets/payment.svg'
import { AddPaymentMethodScreen } from './AddPaymentMethodScreen'
import { styles } from './styles'

type PaymentMethodsScreenProps = {
  onBackPress: () => void
  safeBottom: number
  safeTop: number
}

const paymentMethods = [
  {
    backgroundColor: '#c5edc1',
    color: '#002107',
    icon: 'money-bill-wave',
    label: 'Cash',
  },
  {
    backgroundColor: '#d8e2ff',
    color: '#001a43',
    icon: 'credit-card',
    label: 'Card',
  },
  {
    backgroundColor: '#ffdad2',
    color: '#3c0700',
    icon: 'digital-tachograph',
    label: 'Digital',
  },
] as const

export type SavedPaymentCard = {
  brand: 'visa' | 'mastercard'
  label: string
  number: string
  selected: boolean
}

export function PaymentMethodsScreen({
  onBackPress,
  safeBottom,
  safeTop,
}: PaymentMethodsScreenProps) {
  const { width } = useWindowDimensions()
  const addCardProgress = useRef(new Animated.Value(0)).current
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [savedCards, setSavedCards] = useState<SavedPaymentCard[]>([])
  const hasSavedCards = savedCards.length > 0

  const openAddCard = () => {
    setIsAddCardOpen(true)
    addCardProgress.setValue(0)
    Animated.timing(addCardProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeAddCard = () => {
    Animated.timing(addCardProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsAddCardOpen(false)
      }
    })
  }

  const addSavedCard = (card: SavedPaymentCard) => {
    setSavedCards((currentCards) => [
      { ...card, selected: true },
      ...currentCards.map((currentCard) => ({ ...currentCard, selected: false })),
    ])
    closeAddCard()
  }

  const selectSavedCard = (selectedIndex: number) => {
    setSavedCards((currentCards) =>
      currentCards.map((card, cardIndex) => ({
        ...card,
        selected: cardIndex === selectedIndex,
      })),
    )
  }

  const deleteSavedCard = (deletedIndex: number) => {
    setSavedCards((currentCards) => {
      const nextCards = currentCards.filter((_, cardIndex) => cardIndex !== deletedIndex)

      if (nextCards.length === 0) {
        return []
      }

      const hasSelectedCard = nextCards.some((card) => card.selected)
      return hasSelectedCard
        ? nextCards
        : nextCards.map((card, cardIndex) => ({
          ...card,
          selected: cardIndex === 0,
        }))
    })
  }

  return (
    <SafeAreaView style={styles.paymentScreen} edges={['top']}>
      <View style={styles.paymentHeader}>
        <Pressable style={styles.paymentBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#a7391e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.paymentHeaderTitle}>Payment Methods</Text>
        <View style={styles.paymentHeaderSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.paymentContent, { paddingBottom: Math.max(32, safeBottom + 24) }]}
      >
        <Text allowFontScaling={false} style={styles.paymentSectionLabel}>AVAILABLE METHODS</Text>

        <View style={styles.paymentMethodsRow}>
          {paymentMethods.map((method) => (
            <Pressable
              key={method.label}
              style={[styles.paymentMethodCard, { backgroundColor: method.backgroundColor }]}
            >
              <FontAwesome5 name={method.icon} size={18} color={method.color} />
              <Text allowFontScaling={false} style={[styles.paymentMethodText, { color: method.color }]}>
                {method.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {hasSavedCards ? (
          <View style={styles.savedCardsSection}>
            <Text allowFontScaling={false} style={styles.savedCardsTitle}>Saved Cards</Text>

            <View style={styles.savedCardsList}>
              {savedCards.map((card, cardIndex) => (
                <Pressable
                  key={`${card.number}-${card.label}-${cardIndex}`}
                  style={[styles.savedCard, card.selected && styles.savedCardSelected]}
                  onPress={() => selectSavedCard(cardIndex)}
                >
                  <View style={[styles.savedCardBrand, card.selected ? styles.savedCardBrandSelected : undefined]}>
                    {card.brand === 'visa' ? (
                      <Text allowFontScaling={false} style={styles.savedCardVisaText}>VISA</Text>
                    ) : (
                      <View style={styles.mastercardMark}>
                        <View style={styles.mastercardCircleRed} />
                        <View style={styles.mastercardCircleOrange} />
                      </View>
                    )}
                  </View>

                  <View style={styles.savedCardBody}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.savedCardNumber, card.selected && styles.savedCardNumberSelected]}
                    >
                      {card.number}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.savedCardLabel, card.selected && styles.savedCardLabelSelected]}
                    >
                      {card.label}
                    </Text>
                  </View>

                  <View style={styles.savedCardActions}>
                    <View style={[styles.savedCardRadio, card.selected && styles.savedCardRadioSelected]}>
                      {card.selected ? <Feather name="check" size={13} color="#ffffff" /> : null}
                    </View>

                    <Pressable
                      hitSlop={10}
                      style={styles.savedCardDeleteButton}
                      onPress={() => deleteSavedCard(cardIndex)}
                    >
                      <Feather name="trash-2" size={16} color={card.selected ? '#a7391e' : '#8b716b'} />
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.addNewCardButton} onPress={openAddCard}>
              <Feather name="plus" size={16} color="#a7391e" />
              <Text allowFontScaling={false} style={styles.addNewCardText}>Add New Card</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.paymentEmptyState}>
            <View style={styles.paymentIllustrationWrap}>
              <PaymentIllustration width={300} height={260} />
            </View>
            <Text allowFontScaling={false} style={styles.paymentEmptyTitle}>No payment methods added</Text>
            <Text allowFontScaling={false} style={styles.paymentEmptySubtitle}>
              Add a card to make checkout faster{'\n'}and easier.
            </Text>
          </View>
        )}
      </ScrollView>

      {!hasSavedCards ? (
        <View style={[styles.paymentBottomAction, { paddingBottom: Math.max(24, safeBottom + 16) }]}>
          <Pressable style={styles.paymentAddButton} onPress={openAddCard}>
            <Text allowFontScaling={false} style={styles.paymentAddButtonText}>Add Card</Text>
          </Pressable>
        </View>
      ) : null}

      {isAddCardOpen && (
        <Animated.View
          style={[
            styles.paymentOverlay,
            {
              transform: [
                {
                  translateX: addCardProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AddPaymentMethodScreen
            safeBottom={safeBottom}
            safeTop={safeTop}
            onAddCard={addSavedCard}
            onBackPress={closeAddCard}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  )
}
