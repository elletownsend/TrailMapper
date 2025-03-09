import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native'
import MapView, { Marker, Polyline, Callout, Region } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

import { fetchNearbyTrails } from '../services/api'

// Define trail types
type TrailType = 'Bridleway' | 'Footpath' | 'Cycleway' | 'Path'

// Define trail colors
const trailColors: Record<TrailType, string> = {
  Bridleway: '#3a5a40',
  Footpath: '#a3b18a',
  Cycleway: '#588157',
  Path: '#dad7cd',
}

// Define trail visibility state type
type TrailVisibility = Record<TrailType, boolean>

// Define trail interface
interface Trail {
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

// Loading indicator component
const LoadingOverlay = ({
  message = 'Loading trails...',
}: {
  message?: string
}) => (
  <View style={styles.loadingOverlay}>
    <View style={styles.loadingContainer}>
      <ActivityIndicator size='large' color='#3a5a40' />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  </View>
)

export default function MapScreen() {
  const mapRef = useRef<MapView>(null)
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [trails, setTrails] = useState<Trail[]>([])
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null)
  const [isUserMovedMap, setIsUserMovedMap] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [initialRegion, setInitialRegion] = useState<Region | null>(null)
  const [showTrailTypes, setShowTrailTypes] = useState<TrailVisibility>({
    Bridleway: true,
    Footpath: true,
    Cycleway: true,
    Path: true,
  })

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | undefined
    ;(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied')
        return
      }

      // Get initial location
      let currentLocation = await Location.getCurrentPositionAsync({})
      setLocation(currentLocation)

      // Set initial region based on user's location
      const userRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
      setInitialRegion(userRegion)
      setCurrentRegion(userRegion)

      // Subscribe to location updates
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // update if user moves by 10 meters
        },
        (newLocation) => {
          setLocation(newLocation)
        }
      )
    })()

    // Clean up subscription when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [])

  // Fetch trails based on coordinates
  const fetchTrails = async (latitude: number, longitude: number) => {
    setIsLoading(true)
    try {
      // Use either combined sources or just OSM based on user preference
      const trails = await fetchNearbyTrails(
        latitude,
        longitude,
        5000,
        showTrailTypes
      )
      setTrails(trails)
    } catch (error) {
      console.error('Error fetching trails:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch based on user location
  useEffect(() => {
    if (location && !isUserMovedMap) {
      fetchTrails(location.coords.latitude, location.coords.longitude)
    }
  }, [location, isUserMovedMap])

  // Handle map region change
  const onRegionChangeComplete = (region: Region) => {
    setCurrentRegion(region)
    setIsUserMovedMap(true)
  }

  // Search in current view
  const searchInCurrentView = () => {
    if (currentRegion) {
      fetchTrails(currentRegion.latitude, currentRegion.longitude)
    }
  }

  // Return to user location
  const goToUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000
      )
      setIsUserMovedMap(false)
    }
  }

  // Get trail color based on type
  const getTrailColor = (type: string): string => {
    return type in trailColors
      ? trailColors[type as TrailType]
      : trailColors.Path
  }

  // Toggle specific trail type visibility
  const toggleTrailType = (type: TrailType): void => {
    setShowTrailTypes((prev) => {
      const newFilters = {
        ...prev,
        [type]: !prev[type],
      }

      // Refetch trails with new filter settings if we have a location
      if (currentRegion) {
        fetchTrails(currentRegion.latitude, currentRegion.longitude)
      }

      return newFilters
    })
  }

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <>
          {initialRegion ? (
            <>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={true}
                onRegionChangeComplete={onRegionChangeComplete}
              >
                {location && (
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title='You are here'
                  />
                )}

                {/* Display trails as polylines */}
                {trails.length > 0 &&
                  trails
                    .filter(
                      (trail) =>
                        trail.type in showTrailTypes &&
                        showTrailTypes[trail.type as TrailType] &&
                        trail.coordinates &&
                        trail.coordinates.length > 1
                    )
                    .map((trail) => (
                      <Polyline
                        key={trail.id}
                        coordinates={trail.coordinates!.map((coord) => ({
                          latitude: coord.lat,
                          longitude: coord.lon,
                        }))}
                        strokeColor={getTrailColor(trail.type)}
                        strokeWidth={4}
                        lineDashPattern={
                          trail.type === 'Bridleway' ? [5, 2] : undefined
                        }
                        tappable={true}
                        onPress={() =>
                          alert(
                            `${trail.name} (${trail.type})\nDistance: ${trail.distance} km`
                          )
                        }
                      />
                    ))}

                {/* Display markers for trails without coordinates (like relation routes) */}
                {trails.length > 0 &&
                  trails
                    .filter(
                      (trail) =>
                        !trail.coordinates &&
                        trail.lat !== undefined &&
                        trail.lon !== undefined
                    )
                    .map((trail) => (
                      <Marker
                        key={trail.id}
                        coordinate={{
                          latitude: trail.lat!,
                          longitude: trail.lon!,
                        }}
                        title={trail.name}
                        description={`${trail.type} - ${trail.distance} km`}
                        pinColor={getTrailColor(trail.type)}
                      />
                    ))}
              </MapView>

              {/* Loading overlay */}
              {isLoading && <LoadingOverlay />}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color='#3a5a40' />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          )}

          {/* Map control buttons */}
          {initialRegion && (
            <View style={styles.mapControls}>
              {isUserMovedMap && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={searchInCurrentView}
                  disabled={isLoading}
                  accessibilityLabel='Search in this area'
                  accessibilityHint='Searches for trails in the current map view'
                >
                  <Ionicons name='search' size={24} color='#fff' />
                  <Text style={styles.controlText}>
                    {isLoading ? 'Searching...' : 'Search Here'}
                  </Text>
                </TouchableOpacity>
              )}

              {isUserMovedMap && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={goToUserLocation}
                  accessibilityLabel='Return to my location'
                  accessibilityHint='Centers the map on your current location'
                >
                  <Ionicons name='locate' size={24} color='#fff' />
                  <Text style={styles.controlText}>My Location</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Trail type filter buttons */}
          {initialRegion && !isLoading && (
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: showTrailTypes.Bridleway
                      ? trailColors.Bridleway
                      : '#e0e0e0',
                  },
                ]}
                onPress={() => toggleTrailType('Bridleway')}
              >
                <MaterialCommunityIcons name='horse' size={18} color='#fff' />
                <Text style={styles.filterText}>Bridleways</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: showTrailTypes.Footpath
                      ? trailColors.Footpath
                      : '#e0e0e0',
                  },
                ]}
                onPress={() => toggleTrailType('Footpath')}
              >
                <MaterialCommunityIcons name='walk' size={18} color='#fff' />
                <Text style={styles.filterText}>Footpaths</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: showTrailTypes.Cycleway
                      ? trailColors.Cycleway
                      : '#e0e0e0',
                  },
                ]}
                onPress={() => toggleTrailType('Cycleway')}
              >
                <MaterialCommunityIcons name='bike' size={18} color='#fff' />
                <Text style={styles.filterText}>Cycleways</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    margin: 20,
  },
  filterContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
    fontSize: 12,
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: '#3a5a40',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    color: '#333',
  },
  dataSourceToggle: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dataSourceText: {
    fontSize: 12,
    marginRight: 8,
    color: '#333',
  },
})
