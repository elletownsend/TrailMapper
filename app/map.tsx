import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Text, Dimensions, Alert } from 'react-native'
import MapView, { Marker, Polyline, Callout, Region } from 'react-native-maps'
import * as Location from 'expo-location'
import { fetchNearbyTrails } from '../services/api'
import { StatusBar } from 'expo-status-bar'
import { Feather } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import {
  lightestGreen,
  lightGreen,
  mediumGreen,
  cream,
  grey,
} from '@/components/constants'
import Overlay from '@/components/Overlay/Overlay'
import PillButton from '@/components/PillButton/PillButton'
import Search from '@/components/Search/Search'

// Define trail types
type TrailType = 'Bridleway' | 'Footpath' | 'Cycleway' | 'Path'

// Define trail colors
const trailColors: Record<TrailType, string> = {
  Bridleway: mediumGreen,
  Footpath: lightestGreen,
  Cycleway: lightGreen,
  Path: cream,
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
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number
    longitude: number
    name?: string
  } | null>(null)

  // Get URL parameters
  const params = useLocalSearchParams<{
    lat: string
    lon: string
    name: string
  }>()

  // Handle navigation from index page
  useEffect(() => {
    if (params.lat && params.lon) {
      const lat = parseFloat(params.lat)
      const lon = parseFloat(params.lon)
      const name = params.name ? decodeURIComponent(params.name) : undefined

      if (!isNaN(lat) && !isNaN(lon)) {
        // Set the selected location
        setSelectedLocation({
          latitude: lat,
          longitude: lon,
          name,
        })

        // Create the new region
        const newRegion = {
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }

        // Update current region
        setCurrentRegion(newRegion)
        setInitialRegion(newRegion)

        // Set user moved map to true to prevent auto-centering on user location
        setIsUserMovedMap(true)

        // Fetch trails at the selected location with a slight delay
        setTimeout(() => {
          fetchTrails(lat, lon)
        }, 500)
      }
    }
  }, [params.lat, params.lon, params.name])

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

      // Update trails state
      setTrails(trails)

      // If no trails were found, show a message to the user
      if (trails.length === 0) {
        Alert.alert(
          'No Trails Found',
          'No trails were found in this location. Try searching in a different area.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error fetching trails:', error)

      // Show error message to user
      Alert.alert('Error', 'Failed to fetch trails. Please try again later.', [
        { text: 'OK' },
      ])
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

    // wait a few seconds to see if user keeps moving?
    // then searchInCurrentView
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

                {/* Display marker for selected location */}
                {selectedLocation && (
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    title={selectedLocation.name || 'Selected location'}
                    pinColor='#0ea5e9' // Blue pin for selected location
                  >
                    <Callout>
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>
                          {selectedLocation.name || 'Selected Location'}
                        </Text>
                        <Text>
                          Latitude: {selectedLocation.latitude.toFixed(6)}
                        </Text>
                        <Text>
                          Longitude: {selectedLocation.longitude.toFixed(6)}
                        </Text>
                      </View>
                    </Callout>
                  </Marker>
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
              {/* TO DO: needs to be longer */}
              {isLoading && <Overlay hasActivityIndicator />}
            </>
          ) : (
            <Overlay hasActivityIndicator message='Getting your location...' />
          )}

          {/* Search */}
          {initialRegion && (
            <Search
              style={styles.searchBar}
              onLocationSelect={(lat, lon, displayName) => {
                // Set the selected location
                setSelectedLocation({
                  latitude: lat,
                  longitude: lon,
                  name: displayName,
                })

                // Create the new region
                const newRegion = {
                  latitude: lat,
                  longitude: lon,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }

                // Update current region
                setCurrentRegion(newRegion)

                // Navigate to the selected location
                if (mapRef.current) {
                  mapRef.current.animateToRegion(newRegion)

                  // Set user moved map to true to prevent auto-centering on user location
                  setIsUserMovedMap(true)

                  // Fetch trails at the selected location with a slight delay
                  // to ensure the map animation completes first
                  setTimeout(() => {
                    fetchTrails(lat, lon)
                  }, 500)
                }
              }}
            />
          )}

          {/* Map control buttons */}
          {initialRegion && (
            <View style={styles.mapControls}>
              {isUserMovedMap && (
                <PillButton
                  onPress={searchInCurrentView}
                  label='Search in this area'
                  hint='Searches for trails in the current map view'
                  iconStyle='Feather'
                  iconName='search'
                  text='Search Here'
                  isLoading={isLoading}
                  color='#3a5a40'
                />
              )}

              {isUserMovedMap && (
                <PillButton
                  onPress={goToUserLocation}
                  label='Return to my location'
                  hint='Centers the map on your current location'
                  iconStyle='Feather'
                  iconName='crosshair'
                  text='My Location'
                  isLoading={isLoading}
                  color='#3a5a40'
                />
              )}
            </View>
          )}

          {/* Trail type filter buttons */}
          {initialRegion && !isLoading && (
            <View style={styles.filterContainer}>
              <PillButton
                onPress={() => toggleTrailType('Bridleway')}
                label='Toggle Bridleways'
                hint={`Toggles showing bridleways on the map - bridleways are currently ${
                  showTrailTypes.Bridleway ? 'showing' : 'not showing'
                }.`}
                iconStyle='MaterialCommunityIcons'
                iconName='horse'
                text='Bridleways'
                isLoading={false}
                color={showTrailTypes.Bridleway ? trailColors.Bridleway : grey}
              />

              <PillButton
                onPress={() => toggleTrailType('Cycleway')}
                label='Toggle Cycleways'
                hint={`Toggles showing cycleways on the map - cycleways are currently ${
                  showTrailTypes.Cycleway ? 'showing' : 'not showing'
                }.`}
                iconStyle='MaterialCommunityIcons'
                iconName='bike'
                text='Cycleways'
                isLoading={false}
                color={showTrailTypes.Cycleway ? trailColors.Cycleway : grey}
              />

              <PillButton
                onPress={() => toggleTrailType('Footpath')}
                label='Toggle Footpaths'
                hint={`Toggles showing footpaths on the map - footpaths are currently ${
                  showTrailTypes.Bridleway ? 'showing' : 'not showing'
                }.`}
                iconStyle='MaterialCommunityIcons'
                iconName='walk'
                text='Footpaths'
                isLoading={false}
                color={showTrailTypes.Footpath ? trailColors.Footpath : grey}
              />
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
  searchBar: {
    position: 'absolute',
    top: 56,
  },
  filterContainer: {
    position: 'absolute',
    maxWidth: Dimensions.get('window').width - 8,
    top: 116,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  mapControls: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    flexDirection: 'column',
  },
  calloutContainer: {
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
})
