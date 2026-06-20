import './styles/main.scss'
import { fetchEarthquakes } from './api.js'
import { initMap, updateMapData } from './map.js'

document.addEventListener('DOMContentLoaded', () => {
  initMap()

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault()
    document.querySelector('.sidebar').classList.remove('sidebar--open')
    loadEarthquakes()
  })


  const sidebar = document.querySelector('.sidebar')
  const toggleBtn = document.getElementById('sidebar-toggle')

  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    sidebar.classList.add('sidebar--open')
    toggleBtn.hidden = true
  })

  document.getElementById('sidebar-close').addEventListener('click', () => {
    sidebar.classList.remove('sidebar--open')
    toggleBtn.hidden = false
  })
})

function loadEarthquakes() {
  const starttime = document.getElementById('starttime').value
  const endtime = document.getElementById('endtime').value
  const minmagnitude = document.getElementById('minmagnitude').value
  const status = document.getElementById('status')

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

  fetchEarthquakes({ starttime, endtime, minmagnitude })
    .then((geojson) => {
      if (geojson.features.length === 0) {
        status.hidden = false
        status.textContent = 'No earthquakes found for the selected filters.'
        status.className = 'panel__status'
        return
      }
      status.hidden = true
      status.textContent = ''
      updateMapData(geojson)
    })
    .catch((err) => {
      status.hidden = false
      status.textContent = `Failed to load: ${err.message}`
      status.className = 'panel__status panel__status--error'
      console.error(err)
    })
}
