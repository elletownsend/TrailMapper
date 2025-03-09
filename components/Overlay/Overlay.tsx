import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { highlightColor } from '../constants'
const Overlay = ({
  message = 'Loading trails...',
  hasActivityIndicator,
}: {
  message?: string
  hasActivityIndicator?: boolean
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContainer}>
        {hasActivityIndicator && hasActivityIndicator === true && (
          <ActivityIndicator size='large' color={highlightColor} />
        )}
        {message && <Text style={styles.overlayText}>{message}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
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
  overlayContainer: {
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
  overlayText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    color: '#333',
  },
})

export default Overlay
