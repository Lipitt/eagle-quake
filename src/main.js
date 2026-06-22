import './styles/main.scss'
import { initMap, updateMapData } from './map.js'

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })

document.addEventListener('DOMContentLoaded', () => {
  initMap()

  const sidebar = document.querySelector('.sidebar')
  const toggleBtn = document.getElementById('sidebar-toggle')
  const status = document.getElementById('status')
  const submitBtn = document.querySelector('.sidebar__submit')
  const datePreset = document.getElementById('date-preset')
  const customDates = document.getElementById('custom-dates')

  if (window.matchMedia('(max-width: 640px)').matches) {
    sidebar.classList.add('sidebar--open')
    toggleBtn.hidden = true
  }

  worker.onmessage = ({ data }) => {
    submitBtn.disabled = false

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

  datePreset.addEventListener('change', () => {
    if (datePreset.value === 'custom') {
      customDates.classList.remove('sidebar__field--hidden')
    } else {
      customDates.classList.add('sidebar__field--hidden')
      document.getElementById('starttime').value = ''
      document.getElementById('endtime').value = ''
    }
  })

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault()
    loadEarthquakes(status)
  })

  const today = new Date().toISOString().split('T')[0]
  document.getElementById('starttime').max = today
  document.getElementById('endtime').max = today

  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.value) return
      const [year, month, day] = input.value.split('-')
      if (year.length > 4) input.value = `${year.slice(0, 4)}-${month}-${day}`
    })
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

function resolveDates(preset) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const today = fmt(now)

  if (preset === 'last2') {
    const d = new Date(now)
    d.setDate(d.getDate() - 2)
    return { starttime: fmt(d), endtime: today }
  }
  if (preset === 'last7') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return { starttime: fmt(d), endtime: today }
  }
  if (preset === 'last30') {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    return { starttime: fmt(d), endtime: today }
  }
  if (preset === 'last365') {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() - 1)
    return { starttime: fmt(d), endtime: today }
  }
  return null
}

function loadEarthquakes(status) {
  const preset = document.getElementById('date-preset').value
  const minmagnitude = document.getElementById('minmagnitude').value

  let starttime, endtime

  if (preset === 'custom') {
    starttime = document.getElementById('starttime').value
    endtime = document.getElementById('endtime').value

    if (!starttime || !endtime) {
      status.hidden = false
      status.textContent = 'Please select a start and end date.'
      status.className = 'panel__status panel__status--error'
      return
    }
    if (new Date(endtime) > new Date()) {
      status.hidden = false
      status.textContent = 'End date cannot be in the future.'
      status.className = 'panel__status panel__status--error'
      return
    }
    if (new Date(starttime) >= new Date(endtime)) {
      status.hidden = false
      status.textContent = 'Start date must be before end date.'
      status.className = 'panel__status panel__status--error'
      return
    }
  } else {
    const resolved = resolveDates(preset)
    starttime = resolved.starttime
    endtime = resolved.endtime
  }

  if (minmagnitude === '' || minmagnitude < 0 || minmagnitude > 10) {
    status.hidden = false
    status.textContent = 'Magnitude must be between 0 and 10.'
    status.className = 'panel__status panel__status--error'
    return
  }

  status.hidden = false
  status.textContent = 'Loading...'
  status.className = 'panel__status'
  document.querySelector('.sidebar__submit').disabled = true

  worker.postMessage({ starttime, endtime, minmagnitude })
}
