import { Redirect } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { useEffect, useState } from "react"
import { View } from "react-native"

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync("access_token")
    setInitialRoute(token ? "dashboard" : "auth/login")
  }

  if (!initialRoute) {
    return <View /> // Blank screen while checking auth
  }

  return <Redirect href={initialRoute} />
}
