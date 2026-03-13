import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("avatar")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      )
    }

    const ext = file.type.split("/")[1] || "jpg"
    const pathname = `avatars/${session.user.id}-${Date.now()}.${ext}`

    const blob = await put(pathname, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: blob.url },
    })

    console.log("[users][me][avatar][uploaded]", { userId: session.user.id, url: blob.url })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("[users][me][avatar][error]", err)
    return NextResponse.json({ error: "Avatar upload failed" }, { status: 500 })
  }
}
