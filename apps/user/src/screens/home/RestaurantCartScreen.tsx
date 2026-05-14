import { useMemo, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type CartItem = {
  id: string
  name: string
  description: string
  price: number
  image: string
  quantity: number
}

type RestaurantCartScreenProps = {
  items: CartItem[]
  subtotal: number
  total: number
  onBackPress?: () => void
  onAddMoreItems?: () => void
  onClearCart?: () => void
  onDecreaseItem?: (itemId: string) => void
  onIncreaseItem?: (itemId: string) => void
  onCheckout?: () => void
}

type PaymentMethod = 'cash' | 'card' | 'digital'
type SavedCard = {
  id: string
  name: string
  brand: 'visa' | 'mastercard'
  last4: string
}

const deliveryFee = 2
const discount = 4

const savedCards: SavedCard[] = [
  {
    id: 'personal',
    name: 'Personal Card',
    brand: 'visa',
    last4: '7746',
  },
  {
    id: 'work',
    name: 'Work Card',
    brand: 'mastercard',
    last4: '2931',
  },
]

const quickMethods: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'digital', label: 'Digital' },
]

function PaymentMethodIcon({ method, color }: { method: PaymentMethod; color: string }) {
  if (method === 'cash') {
    return <MaterialCommunityIcons name="cash-multiple" size={22} color={color} />
  }

  if (method === 'digital') {
    return <Ionicons name="wallet-outline" size={20} color={color} />
  }

  return <MaterialCommunityIcons name="credit-card-outline" size={22} color={color} />
}

function CardBrandMark({ brand }: { brand: 'visa' | 'mastercard' }) {
  if (brand === 'visa') {
    return (
      <View style={styles.brandVisaBox}>
        <Text allowFontScaling={false} style={styles.brandVisaText}>
          VISA
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.brandMastercardBox}>
      <View style={[styles.mastercardCircle, styles.mastercardCircleLeft]} />
      <View style={[styles.mastercardCircle, styles.mastercardCircleRight]} />
    </View>
  )
}

