import { useEffect, useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity, View } from "react-native"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { MaterialIcons } from "@expo/vector-icons"

type Student = {
  name: string
  usn: string
  year: number
  bus_id: string
  institution_name: string
  home_address: string
}

export default function DashboardScreen() {
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync("access_token")
    if (!token) {
      router.replace("/auth/login")
      return
    }

    const userData = await SecureStore.getItemAsync("user_data")
    if (userData) {
      setStudents(JSON.parse(userData))
    }
  }

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("access_token")
    await SecureStore.deleteItemAsync("user_data")
    router.replace("/auth/login")
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Dashboard
        </ThemedText>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => router.push("/map")}
        >
          <MaterialIcons name="map" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {students.map((student, index) => (
          <View key={student.usn} style={styles.studentInfo}>
            <ThemedText style={styles.studentName}>{student.name}</ThemedText>
            <View style={styles.detailsContainer}>
              <DetailRow label="USN" value={student.usn} />
              <DetailRow label="Year" value={student.year.toString()} />
              <DetailRow label="Bus ID" value={student.bus_id} />
              <DetailRow label="Institution" value={student.institution_name} />
              <DetailRow label="Address" value={student.home_address} />
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="white" />
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  )
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <ThemedText style={styles.label}>{label}:</ThemedText>
    <ThemedText style={styles.value}>{value}</ThemedText>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  mapButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  studentInfo: {
    backgroundColor: "white",
    marginBottom: 1,
    padding: 16,
  },
  studentName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#007AFF",
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    width: 100,
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  value: {
    flex: 1,
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc3545",
    padding: 16,
    gap: 8,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
