export const ACCEPT_ENCODING_HEADER = "gzip, deflate, br" as const
export const USER_AGENT_HEADER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" as const
export const ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9" as const

// previously zoro.to -> aniwatch.to -> aniwatchtv.to -> hianimez.to
const DOMAIN = "hianimez.to" as const
export const SRC_BASE_URL = `https://${DOMAIN}` as const
export const SRC_AJAX_URL = `${SRC_BASE_URL}/ajax` as const
export const SRC_HOME_URL = `${SRC_BASE_URL}/home` as const
export const SRC_SEARCH_URL = `${SRC_BASE_URL}/search` as const
