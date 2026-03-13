import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        totalPaise: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            pricePaise: true,
            product: { select: { id: true, slug: true, title: true, imageUrl: true } },
          },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    console.error("[store][orders][me][error]", err)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
