import { Feather } from '@expo/vector-icons'
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { iconColor } from '../constants'

const Search = ({ style }: { style?: {} }) => {
  return (
    <View style={style}>
      <TouchableOpacity
        accessibilityRole='button'
        accessibilityLabel='Search Trails'
        accessibilityHint='Opens search'
        style={styles.searchButton}
      >
        <Feather name='search' size={25} color={iconColor} />
        <Text style={styles.searchText}>Search...</Text>
      </TouchableOpacity>
    </View>
  )
}

// TO DO: green circle around search button

const styles = StyleSheet.create({
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#fff',
    width: Dimensions.get('window').width - 24,
  },
  searchText: {
    marginLeft: 10,
    fontSize: 16,
  },
})

export default Search
