import { useEffect, useState } from "react"
import { StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"

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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Dashboard
        </ThemedText>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {students.map((student, index) => (
        <ThemedView key={student.usn} style={styles.card}>
          <ThemedText type="subtitle">{student.name}</ThemedText>
          <ThemedText>USN: {student.usn}</ThemedText>
          <ThemedText>Year: {student.year}</ThemedText>
          <ThemedText>Bus ID: {student.bus_id}</ThemedText>
          <ThemedText>Institution: {student.institution_name}</ThemedText>
          <ThemedText>Address: {student.home_address}</ThemedText>
        </ThemedView>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  card: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    gap: 5,
  },
})
