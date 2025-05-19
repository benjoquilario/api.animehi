import { Hono } from "hono"
import { APIVariables } from "../../config/variables"
import { ANIME, META, PROVIDERS_LIST } from "@consumet/extensions"
import Anilist from "@consumet/extensions/dist/providers/meta/anilist"
import Zoro from "@consumet/extensions/dist/providers/anime/zoro"
import NineAnime from "@consumet/extensions/dist/providers/anime/9anime"
import { Genres, SubOrSub } from "@consumet/extensions/dist/models/index.js"
import { StreamingServers } from "@consumet/extensions/dist/models"

import { cache } from "../../config/cache"

const anilistRouter = new Hono<{ Variables: APIVariables }>()
  .get("/", async (c) => {
    return c.json(
      {
        success: true,
        intro:
          "Welcome to the anilist provider: check out the provider's website @ https://anilist.co/",
        routes: ["/:query", "/info/:id", "/watch/:episodeId"],
        documentation: "https://docs.consumet.org/#tag/anilist",
      },
      { status: 200 }
    )
  })
  .get("/search/:query", async (c) => {
    const query = c.req.param("query").trim()
    const page = Number(decodeURIComponent(c.req.query("page") || "")) || 1
    const perPage =
      Number(decodeURIComponent(c.req.query("perPage") || "")) || 10
    const anilist = generateAnilistMeta()

    const data = await anilist.search(query, page, perPage)

    return c.json({ success: true, data }, { status: 200 })
  })
  .get("/advanced-search", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")
    const query = c.req.query("query")
    const page = Number(c.req.query("page")) || 1
    const perPage = Number(c.req.query("perPage"))
    const type = c.req.query("type")
    let genres = c.req.query("genres") as string | string[]

    const id = c.req.query("id")
    const format = c.req.query("format")
    let sort = c.req.query("sort") as string | string[]
    const status = c.req.query("status")
    const year = Number(c.req.query("year"))
    const season = c.req.query("season")

    const anilist = generateAnilistMeta()

    if (genres) {
      JSON.parse(genres as string).forEach((genre: string) => {
        if (!Object.values(Genres).includes(genre as Genres)) {
          return c.json(
            { message: `${genre} is not a valid genre` },
            { status: 400 }
          )
        }
      })

      genres = JSON.parse(genres as string)
    }

    if (sort) sort = JSON.parse(sort as string)

    if (season)
      if (!["WINTER", "SPRING", "SUMMER", "FALL"].includes(season))
        return c.json(
          { message: `${season} is not a valid season` },
          { status: 400 }
        )

    const data = await cache.getOrSet(
      async () =>
        await anilist.advancedSearch(
          query,
          type,
          page,
          perPage,
          format,
          sort as string[],
          genres as string[],
          id,
          year,
          status,
          season
        ),
      cacheConfig.key,
      cacheConfig.duration
    )

    return c.json({ success: true, data }, { status: 200 })
  })
  .get("/episodes/media/:id", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")
    const id = decodeURIComponent(c.req.param("id")) as string

    const fetchFillerParam = decodeURIComponent(
      c.req.query("fetchFiller") || ""
    )
    let fetchFiller: boolean =
      fetchFillerParam === "true" || fetchFillerParam === "1"

    const dubParam = c.req.query("dub") || ""
    let dub: boolean = dubParam === "true" || dubParam === "1"

    const fetchZoro = async () => {
      let zoroList = generateAnilistMeta("zoro")

      try {
        const data = await zoroList.fetchEpisodesListById(id, dub, fetchFiller)

        return {
          providerId: "zoro",
          episodes: data,
        }
      } catch (error) {
        return null
      }
    }

    const fetchPahe = async () => {
      let paheList = generateAnilistMeta("animepahe")

      try {
        const data = await paheList.fetchEpisodesListById(id, dub, fetchFiller)

        return {
          providerId: "pahe",
          episodes: data,
        }
      } catch (error) {
        return null
      }
    }

    const data = await cache.getOrSet(
      async () => await Promise.all([fetchPahe(), fetchZoro()]),
      cacheConfig.key,
      cacheConfig.duration
    )

    const removeEmpty = data.filter((d) => d !== null)

    return c.json({ success: true, data: removeEmpty }, { status: 200 })
  })
  .get("/trending", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")

    const page = Number(decodeURIComponent(c.req.query("page") || "")) || 1
    const perPage =
      Number(decodeURIComponent(c.req.query("perPage") || "")) || 10

    const anilist = generateAnilistMeta()

    const data = await cache.getOrSet(
      async () => await anilist.fetchTrendingAnime(page, perPage),
      cacheConfig.key,
      cacheConfig.duration
    )

    return c.json({ success: true, data: data }, { status: 200 })
  })
  .get("/popular", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")
    const page = Number(decodeURIComponent(c.req.query("page") || "")) || 1
    const perPage =
      Number(decodeURIComponent(c.req.query("perPage") || "")) || 10
    const anilist = generateAnilistMeta()

    const data = await cache.getOrSet(
      async () => await anilist.fetchPopularAnime(page, perPage),
      cacheConfig.key,
      cacheConfig.duration
    )

    return c.json({ success: true, data: await data }, { status: 200 })
  })
  .get("/watch/:episodeId", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")
    const episodeId = c.req.param("episodeId").trim()

    const provider = c.req.query("provider") as string | undefined
    const server = c.req.query("server") as StreamingServers | undefined
    let isDub = c.req.query("dub") as string | boolean | undefined

    const anilist = generateAnilistMeta()

    const data = await cache.getOrSet(
      async () =>
        provider === "zoro" || provider === "animekai"
          ? await anilist.fetchEpisodeSources(
              episodeId,
              server,
              isDub ? SubOrSub.DUB : SubOrSub.SUB
            )
          : await anilist.fetchEpisodeSources(episodeId, server),
      cacheConfig.key,
      cacheConfig.duration
    )

    return c.json({ success: true, data }, { status: 200 })
  })
  .get("/airing-schedule", async (c) => {
    const page = Number(c.req.query("page") || 1)
    const perPage = Number(c.req.query("perPage") || 20)
    const weekStart = Number(c.req.query("weekStart"))
    const weekEnd = Number(c.req.query("weekEnd") || weekStart + 604800)
    const notYetAired = c.req.query("notYetAired") === "true"

    const anilist = generateAnilistMeta()
    const _weekStart = Math.ceil(Date.now() / 1000)

    const res = await anilist.fetchAiringSchedule(
      page ?? 1,
      perPage ?? 20,
      weekStart ?? _weekStart,
      weekEnd ?? _weekStart + 604800,
      notYetAired ?? true
    )

    return c.json({ success: true, data: res }, { status: 200 })
  })
  .get("/genre", async (c) => {
    const genres = c.req.query("genres") as string
    const page = Number(c.req.query("page"))
    const perPage = Number(c.req.query("perPage"))

    const anilist = generateAnilistMeta()

    if (typeof genres === "undefined")
      return c.json({ message: "genres is required" }, { status: 400 })

    JSON.parse(genres).forEach((genre: string) => {
      if (!Object.values(Genres).includes(genre as Genres)) {
        return c.json(
          { message: `${genre} is not a valid genre` },
          { status: 400 }
        )
      }
    })

    const res = await anilist.fetchAnimeGenres(
      JSON.parse(genres),
      page,
      perPage
    )

    return c.json({ success: true, data: res }, { status: 200 })
  })
  .get("/recent-episodes", async (c) => {
    const provider = c.req.query("provider") as "zoro"
    const page = Number(c.req.query("page")) || 1
    const perPage = Number(c.req.query("perPage")) || 10

    const anilist = generateAnilistMeta(provider)

    const res = await anilist.fetchRecentEpisodes(provider, page, perPage)

    return c.json({ success: true, data: res }, { status: 200 })
  })
  .get("/random-anime", async (c) => {
    const anilist = generateAnilistMeta()

    const res = await anilist.fetchRandomAnime().catch((err) => {
      return c.json({ message: "Anime not found" }, { status: 404 })
    })
    return c.json({ success: true, data: res }, { status: 200 })
  })
  .get("/servers/:id", async (c) => {
    const id = c.req.param("id").trim()
    const provider = c.req.query("provider") as string | undefined

    let anilist = generateAnilistMeta(provider)

    const res = await anilist.fetchEpisodeServers(id)

    anilist = new META.Anilist()
    return c.json({ success: true, data: res }, { status: 200 })
  })
  .get("episodes/:id", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")
    const id = decodeURIComponent(c.req.param("id")) as string

    const fetchFillerParam = decodeURIComponent(
      c.req.query("fetchFiller") || ""
    )

    const provider = c.req.query("provider") as string | undefined

    let fetchFiller: boolean =
      fetchFillerParam === "true" || fetchFillerParam === "1"

    const dubParam = c.req.query("dub") || ""
    let dub: boolean = dubParam === "true" || dubParam === "1"

    let anilist = generateAnilistMeta(provider)

    try {
      const data = await cache.getOrSet(
        async () =>
          await anilist.fetchEpisodesListById(id, dub as boolean, fetchFiller),
        cacheConfig.key,
        cacheConfig.duration
      )

      return c.json({ success: true, data }, { status: 200 })
    } catch (error) {
      return c.json({ message: "Anime not found" }, { status: 404 })
    }
  })
  .get("/data/:id", async (c) => {
    const id = c.req.param("id")

    const anilist = generateAnilistMeta()
    const res = await anilist.fetchAnilistInfoById(id)

    return c.json({ success: true, data: res }, { status: 200 })
  })
  .get("/info/:id", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")

    const today = new Date()
    const dayOfWeek = today.getDay()

    const id = decodeURIComponent(c.req.param("id")) as string

    const fetchFillerParam = decodeURIComponent(
      c.req.query("fetchFiller") || ""
    )

    const provider = c.req.query("provider") as string | undefined

    let fetchFiller: boolean =
      fetchFillerParam === "true" || fetchFillerParam === "1"

    const dubParam = c.req.query("dub") || ""
    let dub: boolean = dubParam === "true" || dubParam === "1"

    let anilist = generateAnilistMeta(provider)

    try {
      const data = await cache.getOrSet(
        async () =>
          await anilist.fetchEpisodesListById(id, dub as boolean, fetchFiller),
        cacheConfig.key,
        cacheConfig.duration
      )

      return c.json({ success: true, data }, { status: 200 })
    } catch (error) {
      return c.json({ message: "Anime not found" }, { status: 404 })
    }
  })
  .get("/character/:id", async (c) => {
    const id = decodeURIComponent(c.req.param("id")) as string

    const anilist = generateAnilistMeta()
    const res = await anilist.fetchCharacterInfoById(id)

    return c.json({ success: true, data: res }, { status: 200 })
  })
  .get("/staff/:id", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG")
    const id = decodeURIComponent(c.req.param("id")) as string

    const anilist = generateAnilistMeta()
    try {
      const data = await cache.getOrSet(
        async () => await anilist.fetchStaffById(Number(id)),
        cacheConfig.key,
        cacheConfig.duration
      )

      return c.json({ success: true, data }, { status: 200 })
    } catch (err: any) {
      return c.json({ message: err.message }, { status: 404 })
    }
  })

const generateAnilistMeta = (
  provider: string | undefined = undefined
): Anilist => {
  if (typeof provider !== "undefined") {
    let possibleProvider = PROVIDERS_LIST.ANIME.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    )

    if (possibleProvider instanceof NineAnime) {
      possibleProvider = new ANIME.NineAnime(
        process.env?.NINE_ANIME_HELPER_URL,
        {
          url: process.env?.NINE_ANIME_PROXY as string,
        },
        process.env?.NINE_ANIME_HELPER_KEY as string
      )
    }

    return new META.Anilist(possibleProvider, {
      url: process.env.PROXY as string | string[],
    })
  } else {
    // default provider is Zoro
    return new Anilist(new Zoro(), {
      url: process.env.PROXY as string | string[],
    })
  }
}

export default anilistRouter
