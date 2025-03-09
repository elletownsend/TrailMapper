import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, TouchableOpacity, Text } from 'react-native'

// Define icon name types directly in this file
type FeatherIconName = React.ComponentProps<typeof Feather>['name']
type MaterialCommunityIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>['name']

type PillButtonProps = {
  onPress: () => void
  label: string
  hint: string
  iconStyle: 'Feather' | 'MaterialCommunityIcons'
  text: string
  isLoading: boolean
  color?: string
  style?: {}
} & (
  | { iconStyle: 'Feather'; iconName: FeatherIconName }
  | { iconStyle: 'MaterialCommunityIcons'; iconName: MaterialCommunityIconName }
)

const PillButton = ({
  onPress,
  label,
  hint,
  iconName,
  iconStyle,
  text,
  isLoading,
  color,
  style,
}: PillButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: color || '#3a5a40',
        },
        style,
      ]}
      onPress={onPress}
      disabled={isLoading}
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      {iconStyle === 'Feather' ? (
        <Feather name={iconName} size={25} color='#fff' />
      ) : (
        <MaterialCommunityIcons name={iconName} size={25} color='#fff' />
      )}
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
  },
})

export default PillButton
