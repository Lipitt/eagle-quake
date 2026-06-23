# Eagle Quake

Interactive earthquake map built with MapLibre GL JS and the USGS Earthquake API. Filter earthquakes by date range and minimum magnitude, and explore them on an interactive map.

**Live demo:** https://eagle-quake.vercel.app

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Features

- Sidebar filter form with date presets and magnitude input
- Earthquake markers scaled and colored by magnitude
- Popup with place, magnitude, and time on marker click
- Responsive layout with collapsible sidebar on mobile

## Bonus: Web Worker + IndexedDB

### Web Worker

I used a web worker (`worker.js`) to move all data concerns off the main thread. i wanted the worker to own all data responsibilities: the worker handles fetching from the USGS API, parsing the response, sorting by magnitude and cache read/write. the main thread has no network logic, it only receives a finished GeoJson object and focuses on rendering.

### IndexedDB

I used IndexedDB so that repeated searches with the same filters are taken from cache rather than creating a network request.
The cache key is a string of all three filter params: `starttime|endtime|minmagnitude`. If the params submitted match an already-existing entry in the cache, the response is served from there instead of hitting the USGS API, except when cache is intentionally invalidated.

**Cache invalidation strategy:** Historical earthquake data wont change, so it makes sense to cache results for past dates, as they are always valid. But if `starttime` is within the last 7 days, the data may still be incomplete (new earthquakes are still being recorded), so those queries always hit the network and are never cached.

### How Web Workers and IndexedDB work together

The Worker is the single owner of both network and cache. The flow on every search:

1. Main thread sends filter params to the Worker via `postMessage`
2. Worker checks IndexedDB for a cached result matching those params
3. Cache hit → Worker posts result back immediately, no network request
4. Cache miss → Worker fetches USGS, sorts features by magnitude ascending, stores result in IndexedDB, posts result back
5. Main thread receives finished GeoJSON and updates the map

Sorting happens once before caching, so cached results come back pre-sorted with no extra work.

## Tradeoffs

### Why no Service Workers

For this app in particular, i think it made more sense to use IndexedDB rather than Service Workers. The main caching concern is the USGS query results, and not the app shell, so IndexedDB is the right tool for the job. And while Service Workers and IndexedDB can work together, i didnt want to create a second cache layer with no clear benefit, feels like over-engineering. So i have decided not to implement it.

### Why no overlapping cached results in IndexedDB

I have attempted to use overlapping query results, that is, if a query params are not present in the cache, but are _contained_ in a previous entry, said entry can be filtered to match the non-cached filters. But ultimately decided against this as it increased the complexity of managing the cache while only providing marginal benefits. it can even backfire, as for some large cached datasets, filtering locally can be slower than simply hitting the USGS API directly. My attempt at this can be seen in the commit history ("add IndexedDB overlap detection for queries within cached date ranges", and "remove IndexedDB overlap detection")
