import { NextResponse } from "next/server"

// In a real application, you would validate against your database
// This is a simplified example with a hardcoded test user
const TEST_USER = {
  id: 1,
  email: "test@example.com",
  password: "password123", // In a real app, this would be hashed
  name: "Test User",
}

// For this demo, we'll use a simple token generation approach
// In a real app, you would use a proper JWT library with environment variables
function generateSimpleToken(payload: any) {
  // Base64 encode the payload
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64")
  // In a real app, you would sign this with a secret key
  return `DEMO.${encodedPayload}.SIGNATURE`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Check if the user exists and password matches
    if (email === TEST_USER.email && password === TEST_USER.password) {
      // Create a simple token
      const token = generateSimpleToken({
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
      })

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: TEST_USER.id,
          email: TEST_USER.email,
          name: TEST_USER.name,
        },
      })
    }

    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
