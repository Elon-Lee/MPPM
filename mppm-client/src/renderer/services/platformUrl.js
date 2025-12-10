/**
 * 选择用于打开的目标 URL：优先首页，其次登录页，最后兜底。
 */
export const resolvePlatformOpenUrl = (platform) => {
  if (!platform) return null
  const candidates = [platform.homeUrl, platform.loginUrl]
  for (const url of candidates) {
    if (url && typeof url === 'string') {
      return url
    }
  }
  return null
}

