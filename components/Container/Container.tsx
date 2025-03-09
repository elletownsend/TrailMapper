import { ReactNode } from 'react'
import { View } from 'react-native'

const Container = ({
  children,
  style,
}: {
  children: ReactNode
  style: any
}) => {
  return <View style={style}>{children}</View>
}

export default Container
