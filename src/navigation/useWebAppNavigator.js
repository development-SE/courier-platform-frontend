import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWebAppNavigator } from './appNavigator'

export function useWebAppNavigator() {
  const navigate = useNavigate()

  return useMemo(
    () => createWebAppNavigator(navigate),
    [navigate],
  )
}
