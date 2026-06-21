import './styles/main.scss'
import { initMap, updateMapData } from './map.js'

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })

document.addEventListener('DOMContentLoaded', () => {
  initMap()

  const sidebar = document.querySelector('.sidebar')
  const toggleBtn = document.getElementById('sidebar-toggle')
  const status = document.getElementById('status')

  worker.onmessage = ({ data }) => {
    if (!data.ok) {
      status.hidden = false
      status.textContent = `Failed to load: ${data.error}`
      status.className = 'panel__status panel__status--error'
      return
    }

    if (data.geojson.features.length === 0) {
      status.hidden = false
      status.textContent = 'No earthquakes found for the selected filters.'
      status.className = 'panel__status'
      return
    }

    status.hidden = false
    status.textContent = `${data.geojson.features.length} earthquakes found.${data.fromCache ? ' (from cache)' : ''}`
    status.className = 'panel__status'
    sidebar.classList.remove('sidebar--open')
    toggleBtn.hidden = false
    updateMapData(data.geojson)
  }

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault()
    loadEarthquakes(status)
  })

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.add('sidebar--open')
    toggleBtn.hidden = true
  })

  document.getElementById('sidebar-close').addEventListener('click', () => {
    sidebar.classList.remove('sidebar--open')
    toggleBtn.hidden = false
  })
})

function loadEarthquakes(status) {
  const starttime = document.getElementById('starttime').value
  const endtime = document.getElementById('endtime').value
  const minmagnitude = document.getElementById('minmagnitude').value

  if (!starttime || !endtime) {
    status.hidden = false
    status.textContent = 'Please select a start and end date.'
    status.className = 'panel__status panel__status--error'
    return
  }
  if (new Date(starttime) >= new Date(endtime)) {
    status.hidden = false
    status.textContent = 'Start date must be before end date.'
    status.className = 'panel__status panel__status--error'
    return
  }
  if (minmagnitude < 0 || minmagnitude > 10) {
    status.hidden = false
    status.textContent = 'Magnitude must be between 0 and 10.'
    status.className = 'panel__status panel__status--error'
    return
  }

  status.hidden = false
  status.textContent = 'Loading...'
  status.className = 'panel__status'

  worker.postMessage({ starttime, endtime, minmagnitude })
}
