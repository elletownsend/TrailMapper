import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

// Define Trail interface
export interface Trail {
  id: string
  name: string
  type: string
  distance: number
  coordinates?: Array<{
    lat: number
    lon: number
  }>
  lat?: number
  lon?: number
}

const OSM_API_BASE = 'https://overpass-api.de/api/interpreter'

export const fetchOfflineTrails = async (
  latitude: number,
  longitude: number
): Promise<Trail[]> => {
  try {
    // Round coordinates to nearest 0.01 degree to match cache keys
    const roundedLat = Math.round(latitude * 100) / 100
    const roundedLon = Math.round(longitude * 100) / 100

    // Try to find cached data for this area or nearby areas
    const keys = await AsyncStorage.getAllKeys()
    const trailKeys = keys.filter((key) => key.startsWith('trails_'))

    if (trailKeys.length === 0) {
      return []
    }

    // Find the closest cached area
    let closestKey = ''
    let minDistance = Infinity

    for (const key of trailKeys) {
      const [, keyLat, keyLon] = key.split('_').map(Number)
      const distance = Math.sqrt(
        Math.pow(keyLat - roundedLat, 2) + Math.pow(keyLon - roundedLon, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        closestKey = key
      }
    }

    const cachedData = await AsyncStorage.getItem(closestKey)
    if (cachedData) {
      const { data } = JSON.parse(cachedData)
      return data
    }

    return []
  } catch (error) {
    console.error('Error fetching offline trails:', error)
    return []
  }
}

// Cache trail data for offline use
const cacheTrailData = async (
  latitude: number,
  longitude: number,
  trails: Trail[]
): Promise<void> => {
  try {
    const key = `trails_${Math.round(latitude * 100) / 100}_${
      Math.round(longitude * 100) / 100
    }`
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data: trails,
      })
    )
  } catch (error) {
    console.error('Error caching trail data:', error)
  }
}

