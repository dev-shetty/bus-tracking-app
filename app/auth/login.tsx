import { useState, useEffect } from "react"
import { StyleSheet, TextInput, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import * as SecureStore from "expo-secure-store"

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync("access_token")
    if (token) {
      router.replace("/dashboard")
    }
  }

  const validateMobile = (number: string) => {
    const mobileRegex = /^[6-9]\d{9}$/
    return mobileRegex.test(number)
  }

  const handleSendOTP = async () => {
    setError("")

    if (!validateMobile(mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/parent/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mobileNumber }),
        }
      )

      console.log(response)
      console.log({ mobileNumber })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP")
      }

      router.push({
        pathname: "/auth/verify",
        params: { mobileNumber },
      })
    } catch (err) {
      console.log(err)
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        ORIME
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Enter Mobile Number"
        keyboardType="number-pad"
        maxLength={10}
        value={mobileNumber}
        onChangeText={setMobileNumber}
      />

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0a7ea4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginBottom: 15,
  },
})
