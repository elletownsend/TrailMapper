import React from 'react'
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
            <Ionicons name='location-outline' size={25} color={darkestGreen} />
          </View>
          <Text
            style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}
          >
            Nearby
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
            <Ionicons name='bookmark-outline' size={25} color={darkestGreen} />
          </View>
          <Text
            style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}
          >
            Saved
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? '#1e1e1e' : '#fff' },
          ]}
          accessibilityRole='button'
          accessibilityLabel='View map'
          onPress={() => router.push('/map')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name='map-outline' size={25} color={darkestGreen} />
          </View>
          <Text
            style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}
          >
            Map
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
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
})
