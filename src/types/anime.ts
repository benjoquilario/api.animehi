export type AnimeServers =
  | "hd-1"
  | "hd-2"
  | "megacloud"
  | "streamsb"
  | "streamtape"

export enum Servers {
  VidStreaming = "hd-1",
  MegaCloud = "megacloud",
  StreamSB = "streamsb",
  StreamTape = "streamtape",
  VidCloud = "hd-2",
  AsianLoad = "asianload",
  GogoCDN = "gogocdn",
  MixDrop = "mixdrop",
  UpCloud = "upcloud",
  VizCloud = "vizcloud",
  MyCloud = "mycloud",
  Filemoon = "filemoon",
}

import type { Intro, Subtitle, Video } from "./extractors"

export type ScrapedAnimeEpisodesSources = {
  headers?: {
    [k: string]: string
  }
  intro?: Intro
  subtitles?: Subtitle[]
  sources: Video[]
  download?: string
  embedURL?: string
}
