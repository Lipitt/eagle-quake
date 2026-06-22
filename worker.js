import { fetchEarthquakes } from './api.js'
import { getCache, setCache } from './db.js'

function isRecent(dateStr) {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  const sevenDaysAgo = d.toISOString().split('T')[0]
  return dateStr >= sevenDaysAgo
}

self.onmessage = ({ data }) => {
  const { starttime, endtime, minmagnitude } = data
  const key = `${starttime}|${endtime}|${minmagnitude}`
  const useCache = !isRecent(starttime)

  const fromCache = useCache ? getCache(key) : Promise.resolve(null)

  fromCache
    .then((cached) => {
      if (cached) {
        self.postMessage({ ok: true, geojson: cached, fromCache: true })
        return
      }

      fetchEarthquakes({ starttime, endtime, minmagnitude })
        .then((geojson) => {
          geojson.features.sort((a, b) => a.properties.mag - b.properties.mag)
          if (useCache) setCache(key, geojson)
          self.postMessage({ ok: true, geojson, fromCache: false })
        })
        .catch((err) => self.postMessage({ ok: false, error: err.message }))
    })
    .catch((err) => self.postMessage({ ok: false, error: err.message }))
}
