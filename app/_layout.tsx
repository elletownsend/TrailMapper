import React from 'react'
import { Tabs } from 'expo-router'
import { Platform, StyleSheet } from 'react-native'
import { Feather, Octicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'

export default function AppLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          backgroundColor: isDark
            ? 'rgba(18, 18, 18, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        tabBarActiveTintColor: '#84a59d',
        tabBarInactiveTintColor: isDark ? '#888' : '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? '#121212' : '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: isDark ? '#fff' : '#000',
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Octicons name='home' size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Home Screen',
        }}
      />
      <Tabs.Screen
        name='map'
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Feather name='map' size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Map Screen',
        }}
      />
    </Tabs>
  )
}
