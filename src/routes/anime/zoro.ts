import { Hono } from "hono"
import { ANIME } from "@consumet/extensions"
import { StreamingServers, SubOrSub } from "@consumet/extensions/dist/models"
import { APIVariables } from "../../config/variables"
import { env } from "../../config/env"
const zoroRouter = new Hono<{ Variables: APIVariables }>()

// Initialize the zoro provider
const zoro = new ANIME.Zoro(env.ZORO_URL)
let baseUrl = "https://hianimez.to"

if (env.ZORO_URL) {
  baseUrl = `https://${env.ZORO_URL}`
}

// Root route
zoroRouter.get("/", (c) => {
  return c.json(
    {
      intro: `Welcome to the zoro provider: check out the provider's website @ ${baseUrl}`,
      routes: [
        "/:query",
        "/recent-episodes",
        "/top-airing",
        "/most-popular",
        "/most-favorite",
        "/latest-completed",
        "/recent-added",
        "/info?id",
        "/watch/:episodeId",
        "/genre/list",
        "/genre/:genre",
        "/movies",
        "/ona",
        "/ova",
        "/specials",
        "/tv",
      ],
      documentation: "https://docs.consumet.org/#tag/zoro",
    },
    { status: 200 }
  )
})

// Search route
zoroRouter.get("/search/:query", async (c) => {
  const query = c.req.param("query")
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.search(query, page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Recent episodes route
zoroRouter.get("/recent-episodes", async (c) => {
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchRecentlyUpdated(page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Top airing route
zoroRouter.get("/top-airing", async (c) => {
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchTopAiring(page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Most popular route
zoroRouter.get("/most-popular", async (c) => {
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchMostPopular(page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Most favorite route
zoroRouter.get("/most-favorite", async (c) => {
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchMostFavorite(page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Latest completed route
zoroRouter.get("/latest-completed", async (c) => {
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchLatestCompleted(page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Recent added route
zoroRouter.get("/recent-added", async (c) => {
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchRecentlyAdded(page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Top upcoming route
zoroRouter.get("/top-upcoming", async (c) => {
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchTopUpcoming(page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Schedule route
zoroRouter.get("/schedule/:date", async (c) => {
  const date = c.req.param("date")

  const res = await zoro.fetchSchedule(date)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Studio route
zoroRouter.get("/studio/:studioId", async (c) => {
  const studioId = c.req.param("studioId")
  const page = Number(c.req.query("page") || "1")

  const res = await zoro.fetchStudio(studioId, page)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Spotlight route
zoroRouter.get("/spotlight", async (c) => {
  const res = await zoro.fetchSpotlight()

  return c.json({ success: true, data: res }, { status: 200 })
})

// Search suggestions route
zoroRouter.get("/search-suggestions/:query", async (c) => {
  const query = c.req.param("query")

  const res = await zoro.fetchSearchSuggestions(query)

  return c.json({ success: true, data: res }, { status: 200 })
})

// Info route
zoroRouter.get("/info", async (c) => {
  const id = c.req.query("id")

  if (!id) {
    return c.json({ message: "id is required" }, { status: 400 })
  }

  try {
    const res = await zoro.fetchAnimeInfo(id)
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

// Watch route - supports both query param and URL param
const handleWatch = async (c: any) => {
  let episodeId = c.req.param("episodeId")
  if (!episodeId) {
    episodeId = c.req.query("episodeId")
  }

  const server = c.req.query("server") as StreamingServers

  const dubParam = c.req.query("dub") || ""
  let dub: boolean = dubParam === "true" || dubParam === "1"

  if (server && !Object.values(StreamingServers).includes(server)) {
    return c.json({ message: "server is invalid" }, { status: 400 })
  }

  if (!episodeId) {
    return c.json({ message: "id is required" }, { status: 400 })
  }

  try {
    const res = await zoro.fetchEpisodeSources(
      episodeId,
      server,
      dub ? SubOrSub.DUB : SubOrSub.SUB
    )
    return c.json({ success: true, data: res }, { status: 200 })
  } catch (err) {
    return c.json(
      {
        message: "Something went wrong. Contact developer for help.",
      },
      { status: 500 }
    )
  }
}

zoroRouter.get("/watch", handleWatch)
zoroRouter.get("/watch/:episodeId", handleWatch)

// Genre list route
zoroRouter.get("/genre/list", async (c) => {
  try {
    const res = await zoro.fetchGenres()
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

// Genre search route
zoroRouter.get("/genre/:genre", async (c) => {
  const genre = c.req.param("genre")
  const page = Number(c.req.query("page") || "1")

  if (!genre) {
    return c.json({ message: "genre is required" }, { status: 400 })
  }

  try {
    const res = await zoro.genreSearch(genre, page)
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

// Movies route
zoroRouter.get("/movies", async (c) => {
  const page = Number(c.req.query("page") || "1")
  try {
    const res = await zoro.fetchMovie(page)
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

// ONA route
zoroRouter.get("/ona", async (c) => {
  const page = Number(c.req.query("page") || "1")
  try {
    const res = await zoro.fetchONA(page)
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

// OVA route
zoroRouter.get("/ova", async (c) => {
  const page = Number(c.req.query("page") || "1")
  try {
    const res = await zoro.fetchOVA(page)
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

// Specials route
zoroRouter.get("/specials", async (c) => {
  const page = Number(c.req.query("page") || "1")
  try {
    const res = await zoro.fetchSpecial(page)
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

// TV route
zoroRouter.get("/tv", async (c) => {
  const page = Number(c.req.query("page") || "1")
  try {
    const res = await zoro.fetchTV(page)
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

export default zoroRouter
