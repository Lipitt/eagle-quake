import './styles/main.scss'
import { fetchEarthquakes } from './api.js'
import { initMap, updateMapData } from './map.js'
import { setLoading, setError, setEmpty, clearStatus } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
  initMap()

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault()
    loadEarthquakes()
  })

  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('sidebar--open')
  })
})

function loadEarthquakes() {
  const starttime = document.getElementById('starttime').value
  const endtime = document.getElementById('endtime').value
  const minmagnitude = document.getElementById('minmagnitude').value

  if (!starttime || !endtime) {
    setError('Please select a start and end date.')
    return
  }
  if (new Date(starttime) >= new Date(endtime)) {
    setError('Start date must be before end date.')
    return
  }
  if (minmagnitude < 0 || minmagnitude > 10) {
    setError('Magnitude must be between 0 and 10.')
    return
  }

  setLoading(true)

  fetchEarthquakes({ starttime, endtime, minmagnitude })
    .then((geojson) => {
      clearStatus()
      if (geojson.features.length === 0) {
        setEmpty()
        return
      }
      updateMapData(geojson)
    })
    .catch((err) => {
      setError('Failed to load earthquake data. Please try again.')
      console.error(err)
    })
    .finally(() => {
      setLoading(false)
    })
}
