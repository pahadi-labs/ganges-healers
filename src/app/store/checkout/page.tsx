import type { Metadata } from "next"
import { canonicalOf } from "@/config/site"
import CheckoutClient from "./CheckoutClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Checkout | Store | Ganges Healers",
  description: "Complete your store purchase",
  alternates: { canonical: canonicalOf("/store/checkout") },
}

export default function StoreCheckoutPage() {
  return <CheckoutClient />
}
