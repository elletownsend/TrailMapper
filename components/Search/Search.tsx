import { Feather } from '@expo/vector-icons'
import React, { useState, useRef } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native'
import { darkestGreen, iconColor } from '../constants'

// GEOCODING API URL
const apiKey = process.env.EXPO_PUBLIC_GEOCODING_API_KEY
const apiURL = `https://geocode.maps.co/search?api_key=${apiKey}&q=`

interface SearchResult {
  place_id: string
  lat: string
  lon: string
  display_name: string
}

interface SearchProps {
  style?: {}
  onLocationSelect?: (lat: number, lon: number, displayName?: string) => void
  navigateToMap?: (lat: number, lon: number, displayName?: string) => void
}

const Search = ({ style, onLocationSelect, navigateToMap }: SearchProps) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<TextInput>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `${apiURL}${encodeURIComponent(searchQuery)}`
      )
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Error fetching geocoding data:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationSelect = (item: SearchResult) => {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)

    if (navigateToMap && !isNaN(lat) && !isNaN(lon)) {
      navigateToMap(lat, lon, item.display_name)
    } else if (onLocationSelect && !isNaN(lat) && !isNaN(lon)) {
      onLocationSelect(lat, lon, item.display_name)
    }

    setModalVisible(false)
    setSearchQuery('')
    setSearchResults([])
    Keyboard.dismiss()
  }

  return (
    <View style={style}>
      <TouchableOpacity
        accessibilityRole='button'
        accessibilityLabel='Search Trails'
        accessibilityHint='Opens search'
        style={styles.searchButton}
        onPress={() => {
          setModalVisible(true)
          setTimeout(() => {
            inputRef.current?.focus()
          }, 100)
        }}
      >
        <View style={styles.iconContainer}>
          <Feather name='search' size={25} color={iconColor} />
        </View>
        <Text style={styles.searchText}>Search...</Text>
      </TouchableOpacity>

      <Modal
        animationType='slide'
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Feather name='search' size={20} color={iconColor} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder='Enter location or address'
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType='search'
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name='x' size={20} color={iconColor} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color='#0ea5e9' />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleLocationSelect(item)}
                >
                  <Feather
                    name='map-pin'
                    size={20}
                    color={iconColor}
                    style={styles.resultIcon}
                  />
                  <Text style={styles.resultText}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length > 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No results found</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </Modal>
    </View>
  )
}

// TO DO: green circle around search button

const styles = StyleSheet.create({
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#fff',
    width: Dimensions.get('window').width - 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkestGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchText: {
    marginLeft: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#0ea5e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultIcon: {
    marginRight: 12,
  },
  resultText: {
    fontSize: 16,
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
})

export default Search
