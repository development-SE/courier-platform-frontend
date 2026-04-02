export function loadCourierMap() {
  return import('./CourierMap')
}

export function preloadCourierMap() {
  void loadCourierMap()
}
