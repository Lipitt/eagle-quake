const BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query'

export function fetchEarthquakes({ starttime, endtime, minmagnitude }) {
  const params = new URLSearchParams({
    format: 'geojson',
    starttime,
    endtime,
    minmagnitude,
  })

  return fetch(`${BASE_URL}?${params}`).then((r) => {
    if (!r.ok) throw new Error(`USGS API error: ${r.status}`)
    return r.json()
  })
}
