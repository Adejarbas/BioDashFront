import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function formatTimestamp(timestamp: string): string {
  const now = new Date()
  const activityTime = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Agora mesmo"
  if (diffInMinutes < 60) return `${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""} atrás`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? "s" : ""} atrás`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return "Ontem"
  if (diffInDays < 7) return `${diffInDays} dias atrás`

  return activityTime.toLocaleDateString("pt-BR")
}

// GET - Retrieve activities
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const since = url.searchParams.get("since")

    let query = supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(limit)

    // Filter by timestamp if 'since' parameter is provided
    if (since) {
      query = query.gt("timestamp", since)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch activities" }, { status: 500 })
    }

    // Format activities with relative timestamps
    const formattedActivities = (activities || []).map((activity) => ({
      ...activity,
      timestamp: formatTimestamp(activity.timestamp),
    }))

    return NextResponse.json({
      success: true,
      data: formattedActivities,
      total: formattedActivities.length,
    })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch activities" }, { status: 500 })
  }
}

// POST - Add new activity
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, description } = body

    // Validate required fields
    if (!type || !description) {
      return NextResponse.json({ success: false, error: "Type and description are required" }, { status: 400 })
    }

    const { data: newActivity, error } = await supabase
      .from("activities")
      .insert({
        user_id: user.id,
        type,
        description,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to add activity" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newActivity,
        timestamp: formatTimestamp(newActivity.timestamp),
      },
      message: "Activity added successfully",
    })
  } catch (error) {
    console.error("Error adding activity:", error)
    return NextResponse.json({ success: false, error: "Failed to add activity" }, { status: 500 })
  }
}
