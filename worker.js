import { fetchEarthquakes } from './api.js'

self.onmessage = ({ data }) => {
  const { starttime, endtime, minmagnitude } = data

  fetchEarthquakes({ starttime, endtime, minmagnitude })
    .then((geojson) => self.postMessage({ ok: true, geojson }))
    .catch((err) => self.postMessage({ ok: false, error: err.message }))
}
