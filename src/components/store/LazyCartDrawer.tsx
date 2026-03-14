"use client"

import dynamic from "next/dynamic"

const CartDrawer = dynamic(
  () => import("@/components/store/CartDrawer"),
  { ssr: false }
)

export default function LazyCartDrawer() {
  return <CartDrawer />
}
