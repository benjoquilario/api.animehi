import { type CheerioAPI } from "cheerio"

export function retrieveServerId(
  $: CheerioAPI,
  index: number,
  category: "sub" | "dub" | "raw"
) {
  return (
    $(`.ps_-block.ps_-block-sub.servers-${category} > .ps__-list .server-item`)
      ?.map((_, el) =>
        $(el).attr("data-server-id") == `${index}` ? $(el) : null
      )
      ?.get()[0]
      ?.attr("data-id") || null
  )
}

export function substringAfter(str: string, toFind: string) {
  const index = str.indexOf(toFind)
  return index == -1 ? "" : str.substring(index + toFind.length)
}

export function substringBefore(str: string, toFind: string) {
  const index = str.indexOf(toFind)
  return index == -1 ? "" : str.substring(0, index)
}
