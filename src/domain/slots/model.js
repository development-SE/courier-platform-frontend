export const SLOT_STATE = {
  BOOKED: 'booked',
  AVAILABLE: 'available',
  CLOSED: 'closed',
}

export function normalizeSlot(rawSlot) {
  return {
    ...rawSlot,
    booked: Boolean(rawSlot.booked),
    available: Boolean(rawSlot.available),
  }
}

export function normalizeSlots(rawSlots) {
  return rawSlots.map(slot => normalizeSlot(slot))
}

export function getSlotState(slot) {
  if (!slot.available) return SLOT_STATE.CLOSED
  if (slot.booked) return SLOT_STATE.BOOKED
  return SLOT_STATE.AVAILABLE
}

export function groupSlotsByDate(slots) {
  return slots.reduce((accumulator, slot) => {
    if (!accumulator[slot.date]) {
      accumulator[slot.date] = { label: `${slot.date} (${slot.dayShort})`, slots: [] }
    }
    accumulator[slot.date].slots.push(slot)
    return accumulator
  }, {})
}

export function countBookedSlots(slots) {
  return slots.reduce((total, slot) => total + (slot.booked ? 1 : 0), 0)
}