// Calculate path distance in kilometers
const calculatePathDistance = (
  coordinates: Array<{ lat: number; lon: number }>
): number => {
  let distance = 0

  for (let i = 1; i < coordinates.length; i++) {
    const prevPoint = coordinates[i - 1]
    const currPoint = coordinates[i]

    // Haversine formula for distance calculation
    const R = 6371 // Earth's radius in km
    const dLat = ((currPoint.lat - prevPoint.lat) * Math.PI) / 180
    const dLon = ((currPoint.lon - prevPoint.lon) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((prevPoint.lat * Math.PI) / 180) *
        Math.cos((currPoint.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const segmentDistance = R * c

    distance += segmentDistance
  }

  return distance
}

// Calculate distance between two points
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Haversine formula to calculate distance between two points
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180)
}

// Helper to determine route type
const getRouteType = (route: string): string => {
  switch (route) {
    case 'hiking':
      return 'Hiking Trail'
    case 'bicycle':
      return 'Cycle Route'
    case 'horse':
      return 'Bridle Path'
    default:
      return 'Route'
  }
}

// Helper to determine trail type
const getTrailType = (
  tags: Record<string, any>,
  activeFilters?: Record<string, boolean>
): string => {
  // Create an array of possible types for this trail
  const possibleTypes: string[] = []

  if (
    tags.highway === 'bridleway' ||
    tags.horse === 'yes' ||
    tags.horse === 'designated' ||
    tags.designation === 'public_bridleway'
  ) {
    possibleTypes.push('Bridleway')
  }

  if (
    tags.highway === 'cycleway' ||
    tags.bicycle === 'yes' ||
    tags.bicycle === 'designated'
  ) {
    possibleTypes.push('Cycleway')
  }

  if (
    tags.highway === 'footway' ||
    tags.foot === 'yes' ||
    tags.foot === 'designated' ||
    tags.designation === 'public_footpath'
  ) {
    possibleTypes.push('Footpath')
  }

  // If no specific type is found, default to Path
  if (possibleTypes.length === 0) {
    return 'Path'
  }

  // If activeFilters is provided, use it to determine precedence
  if (activeFilters) {
    // Find the first type that is active in filters
    for (const type of possibleTypes) {
      if (activeFilters[type]) {
        return type
      }
    }

    // If none of the possible types are active in filters,
    // return the first possible type (this will be filtered out in the UI)
    if (possibleTypes.length > 0) {
      return possibleTypes[0]
    }
  }

  // Default precedence: Bridleway > Cycleway > Footpath
  if (possibleTypes.includes('Bridleway')) return 'Bridleway'
  if (possibleTypes.includes('Cycleway')) return 'Cycleway'
  if (possibleTypes.includes('Footpath')) return 'Footpath'

  return 'Path'
}

// Process raw OSM data into a more usable format
const processOsmData = (
  osmData: any,
  activeFilters?: Record<string, boolean>
): Trail[] => {
  const trails: Trail[] = []
  const nodes: Record<string, { lat: number; lon: number }> = {}

  // First, collect all nodes
  osmData.elements.forEach((element: any) => {
    if (element.type === 'node') {
      nodes[element.id] = {
        lat: element.lat,
        lon: element.lon,
      }
    }
  })

  // Then process ways and relations
  osmData.elements.forEach((element: any) => {
    if (
      element.type === 'way' &&
      element.tags &&
      (isPathOrTrail(element.tags) || isBridleway(element.tags))
    ) {
      const trailType = getTrailType(element.tags, activeFilters)
      const name = element.tags.name || `${trailType} Path`
      const coords = element.nodes
        .map((nodeId: string | number) => nodes[nodeId])
        .filter((node: any) => node !== undefined)

      if (coords.length > 1) {
        // Calculate distance in kilometers
        const distance = calculatePathDistance(coords)

        trails.push({
          id: `osm-${element.id}`,
          name,
          type: trailType,
          distance: parseFloat(distance.toFixed(2)),
          coordinates: coords,
        })
      }
    }
  })

  return trails
}

// Fetch trails from OpenStreetMap
export const fetchNearbyTrails = async (
  latitude: number,
  longitude: number,
  radius = 5000,
  activeFilters?: Record<string, boolean>
): Promise<Trail[]> => {
  try {
    // Check if we're online
    const networkState = await NetInfo.fetch()

    if (!networkState.isConnected) {
      return fetchOfflineTrails(latitude, longitude)
    }

    // Construct Overpass query to get footpaths, cycleways, and bridleways
    const query = `
      [out:json];
      (
        way(around:${radius},${latitude},${longitude})["highway"="footway"];
        way(around:${radius},${latitude},${longitude})["highway"="cycleway"];
        way(around:${radius},${latitude},${longitude})["highway"="bridleway"];
        way(around:${radius},${latitude},${longitude})["highway"="path"];
        way(around:${radius},${latitude},${longitude})["designation"="public_bridleway"];
        way(around:${radius},${latitude},${longitude})["designation"="public_footpath"];
        relation(around:${radius},${latitude},${longitude})["route"="hiking"];
        relation(around:${radius},${latitude},${longitude})["route"="bicycle"];
        relation(around:${radius},${latitude},${longitude})["route"="horse"];
      );
      out body;
      >;
      out skel qt;
    `

    try {
      // Create an AbortController to handle timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(
        `${OSM_API_BASE}?data=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      // Clear the timeout
      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(
          'OSM API response not OK:',
          response.status,
          response.statusText
        )
        throw new Error(`OSM API response not OK: ${response.status}`)
      }

      const data = await response.json()

      // Check if the data has the expected structure
      if (!data || !data.elements || !Array.isArray(data.elements)) {
        console.error('Invalid OSM data format:', data)
        throw new Error('Invalid OSM data format')
      }

      // Process OSM data into a more usable format
      const trails = processOsmData(data, activeFilters)

      // Cache the results for offline use
      await cacheTrailData(latitude, longitude, trails)

      return trails
    } catch (fetchError: unknown) {
      console.error('Error fetching from OSM API:', fetchError)

      // Check if it's a timeout error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.info('Request timed out, falling back to offline data')
      }

      throw fetchError
    }
  } catch (error) {
    console.error('Error fetching trails from OSM:', error)
    // Fallback to offline data if available
    console.info('Falling back to offline data')
    return fetchOfflineTrails(latitude, longitude)
  }
}

// Combined function to fetch from multiple sources
// export const fetchAllTrails = async (
//   latitude: number,
//   longitude: number,
//   radius = 5000
// ): Promise<Trail[]> => {
//   try {
//     // Fetch from both sources in parallel
//     const [osmTrails] = await Promise.all([
//       fetchNearbyTrails(latitude, longitude, radius),
//     ])

//     // Combine results, avoiding duplicates (simple approach)
//     const combinedTrails: Trail[] = [...osmTrails]

//     return combinedTrails
//   } catch (error) {
//     console.error('Error fetching combined trails:', error)
//     // Fallback to OSM only if combined approach fails
//     return fetchNearbyTrails(latitude, longitude, radius)
//   }
// }

// Helper function to determine similarity between two paths
const getPathSimilarity = (path1: Trail, path2: Trail): number => {
  // If either path doesn't have coordinates, they're not similar
  if (!path1.coordinates || !path2.coordinates) return 0

  // Check if start and end points are close
  const start1 = path1.coordinates[0]
  const end1 = path1.coordinates[path1.coordinates.length - 1]
  const start2 = path2.coordinates[0]
  const end2 = path2.coordinates[path2.coordinates.length - 1]

  // Calculate distance between points
  const startDistance = calculateDistance(
    start1.lat,
    start1.lon,
    start2.lat,
    start2.lon
  )

  const endDistance = calculateDistance(end1.lat, end1.lon, end2.lat, end2.lon)

  // If both start and end are within 100m, consider them similar
  if (startDistance < 0.1 && endDistance < 0.1) return 0.9

  // If either start or end is within 100m, consider them somewhat similar
  if (startDistance < 0.1 || endDistance < 0.1) return 0.7

  // Otherwise, they're different paths
  return 0
}

// Helper functions to identify trail types
const isPathOrTrail = (tags: Record<string, any>): boolean => {
  return (
    tags.highway === 'footway' ||
    tags.highway === 'cycleway' ||
    tags.highway === 'path' ||
    tags.foot === 'yes' ||
    tags.bicycle === 'yes' ||
    tags.designation === 'public_footpath'
  )
}

const isBridleway = (tags: Record<string, any>): boolean => {
  return (
    tags.highway === 'bridleway' ||
    tags.horse === 'yes' ||
    tags.horse === 'designated' ||
    tags.designation === 'public_bridleway'
  )
}
