import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

let map
let activePopup = null
let activeCoords = null

export function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [0, 20],
    zoom: 2,
  })

  map.addControl(new maplibregl.NavigationControl())

  map.on('load', () => {
    map.on('click', 'quakes-layer', (e) => {
      const { place, mag, time } = e.features[0].properties
      const coords = e.features[0].geometry.coordinates

      if (activePopup && activeCoords &&
          coords[0] === activeCoords[0] && coords[1] === activeCoords[1]) {
        activePopup.remove()
        activePopup = null
        activeCoords = null
        return
      }

      activePopup = new maplibregl.Popup()
        .setLngLat(coords)
        .setHTML(
          `<div class="popup">
            <p class="popup__place">${place}</p>
            <p class="popup__mag">Magnitude: <strong>${mag}</strong></p>
            <p class="popup__time">${new Date(time).toLocaleString()}</p>
          </div>`
        )
        .addTo(map)

      activeCoords = coords

      activePopup.on('close', () => {
        activePopup = null
        activeCoords = null
      })
    })

    map.on('mouseenter', 'quakes-layer', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'quakes-layer', () => {
      map.getCanvas().style.cursor = ''
    })
  })
}

export function updateMapData(geojson) {
  if (!map || !map.isStyleLoaded()) return

  if (map.getLayer('quakes-layer')) map.removeLayer('quakes-layer')
  if (map.getSource('quakes')) map.removeSource('quakes')

  map.addSource('quakes', { type: 'geojson', data: geojson })

  map.addLayer({
    id: 'quakes-layer',
    type: 'circle',
    source: 'quakes',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'mag'],
        1, 4,
        4, 8,
        7, 20,
        9, 35,
      ],
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'mag'],
        1, '#ffffb2',
        4, '#fd8d3c',
        7, '#bd0026',
      ],
      'circle-opacity': 0.8,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  })

}
