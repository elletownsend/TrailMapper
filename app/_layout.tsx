import React from 'react'
import { Slot, Tabs } from 'expo-router'
import { Platform, StyleSheet } from 'react-native'
import { Feather, Octicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import FanMenu from '@/components/FanMenu/FanMenu'
import { StatusBar } from 'expo-status-bar'

export default function AppLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <>
      <Slot />
      <FanMenu />
      <StatusBar style='auto' />
    </>
  )
}
