export function canAccessAuthorizedRoute(isAuthorized) {
  return Boolean(isAuthorized)
}

export function resolveUnauthorizedRedirect({
  isAuthorized,
  signInPath,
}) {
  return canAccessAuthorizedRoute(isAuthorized) ? null : signInPath
}
