import { Hono } from "hono"
import { ANIME } from "@consumet/extensions"
import { APIVariables } from "../../config/variables"
import { StreamingServers, SubOrSub } from "@consumet/extensions/dist/models"
import { env } from "../../config/env"
import { log } from "../../config/logger"

const animekaiRouter = new Hono<{ Variables: APIVariables }>()

const animekai = new ANIME.AnimeKai(env.ANIMEKAI_URL)
let baseUrl = "https://animekai.to"
if (env.ANIMEKAI_URL) {
  baseUrl = `https://${env.ANIMEKAI_URL}`
}

animekaiRouter.get("/", (c) => {
  return c.json(
    {
      intro: `Welcome to the animekai provider: check out the provider's website @ ${baseUrl}`,
      routes: [
        "/:query",
        "/latest-completed",
        "/new-releases",
        "/recent-added",
        "/recent-episodes",
        "/schedule/:date",
        "/spotlight",
        "/search-suggestions/:query",
        "/info",
        "/watch/:episodeId",
        "/genre/list",
        "/genre/:genre",
        "/movies",
        "/ona",
        "/ova",
        "/specials",
        "/tv",
      ],
      documentation: "https://docs.consumet.org/#tag/animekai",
    },
    { status: 200 }
  )
})

animekaiRouter.get("/search/:query", async (c) => {
  const query = c.req.param("query") as string
  const page = Number(c.req.query("page"))

  const res = await animekai.search(query, page)

  return c.json({ success: true, data: res }, { status: 200 })
})

animekaiRouter.get("/latest-completed", async (c) => {
  const page = Number(c.req.query("page"))

  try {
    const res = await animekai.fetchLatestCompleted(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/new-releases", async (c) => {
  const page = Number(c.req.query("page"))

  try {
    const res = await animekai.fetchNewReleases(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/recent-added", async (c) => {
  const page = Number(c.req.query("page"))

  try {
    const res = await animekai.fetchRecentlyAdded(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/recent-episodes", async (c) => {
  const page = Number(c.req.query("page"))

  try {
    const res = await animekai.fetchRecentlyUpdated(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/schedule/:date", async (c) => {
  const date = c.req.param("date")

  try {
    const res = await animekai.fetchSchedule(date)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/spotlight", async (c) => {
  try {
    const res = await animekai.fetchSpotlight()
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/search-suggestions/:query", async (c) => {
  const query = c.req.param("query")

  if (typeof query === "undefined")
    return c.json({ message: "query is required" }, { status: 400 })

  try {
    const res = await animekai.fetchSearchSuggestions(query)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/data/:id", async (c) => {
  const id = c.req.param("id")

  log.info(`Fetching anime data for id: ${id}`)

  if (typeof id === "undefined")
    return c.json({ message: "id is required" }, { status: 400 })

  try {
    const res = await animekai.fetchAnimeInfo(id).catch((err) => {
      return c.json({ message: err }, { status: 404 })
    })

    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/watch/:episodeId", async (c) => {
  const episodeId = c.req.param("episodeId")
  const server = c.req.query("server") as StreamingServers

  const dubParam = c.req.query("dub") || ""
  let dub: boolean = dubParam === "true" || dubParam === "1"

  if (server && !Object.values(StreamingServers).includes(server))
    return c.json({ message: "server is invalid" }, { status: 400 })

  if (typeof episodeId === "undefined")
    return c.json({ message: "id is required" }, { status: 400 })

  try {
    const res = await animekai
      .fetchEpisodeSources(
        episodeId,
        server,
        dub === true ? SubOrSub.DUB : SubOrSub.SUB
      )
      .catch((err) => {
        return c.json({ message: err }, { status: 404 })
      })

    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/servers/:episodeId", async (c) => {
  const episodeId = c.req.param("episodeId")
  const dubParam = c.req.query("dub") || ""
  let dub: boolean = dubParam === "true" || dubParam === "1"

  if (typeof episodeId === "undefined")
    return c.json({ message: "id is required" }, { status: 400 })

  try {
    const res = await animekai
      .fetchEpisodeServers(
        episodeId,
        dub === true ? SubOrSub.DUB : SubOrSub.SUB
      )
      .catch((err) => {
        return c.json({ message: err }, { status: 404 })
      })

    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/genre/list", async (c) => {
  try {
    const res = await animekai.fetchGenres()
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/genre/:genre", async (c) => {
  const genre = c.req.param("genre")
  const page = Number(c.req.query("page"))

  if (typeof genre === "undefined")
    return c.json({ message: "genre is required" }, { status: 400 })

  try {
    const res = await animekai.genreSearch(genre, page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (error) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/movies", async (c) => {
  const page = Number(c.req.query("page"))
  try {
    const res = await animekai.fetchMovie(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/ona", async (c) => {
  const page = Number(c.req.query("page"))
  try {
    const res = await animekai.fetchONA(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/ova", async (c) => {
  const page = Number(c.req.query("page"))
  try {
    const res = await animekai.fetchOVA(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/specials", async (c) => {
  const page = Number(c.req.query("page"))
  try {
    const res = await animekai.fetchSpecial(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

animekaiRouter.get("/tv", async (c) => {
  const page = Number(c.req.query("page"))
  try {
    const res = await animekai.fetchTV(page)
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
})

export default animekaiRouter
