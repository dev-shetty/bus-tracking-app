import { Stack } from "expo-router"
import { useEffect } from "react"
import * as SplashScreen from "expo-splash-screen"

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const DELAY = 0
  useEffect(() => {
    // Simulate resource loading
    const hideSplash = async () => {
      await new Promise((resolve) => setTimeout(resolve, DELAY)) // 2 second delay
      await SplashScreen.hideAsync()
    }

    hideSplash()
  }, [])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/verify" />
      <Stack.Screen name="dashboard" />
    </Stack>
  )
}
