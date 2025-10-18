import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (!('from' in supabase)) {
      return NextResponse.json({ success: false, message: "Supabase client não configurado corretamente." }, { status: 500 });
    }
    const { data: userProfile, error } = await supabase.from("users").select("*").eq("id", user.id).single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Failed to fetch user data" }, { status: 500 })
    }

    // Return user data (create profile if doesn't exist)
    const userData = userProfile || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "User",
      company_name: null,
      address: null,
      phone: null,
      profile_image_url: null,
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, company_name, address, phone, profile_image_url } = body

    // Upsert user profile
    if (!('from' in supabase)) {
      return NextResponse.json({ success: false, message: "Supabase client não configurado corretamente." }, { status: 500 });
    }
    const { data, error } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        email: user.email,
        full_name,
        company_name,
        address,
        phone,
        profile_image_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Failed to update user data" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
