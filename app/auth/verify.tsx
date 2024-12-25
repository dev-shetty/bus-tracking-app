import React, { useState, useEffect } from "react"
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import * as SecureStore from "expo-secure-store"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"

export default function VerifyScreen() {
  const { mobileNumber } = useLocalSearchParams<{ mobileNumber: string }>()
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""])
  const inputRefs = Array(6)
    .fill(0)
    .map(() => React.createRef<TextInput>())

  useEffect(() => {
    if (!mobileNumber) {
      router.replace("/auth/login")
    }
  }, [mobileNumber])

  const handleVerifyOTP = async () => {
    setError("")

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/parent/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mobileNumber, otp }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify OTP")
      }

      await SecureStore.setItemAsync("access_token", data.access_token)
      await SecureStore.setItemAsync("user_data", JSON.stringify(data.students))

      router.replace("/map")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (value: string, index: number) => {
    const newOtpArray = [...otpArray]
    newOtpArray[index] = value
    setOtpArray(newOtpArray)
    setOtp(newOtpArray.join(""))

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Verify OTP
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Enter the OTP sent to {mobileNumber}
      </ThemedText>

      <View style={styles.otpContainer}>
        {otpArray.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={styles.otpInput}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            autoComplete="off"
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace" && !digit && index > 0) {
                inputRefs[index - 1].current?.focus()
              }
            }}
          />
        ))}
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify OTP"}
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
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
  },
})
