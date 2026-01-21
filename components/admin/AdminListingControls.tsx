"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, Trash2, Pencil, Loader2, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminListingControlsProps {
  listingId: number
  locale: string
  status?: string
  onMarkSold?: () => void | Promise<void>
  onMarkAvailable?: () => void | Promise<void>
  onDelete?: () => void | Promise<void>
  onEdit?: () => void | Promise<void>
}

export function AdminListingControls({
  listingId,
  locale,
  status,
  onMarkSold,
  onMarkAvailable,
  onDelete,
}: AdminListingControlsProps) {
  const router = useRouter()
  const [confirmSold, setConfirmSold] = useState(false)
  const [confirmAvailable, setConfirmAvailable] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState<"sold" | "available" | "delete" | null>(null)
  const { toast } = useToast()
  const isSold = status === "sold" || status === "Sold"

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[AdminListingControls] Edit clicked for listing:", listingId, "-> /admin/listings/edit")
    router.push(`/${locale}/admin/listings/edit/${listingId}`)
  }

  const handleMarkSold = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[AdminListingControls] Mark as Sold clicked for listing:", listingId)
    setConfirmSold(true)
  }

  const doMarkSold = async () => {
    if (!onMarkSold) {
      toast({ title: "Error", description: "Mark sold not available", variant: "destructive" })
      return
    }
    setLoading("sold")
    try {
      console.log("[AdminListingControls] Executing mark sold for:", listingId)
      await onMarkSold()
      setConfirmSold(false)
      toast({ title: "Marked as sold", description: "Listing status updated." })
    } catch (err: unknown) {
      console.error("[AdminListingControls] Mark sold error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not update listing",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleMarkAvailable = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmAvailable(true)
  }

  const doMarkAvailable = async () => {
    if (!onMarkAvailable) {
      toast({ title: "Error", description: "Mark available not available", variant: "destructive" })
      return
    }
    setLoading("available")
    try {
      await onMarkAvailable()
      setConfirmAvailable(false)
      toast({ title: "Marked as available", description: "Listing status updated." })
    } catch (err: unknown) {
      console.error("[AdminListingControls] Mark available error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not update listing",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[AdminListingControls] Delete clicked for listing:", listingId)
    setConfirmDelete(true)
  }

  const doDelete = async () => {
    if (!onDelete) {
      toast({ title: "Error", description: "Delete not available", variant: "destructive" })
      return
    }
    setLoading("delete")
    try {
      console.log("[AdminListingControls] Executing delete for:", listingId)
      await onDelete()
      setConfirmDelete(false)
      toast({ title: "Listing deleted", variant: "destructive" })
    } catch (err: unknown) {
      console.error("[AdminListingControls] Delete error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not delete listing",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div
        className="mt-2 flex flex-wrap items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {status && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              isSold ? "bg-amber-600/30 text-amber-400" : "bg-green-600/30 text-green-400"
            }`}
          >
            {status}
          </span>
        )}
        {isSold ? (
          <Button
            size="sm"
            variant="outline"
            className="border-blue-600/60 bg-blue-600/10 text-blue-400 hover:bg-blue-600/25 hover:text-blue-300"
            onClick={handleMarkAvailable}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Mark as Available
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="border-green-600/60 bg-green-600/10 text-green-400 hover:bg-green-600/25 hover:text-green-300"
            onClick={handleMarkSold}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Mark as Sold
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="border-blue-600/60 bg-blue-600/10 text-blue-400 hover:bg-blue-600/25 hover:text-blue-300"
          onClick={handleEdit}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-red-600/60 bg-red-600/10 text-red-400 hover:bg-red-600/25 hover:text-red-300"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </div>

      <Dialog open={confirmSold} onOpenChange={setConfirmSold}>
        <DialogContent className="border-gray-700 bg-gray-900" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-white">Mark as Sold</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to mark this listing as sold? It will stay visible with a &quot;SOLD&quot; badge.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600" onClick={() => setConfirmSold(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={doMarkSold}
              disabled={loading === "sold"}
            >
              {loading === "sold" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Sold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAvailable} onOpenChange={setConfirmAvailable}>
        <DialogContent className="border-gray-700 bg-gray-900" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-white">Mark as Available</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to mark this listing as available again? It will be active in the marketplace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600" onClick={() => setConfirmAvailable(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={doMarkAvailable}
              disabled={loading === "available"}
            >
              {loading === "available" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Available"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="border-gray-700 bg-gray-900" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-white">Delete Listing</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-gray-600" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={doDelete}
              disabled={loading === "delete"}
            >
              {loading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
