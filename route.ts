import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Mock AI suggestion logic
  const suggestedTimes = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"]

  return NextResponse.json(suggestedTimes)
}

