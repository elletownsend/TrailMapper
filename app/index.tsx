import React from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native'
import { router } from 'expo-router'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import Search from '@/components/Search/Search'
import Container from '@/components/Container/Container'
import { darkestGreen } from '@/components/constants'

export default function Index() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  // Function to navigate to the map page with coordinates
  const navigateToMapWithLocation = (
    lat: number,
    lon: number,
    displayName?: string
  ) => {
    // Navigate to the map page with location parameters
    router.push({
      pathname: '/map',
      params: {
        lat,
        lon,
        name: displayName ? encodeURIComponent(displayName) : undefined,
      },
    })
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121212' : '#f8f8f8' },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: '#000' }]}>Hey 👋</Text>
        <Search navigateToMap={navigateToMapWithLocation} />
      </View>

      <Container style={styles.quickActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? '#1e1e1e' : '#fff' },
          ]}
          accessibilityRole='button'
          accessibilityLabel='Nearby trails'
        >
          <View style={styles.actionIcon}>
            <Feather name='map-pin' size={25} color={darkestGreen} />
          </View>
          <Text
            style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}
          >
            Nearby Trials
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? '#1e1e1e' : '#fff' },
          ]}
          accessibilityRole='button'
          accessibilityLabel='Saved trails'
        >
          <View style={styles.actionIcon}>
            <Feather name='bookmark' size={25} color={darkestGreen} />
          </View>
          <Text
            style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}
          >
            Saved Trails
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? '#1e1e1e' : '#fff' },
          ]}
          accessibilityRole='button'
          accessibilityLabel='Local Bridleways'
        >
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons
              name='horse'
              size={25}
              color={darkestGreen}
            />
          </View>
          <Text
            style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}
          >
            Local Bridlepaths
          </Text>
        </TouchableOpacity>
      </Container>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 72,
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
})
