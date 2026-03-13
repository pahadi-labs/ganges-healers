"use client"

import Link from "next/link"
import { useCart } from "@/components/store/CartProvider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Minus, Plus, Trash2 } from "lucide-react"

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, totalPaise, totalItems, isOpen, setIsOpen } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart ({totalItems})</SheetTitle>
          <SheetDescription>Review your items before checkout</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Your cart is empty
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 items-start border-b pb-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-sm text-muted-foreground">
                    ₹{(item.pricePaise / 100).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      className="p-1 hover:bg-muted rounded"
                      aria-label={`Decrease quantity of ${item.title}`}
                      onClick={() =>
                        item.quantity > 1
                          ? updateQuantity(item.productId, item.quantity - 1)
                          : removeItem(item.productId)
                      }
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      className="p-1 hover:bg-muted rounded"
                      aria-label={`Increase quantity of ${item.title}`}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 ml-auto hover:bg-muted rounded text-destructive"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <SheetFooter className="border-t pt-4">
            <div className="w-full space-y-3">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>₹{(totalPaise / 100).toFixed(2)}</span>
              </div>
              <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
                <Link href="/store/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
