import { useEffect, useState, useCallback, useRef } from "react"
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { ThemedView } from "@/components/ThemedView"
import { ThemedText } from "@/components/ThemedText"
import MapView, { Marker, AnimatedRegion } from "react-native-maps"
import * as SecureStore from "expo-secure-store"
import { router } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"

type BusLocation = {
  vehicleNumber: string
  latitude: number
  longitude: number
  location: string
  speed: number
  ignition: boolean
  angle: number
  timestamp: number
}

export default function MapScreen() {
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null)
  const [error, setError] = useState<string>("")
  const [markerCoordinate, setMarkerCoordinate] = useState(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    })
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const mapRef = useRef<any>(null)

  const animateMarker = useCallback(
    (newLocation: BusLocation) => {
      if (!markerCoordinate) return

      const newCoordinate = {
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }

      if (newLocation.ignition) {
        const { latitude, longitude } = newCoordinate
        markerCoordinate
          .timing({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
            toValue: latitude,
            useNativeDriver: false,
          })
          .start()
      } else {
        setMarkerCoordinate(new AnimatedRegion(newCoordinate))
      }
    },
    [markerCoordinate]
  )

  const fetchBusLocation = useCallback(async () => {
    try {
      const userData = await SecureStore.getItemAsync("user_data")
      if (!userData) return

      const token = await SecureStore.getItemAsync("access_token")

      const students = JSON.parse(userData)
      const busId = students[0]?.bus_id

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/location/${busId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.log("API Error:", errorData)
        await SecureStore.deleteItemAsync("access_token")
        await SecureStore.deleteItemAsync("user_data")
        router.replace("/auth/login")
        return
      }

      const data: BusLocation = await response.json()
      setBusLocation(data)
      animateMarker(data)
    } catch (err) {
      console.error("Error fetching location:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch location")
    }
  }, [animateMarker])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchBusLocation()
    setIsRefreshing(false)

    if (busLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      )
    }
  }, [fetchBusLocation, busLocation])

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync("access_token")
      if (!token) {
        router.replace("/auth/login")
        return
      }
      // Call fetchBusLocation only after auth check succeeds
      fetchBusLocation()
    }

    initialize()
  }, [])

  useEffect(() => {
    // Set up polling based on ignition status
    const interval = setInterval(
      fetchBusLocation,
      busLocation?.ignition ? 5000 : 60000 // 5 seconds if ignition ON, 1 minute if OFF
    )

    return () => clearInterval(interval)
  }, [busLocation?.ignition])

  useEffect(() => {
    if (busLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      )
    }
  }, [busLocation])

  useEffect(() => {
    console.log("Bus Location Updated:", busLocation)
  }, [busLocation])

  if (!busLocation) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    )
  }

  return (
    busLocation && (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: busLocation?.latitude || 0,
            longitude: busLocation?.longitude || 0,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {busLocation.ignition ? (
            <Marker.Animated
              coordinate={{
                latitude: markerCoordinate.latitude,
                longitude: markerCoordinate.longitude,
              }}
              title={busLocation.vehicleNumber}
              description={`Speed: ${busLocation.speed} km/h | Engine ON`}
            >
              <Image
                source={require("../assets/location-indicator.png")}
                style={{
                  width: 40,
                  height: 40,
                  transform: [{ rotate: `${busLocation.angle || 0}deg` }],
                }}
                resizeMode="contain"
              />
            </Marker.Animated>
          ) : (
            <Marker
              coordinate={{
                latitude: busLocation.latitude,
                longitude: busLocation.longitude,
              }}
              title={busLocation.vehicleNumber}
              description={`Speed: ${busLocation.speed} km/h | Engine OFF`}
              pinColor="red"
            />
          )}
        </MapView>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/dashboard")}
        >
          <MaterialIcons name="dashboard" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <ThemedView style={styles.infoCard}>
          <ThemedText type="subtitle">Bus Details</ThemedText>
          <ThemedText>Vehicle: {busLocation.vehicleNumber}</ThemedText>
          <ThemedText>Location: {busLocation.location}</ThemedText>
          {busLocation.ignition && (
            <ThemedText>Speed: {busLocation.speed} km/h</ThemedText>
          )}
          <ThemedText>
            Status: {busLocation.ignition ? "Running" : "Stationary"}
          </ThemedText>
        </ThemedView>

        {error && (
          <ThemedView style={styles.errorCard}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        )}
      </View>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorCard: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  errorText: {
    color: "#c62828",
    textAlign: "center",
  },
  carMarker: {
    width: 40,
    height: 40,
    transform: [{ rotate: "90deg" }],
  },
  navButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  refreshButton: {
    position: "absolute",
    zIndex: 1000,
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
