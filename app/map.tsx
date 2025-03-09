import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Text, Dimensions } from 'react-native'
import MapView, { Marker, Polyline, Callout, Region } from 'react-native-maps'
import * as Location from 'expo-location'

import { fetchNearbyTrails } from '../services/api'
import {
  lightestGreen,
  lightGreen,
  mediumGreen,
  cream,
  grey,
} from '@/components/constants'
import Overlay from '@/components/Overlay/Overlay'
import PillButton from '@/components/PillButton/PillButton'

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
    maxWidth: Dimensions.get('window').width - 8,
    top: 160, // TO DO: needs fixing
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  mapControls: {
    position: 'absolute',
    top: 56,
    right: 16,
    flexDirection: 'column',
  },
})
