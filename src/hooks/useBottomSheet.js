import { useCallback, useRef, useState } from 'react'

/**
 * Snap heights (px from bottom of the sheet container, above the nav bar).
 * These are tuned for a 390×844 mobile viewport with nav-height ~64px.
 *
 *  COLLAPSED — 84px  : drag handle + one-line status strip only
 *  HALF      — 316px : core order info visible, ~380px of map above
 *  EXPANDED  — 598px : full details, ~120px of map still visible at top
 */
export const SNAP_HEIGHTS = [84, 316, 598]
export const SNAP = { COLLAPSED: 0, HALF: 1, EXPANDED: 2 }

export function useBottomSheet(initialSnap = SNAP.HALF) {
  const [snapIndex, setSnapIndex]   = useState(initialSnap)
  const [height, setHeight]         = useState(SNAP_HEIGHTS[initialSnap])
  const [isDragging, setIsDragging] = useState(false)

  // mutable refs so pointer handlers stay referentially stable
  const startYRef      = useRef(0)
  const startHeightRef = useRef(SNAP_HEIGHTS[initialSnap])
  const liveHeightRef  = useRef(SNAP_HEIGHTS[initialSnap])

  /* ── internal helpers ── */
  const applySnap = useCallback((index) => {
    const i   = Math.max(0, Math.min(SNAP_HEIGHTS.length - 1, index))
    const h   = SNAP_HEIGHTS[i]
    liveHeightRef.current = h
    setSnapIndex(i)
    setHeight(h)
    return i
  }, [])

  const snapToNearest = useCallback(() => {
    const current = liveHeightRef.current
    let nearest   = 0
    let minDist   = Infinity
    SNAP_HEIGHTS.forEach((h, i) => {
      const d = Math.abs(h - current)
      if (d < minDist) { minDist = d; nearest = i }
    })
    applySnap(nearest)
  }, [applySnap])

  /* ── pointer handlers (attach to drag handle element) ── */
  const onPointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    startYRef.current      = e.clientY
    startHeightRef.current = liveHeightRef.current
    setIsDragging(true)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const delta  = startYRef.current - e.clientY        // positive = drag up
    const newH   = Math.max(
      SNAP_HEIGHTS[0] - 20,                             // allow slight over-drag down
      Math.min(SNAP_HEIGHTS[SNAP_HEIGHTS.length - 1] + 20, startHeightRef.current + delta)
    )
    liveHeightRef.current = newH
    setHeight(newH)
  }, [])

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
    snapToNearest()
  }, [snapToNearest])

  /* ── public API ── */
  const snapTo     = useCallback((index) => applySnap(index), [applySnap])
  const collapse   = useCallback(() => applySnap(SNAP.COLLAPSED), [applySnap])
  const expand     = useCallback(() => applySnap(SNAP.EXPANDED),  [applySnap])
  const halfOpen   = useCallback(() => applySnap(SNAP.HALF),      [applySnap])

  const dragHandleProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    style: { touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' },
  }

  return {
    height,
    snapIndex,
    isDragging,
    dragHandleProps,
    snapTo,
    collapse,
    halfOpen,
    expand,
    isCollapsed: snapIndex === SNAP.COLLAPSED,
    isHalf:      snapIndex === SNAP.HALF,
    isExpanded:  snapIndex === SNAP.EXPANDED,
  }
}
