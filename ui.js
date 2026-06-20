export function setLoading(loading) {
  document.getElementById('status').hidden = !loading
  document.getElementById('status').textContent = loading ? 'Loading...' : ''
}

export function setError(message) {
  const el = document.getElementById('status')
  el.hidden = false
  el.textContent = message
  el.classList.toggle('panel__status--error', !!message)
}

export function setEmpty() {
  const el = document.getElementById('status')
  el.hidden = false
  el.textContent = 'No earthquakes found for the selected filters.'
  el.classList.remove('panel__status--error')
}

export function clearStatus() {
  const el = document.getElementById('status')
  el.hidden = true
  el.textContent = ''
  el.classList.remove('panel__status--error')
}
