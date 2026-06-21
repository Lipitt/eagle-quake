import { fetchEarthquakes } from './api.js'
import { getCache, setCache } from './db.js'

function isRecent(endtime) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return new Date(endtime) >= sevenDaysAgo
}

self.onmessage = ({ data }) => {
  const { starttime, endtime, minmagnitude } = data
  const key = `${starttime}|${endtime}|${minmagnitude}`
  const useCache = !isRecent(endtime)

  const fromCache = useCache ? getCache(key) : Promise.resolve(null)

  fromCache
    .then((cached) => {
      if (cached) {
        self.postMessage({ ok: true, geojson: cached, fromCache: true })
        return
      }

      fetchEarthquakes({ starttime, endtime, minmagnitude })
        .then((geojson) => {
          if (useCache) setCache(key, geojson)
          self.postMessage({ ok: true, geojson, fromCache: false })
        })
        .catch((err) => self.postMessage({ ok: false, error: err.message }))
    })
    .catch((err) => self.postMessage({ ok: false, error: err.message }))
}
