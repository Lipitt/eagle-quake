import { fetchEarthquakes } from './api.js'
import { getCache, setCache, getAllCacheEntries } from './db.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function isRecent(dateStr) {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  const sevenDaysAgo = d.toISOString().split('T')[0]
  return dateStr >= sevenDaysAgo
}

function findOverlapEntry(entries, starttime, endtime, minmagnitude) {
  const newStart = new Date(starttime)
  const newEnd = new Date(endtime)
  const newMag = parseFloat(minmagnitude)
  const rangeDays = (newEnd - newStart) / MS_PER_DAY

  if (rangeDays > 30) return null

  for (const entry of entries) {
    const [cStart, cEnd, cMag] = entry.key.split('|')
    if (
      new Date(cStart) <= newStart &&
      new Date(cEnd) >= newEnd &&
      parseFloat(cMag) <= newMag
    ) {
      return entry
    }
  }
  return null
}

function filterFeatures(geojson, starttime, endtime, minmagnitude) {
  const start = new Date(starttime).getTime()
  const end = new Date(endtime)
  end.setHours(23, 59, 59, 999)
  const endMs = end.getTime()
  const mag = parseFloat(minmagnitude)

  return {
    ...geojson,
    features: geojson.features.filter((f) => {
      const t = f.properties.time
      return t >= start && t <= endMs && f.properties.mag >= mag
    }),
  }
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

      // overlap check: only for cacheable queries <= 30 days
      const rangeDays = (new Date(endtime) - new Date(starttime)) / MS_PER_DAY
      const overlapCheck = useCache && rangeDays <= 30 ? getAllCacheEntries() : Promise.resolve([])

      overlapCheck
        .then((entries) => {
          const overlapEntry = findOverlapEntry(entries, starttime, endtime, minmagnitude)

          if (overlapEntry) {
            const filtered = filterFeatures(overlapEntry.data, starttime, endtime, minmagnitude)
            self.postMessage({ ok: true, geojson: filtered, fromCache: 'overlap' })
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
    })
    .catch((err) => self.postMessage({ ok: false, error: err.message }))
}
