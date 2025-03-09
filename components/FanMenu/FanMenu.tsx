import React, { useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { RelativePathString, useRouter } from 'expo-router'
import { Feather, AntDesign } from '@expo/vector-icons'

const iconColor = '#DAD7CD'

const menuItems = [
  { label: 'Home', route: '/', icon: 'home' },
  { label: 'Map', route: '/map', icon: 'map' },
]

const FanMenu: React.FC = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Reduce the spread by making the angle range smaller
  const startAngle = Math.PI * 0.95 // Starting position (more to the left)
  const endAngle = Math.PI * 1.4 // Ending position (more upward)
  const angleStep = (endAngle - startAngle) / (menuItems.length - 1 || 1)

  const radius = 100
  const scale = useSharedValue(0)

  const toggleMenu = () => {
    scale.value = withSpring(open ? 0 : 1)
    setOpen(!open)
  }

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => {
        // Calculate angle to position items from bottom-right to top-left
        const theta = startAngle + index * angleStep

        const animatedStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: scale.value * radius * Math.cos(theta) },
            {
              translateY:
                scale.value *
                (radius * Math.sin(theta) +
                  // Apply offset only to the bottom-most button (first item)
                  (index === 0 ? -40 : 0)),
            },
          ],
        }))

        return (
          <Animated.View key={index} style={[styles.menuItem, animatedStyle]}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                router.push(item.route as RelativePathString)
                toggleMenu() // Close the menu after selection
              }}
            >
              <Feather name={item.icon} size={25} color={iconColor} />
            </TouchableOpacity>
          </Animated.View>
        )
      })}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleMenu}>
        {open ? (
          <AntDesign name='close' size={25} color={iconColor} />
        ) : (
          <Feather name='menu' size={25} color={iconColor} />
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    width: 80,
    height: 80,
    borderRadius: 100,
    backgroundColor: '#344E41',
    color: '#DAD7CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: { position: 'absolute' },
  button: {
    width: 80,
    height: 80,
    borderRadius: 100,
    backgroundColor: '#344E41',
    color: '#DAD7CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#fff', fontSize: 16 },
})

export default FanMenu