export function RestaurantCartScreen({
  items,
  subtotal,
  total,
  onBackPress,
  onAddMoreItems,
  onClearCart,
  onDecreaseItem,
  onIncreaseItem,
  onCheckout,
}: RestaurantCartScreenProps) {
  const insets = useSafeAreaInsets()
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false)
  const [confirmedMethod, setConfirmedMethod] = useState<PaymentMethod>('card')
  const [draftMethod, setDraftMethod] = useState<PaymentMethod>('card')
  const [confirmedCardId, setConfirmedCardId] = useState(savedCards[0].id)
  const [draftCardId, setDraftCardId] = useState(savedCards[0].id)

  const confirmedCard = useMemo(
    () => savedCards.find(card => card.id === confirmedCardId) ?? savedCards[0],
    [confirmedCardId],
  )

  const openPaymentModal = () => {
    setDraftMethod(confirmedMethod)
    setDraftCardId(confirmedCardId)
    setPaymentModalVisible(true)
  }

  const closePaymentModal = () => {
    setPaymentModalVisible(false)
  }

  const confirmPaymentSelection = () => {
    setConfirmedMethod(draftMethod)

    if (draftMethod === 'card') {
      setConfirmedCardId(draftCardId)
    }

    setPaymentModalVisible(false)
  }

  const paymentValue =
    confirmedMethod === 'card'
      ? `${confirmedCard.brand === 'visa' ? 'Visa' : 'Mastercard'} **** ${confirmedCard.last4}`
      : confirmedMethod === 'cash'
        ? 'Cash on delivery'
        : 'Digital Wallet'

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBackPress} style={styles.headerBackButton}>
            <Feather name="arrow-left" size={16} color="#191c1e" />
          </Pressable>
          <Text allowFontScaling={false} style={styles.headerTitle}>
            Your Cart
          </Text>
        </View>

        <Pressable onPress={onClearCart}>
          <Text allowFontScaling={false} style={styles.clearCartText}>
            Clear cart
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 144 + Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={styles.itemsList}>
          {items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.image }} resizeMode="cover" style={styles.itemImage} />

              <View style={styles.itemContent}>
                <Text allowFontScaling={false} style={styles.itemTitle}>
                  {item.name}
                </Text>
                <Text allowFontScaling={false} style={styles.itemDescription}>
                  {item.description}
                </Text>

                <View style={styles.itemFooter}>
                  <Text allowFontScaling={false} style={styles.itemPrice}>
                    ${item.price.toFixed(2)}
                  </Text>

                  <View style={styles.quantityPill}>
                    <Pressable
                      hitSlop={8}
                      onPress={() => onDecreaseItem?.(item.id)}
                      style={styles.quantityButton}
                    >
                      <Text allowFontScaling={false} style={styles.quantityButtonText}>
                        -
                      </Text>
                    </Pressable>

                    <Text allowFontScaling={false} style={styles.quantityText}>
                      {item.quantity}
                    </Text>

                    <Pressable
                      hitSlop={8}
                      onPress={() => onIncreaseItem?.(item.id)}
                      style={[styles.quantityButton, styles.quantityButtonActive]}
                    >
                      <Text allowFontScaling={false} style={styles.quantityButtonActiveText}>
                        +
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}

          <Pressable onPress={onAddMoreItems} style={styles.addMoreRow}>
            <Feather name="plus" size={12} color="#1e5bba" />
            <Text allowFontScaling={false} style={styles.addMoreText}>
              Add more items
            </Text>
          </Pressable>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.addressCard}>
            <View style={styles.addressTopRow}>
              <View>
                <Text allowFontScaling={false} style={styles.infoLabel}>
                  DELIVERY ADDRESS
                </Text>
                <Text allowFontScaling={false} style={styles.infoValue}>
                  1248 Magnolia Way
                </Text>
              </View>

              <Pressable style={styles.iconBubble}>
                <Feather name="edit-3" size={12} color="#191c1e" />
              </Pressable>
            </View>

            <View style={styles.arrivalRow}>
              <Ionicons name="time-outline" size={12} color="#446744" />
              <Text allowFontScaling={false} style={styles.arrivalText}>
                Arrives in 25-35 mins
              </Text>
            </View>
          </View>

          <View style={styles.paymentCard}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconBox}>
                {confirmedMethod === 'card' ? (
                  <CardBrandMark brand={confirmedCard.brand} />
                ) : (
                  <PaymentMethodIcon method={confirmedMethod} color="#1e5bba" />
                )}
              </View>

              <View>
                <Text allowFontScaling={false} style={styles.infoLabel}>
                  PAYMENT METHOD
                </Text>
                <Text allowFontScaling={false} style={styles.infoValue}>
                  {paymentValue}
                </Text>
              </View>
            </View>

            <Pressable onPress={openPaymentModal}>
              <Text allowFontScaling={false} style={styles.changeText}>
                Change
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.promoWrap}>
          <View style={styles.promoInput}>
            <Text allowFontScaling={false} style={styles.promoPlaceholder}>
              Add promo code
            </Text>
          </View>

          <Pressable style={styles.applyButton}>
            <Text allowFontScaling={false} style={styles.applyButtonText}>
              Apply
            </Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text allowFontScaling={false} style={styles.summaryLabel}>
              Subtotal
            </Text>
            <Text allowFontScaling={false} style={styles.summaryValue}>
              ${subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text allowFontScaling={false} style={styles.summaryLabel}>
              Delivery fee
            </Text>
            <Text allowFontScaling={false} style={styles.summaryValue}>
              ${deliveryFee.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text allowFontScaling={false} style={styles.summaryLabel}>
              Discount
            </Text>
            <Text allowFontScaling={false} style={styles.discountValue}>
              -${discount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <Text allowFontScaling={false} style={styles.totalLabel}>
              Total
            </Text>
            <Text allowFontScaling={false} style={styles.totalValue}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable onPress={onCheckout} style={styles.checkoutButton}>
          <Text allowFontScaling={false} style={styles.checkoutButtonText}>
            Proceed to Checkout
          </Text>
        </Pressable>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={isPaymentModalVisible}
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closePaymentModal} />

          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>
                Select Payment Method
              </Text>

              <Pressable onPress={closePaymentModal} style={styles.modalCloseButton}>
                <Feather name="x" size={18} color="#58423c" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.quickMethodsRow}>
                {quickMethods.map(method => {
                  const isActive = draftMethod === method.id

                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => setDraftMethod(method.id)}
                      style={[styles.quickMethodCard, isActive && styles.quickMethodCardActive]}
                    >
                      <PaymentMethodIcon
                        method={method.id}
                        color={isActive ? '#ff7a59' : '#191c1e'}
                      />
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.quickMethodText,
                          isActive && styles.quickMethodTextActive,
                        ]}
                      >
                        {method.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {draftMethod === 'card' ? (
                <>
                  <View style={styles.savedCardsSection}>
                    <Text allowFontScaling={false} style={styles.savedCardsTitle}>
                      SAVED CARDS
                    </Text>

                    <View style={styles.savedCardsList}>
                      {savedCards.map(card => {
                        const isSelected = draftCardId === card.id

                        return (
                          <Pressable
                            key={card.id}
                            onPress={() => setDraftCardId(card.id)}
                            style={[
                              styles.savedCardRow,
                              isSelected && styles.savedCardRowSelected,
                            ]}
                          >
                            <View style={styles.savedCardLeft}>
                              <CardBrandMark brand={card.brand} />

                              <View style={styles.savedCardCopy}>
                                <Text allowFontScaling={false} style={styles.savedCardName}>
                                  {card.name}
                                </Text>
                                <Text allowFontScaling={false} style={styles.savedCardNumber}>
                                  **** {card.last4}
                                </Text>
                              </View>
                            </View>

                            {isSelected ? (
                              <View style={styles.savedCardCheck}>
                                <Feather name="check" size={14} color="#ffffff" />
                              </View>
                            ) : (
                              <View style={styles.savedCardUnchecked} />
                            )}
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>

                  <Pressable style={styles.addNewCardButton}>
                    <Feather name="plus-circle" size={18} color="#a7391e" />
                    <Text allowFontScaling={false} style={styles.addNewCardText}>
                      Add New Card
                    </Text>
                  </Pressable>
                </>
              ) : (
                <View style={styles.methodHintCard}>
                  <Text allowFontScaling={false} style={styles.methodHintText}>
                    {draftMethod === 'cash'
                      ? 'Pay with cash when the courier arrives.'
                      : 'Use your digital wallet for this order.'}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={confirmPaymentSelection} style={styles.modalConfirmButton}>
                <Text allowFontScaling={false} style={styles.modalConfirmText}>
                  Confirm Selection
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f9fb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerBackButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  clearCartText: {
    color: '#a7391e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    gap: 32,
  },
  itemsList: {
    paddingTop: 4,
    gap: 16,
  },
  itemCard: {
    padding: 16,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f2f4f6',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  itemDescription: {
    color: '#58423c',
    fontSize: 12,
    lineHeight: 19.5,
    fontWeight: '400',
  },
  itemFooter: {
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    color: '#a7391e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  quantityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e6e8ea',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  quantityButtonActive: {
    backgroundColor: '#a7391e',
  },
  quantityButtonText: {
    color: '#191c1e',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  quantityButtonActiveText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  quantityText: {
    color: '#191c1e',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  addMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMoreText: {
    color: '#1e5bba',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  detailsSection: {
    gap: 16,
  },
  addressCard: {
    padding: 24,
    borderRadius: 32,
    gap: 16,
    backgroundColor: '#f2f4f6',
  },
  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e3e5',
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrivalText: {
    color: '#446744',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  paymentCard: {
    height: 88,
    paddingHorizontal: 24,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconBox: {
    width: 38,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e3e5',
  },
  brandVisaBox: {
    minWidth: 32,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  brandVisaText: {
    color: '#1e5bba',
    fontSize: 10,
    lineHeight: 12,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  brandMastercardBox: {
    width: 28,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mastercardCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mastercardCircleLeft: {
    left: 5,
    backgroundColor: 'rgba(235, 0, 27, 0.8)',
  },
  mastercardCircleRight: {
    right: 5,
    backgroundColor: 'rgba(247, 158, 27, 0.8)',
  },
  infoLabel: {
    color: '#58423c',
    opacity: 0.6,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.25,
    fontWeight: '600',
  },
  infoValue: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  changeText: {
    color: '#a7391e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  promoWrap: {
    position: 'relative',
  },
  promoInput: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 48,
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  promoPlaceholder: {
    color: 'rgba(88, 66, 60, 0.5)',
    fontSize: 14,
    fontWeight: '400',
  },
  applyButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191c1e',
  },
  applyButtonText: {
    color: '#f7f9fb',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 24,
    borderRadius: 32,
    gap: 16,
    backgroundColor: '#ffffff',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  summaryValue: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  discountValue: {
    color: '#446744',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e6e8ea',
  },
  totalRow: {
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  totalValue: {
    color: '#191c1e',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
  },
  checkoutButton: {
    height: 68,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 8,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 28, 30, 0.4)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    minHeight: 560,
    maxHeight: '78%',
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 12,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    marginBottom: 24,
    backgroundColor: '#e0e3e5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#191c1e',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f4f6',
  },
  modalContent: {
    paddingBottom: 24,
    gap: 24,
  },
  quickMethodsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickMethodCard: {
    flex: 1,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f2f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickMethodCardActive: {
    backgroundColor: 'rgba(255, 122, 89, 0.08)',
    borderColor: '#ff7a59',
  },
  quickMethodText: {
    color: '#191c1e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  quickMethodTextActive: {
    color: '#ff7a59',
  },
  savedCardsSection: {
    gap: 12,
  },
  savedCardsTitle: {
    marginLeft: 8,
    color: 'rgba(25, 28, 30, 0.6)',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  savedCardsList: {
    gap: 12,
  },
  savedCardRow: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
  },
  savedCardRowSelected: {
    backgroundColor: 'rgba(255, 122, 89, 0.12)',
  },
  savedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  savedCardCopy: {
    gap: 2,
  },
  savedCardName: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  savedCardNumber: {
    color: 'rgba(25, 28, 30, 0.6)',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 1.6,
    fontWeight: '500',
  },
  savedCardCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
  },
  savedCardUnchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d8dadc',
  },
  addNewCardButton: {
    height: 64,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#dfc0b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
  },
  addNewCardText: {
    color: '#a7391e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  methodHintCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#f2f4f6',
  },
  methodHintText: {
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalFooter: {
    paddingTop: 12,
  },
  modalConfirmButton: {
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c65432',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
})
