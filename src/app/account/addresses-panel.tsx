"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  deleteDeliveryAddress,
  fetchUserDeliveryAddresses,
  saveDeliveryAddress,
  setDefaultDeliveryAddress,
  type DeliveryInfo,
} from "@/services/deliveryService"
import { normalizeDisplayCity } from "@/lib/delivery-location"
import { MapPin, Plus, Star, Trash2 } from "lucide-react"

export function AddressesPanel({ userId }: { userId: string }) {
  const [addresses, setAddresses] = React.useState<DeliveryInfo[]>([])
  const [addrLoading, setAddrLoading] = React.useState(true)
  const [addrCity, setAddrCity] = React.useState("")
  const [addrArea, setAddrArea] = React.useState("")
  const [addrStreet, setAddrStreet] = React.useState("")
  const [addrPhone, setAddrPhone] = React.useState("")
  const [addrLabel, setAddrLabel] = React.useState("المنزل")
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [savingAddr, setSavingAddr] = React.useState(false)

  const refreshAddresses = React.useCallback(async () => {
    setAddrLoading(true)
    const data = await fetchUserDeliveryAddresses(userId)
    setAddresses(data)
    setAddrLoading(false)
  }, [userId])

  React.useEffect(() => {
    void refreshAddresses()
  }, [refreshAddresses])

  const handleAddAddress = async () => {
    if (!addrCity || !addrStreet) return
    setSavingAddr(true)
    const { error } = await saveDeliveryAddress(userId, {
      label: addrLabel,
      phone_number: addrPhone,
      city: addrCity,
      area: addrArea,
      address: addrStreet,
      is_default: addresses.length === 0,
    })
    setSavingAddr(false)
    if (!error) {
      await refreshAddresses()
      setShowAddForm(false)
      setAddrCity("")
      setAddrArea("")
      setAddrStreet("")
      setAddrPhone("")
    }
  }

  const handleDeleteAddress = async (id: string) => {
    await deleteDeliveryAddress(id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultDeliveryAddress(id, userId)
    await refreshAddresses()
  }

  if (addrLoading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {addresses.map((addr) => (
        <div key={addr.id} className={`bg-surface border rounded-3xl p-5 flex flex-col sm:flex-row gap-4 transition-all ${addr.is_default ? "border-primary/50 shadow-primary/10 shadow-lg" : "border-surface-hover"}`}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{addr.label}</span>
              {addr.is_default && (
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Star className="w-3 h-3" /> افتراضي
                </span>
              )}
            </div>
            <p className="font-bold text-foreground text-sm">{addr.address}</p>
            <p className="text-gray-500 text-sm">{addr.area && `${addr.area}، `}{normalizeDisplayCity(addr.city)}</p>
            {addr.phone_number && <p className="text-gray-500 text-xs mt-1" dir="ltr">{addr.phone_number}</p>}
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            {!addr.is_default && (
              <button type="button" onClick={() => handleSetDefault(addr.id)} className="text-xs text-primary font-bold hover:underline" aria-label="تعيين هذا العنوان كعنوان افتراضي">
                تعيين افتراضي
              </button>
            )}
            <button type="button" onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1" aria-label="حذف هذا العنوان">
              <Trash2 className="w-3 h-3" /> حذف
            </button>
          </div>
        </div>
      ))}

      {showAddForm ? (
        <div className="bg-surface border border-surface-hover rounded-3xl p-6 space-y-4">
          <h2 className="font-bold text-foreground">عنوان جديد</h2>
          <div className="grid grid-cols-2 gap-4">
            <input value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} placeholder="التسمية (المنزل، العمل...)" className="col-span-2 bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
            <input value={addrCity} onChange={(e) => setAddrCity(e.target.value)} placeholder="المحافظة *" className="bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
            <input value={addrArea} onChange={(e) => setAddrArea(e.target.value)} placeholder="المنطقة" className="bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
            <input value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} placeholder="عنوان الشارع *" className="col-span-2 bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none" />
            <input value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} placeholder="رقم الموبايل" dir="ltr" className="col-span-2 bg-background border border-surface-hover rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-primary outline-none text-right" />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddAddress} className="rounded-xl px-6" disabled={savingAddr}>{savingAddr ? "بنحفظ..." : "احفظ العنوان"}</Button>
            <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowAddForm(false)}>إلغاء</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full border-2 border-dashed border-surface-hover rounded-3xl p-6 text-gray-400 hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
          aria-label="إضافة عنوان جديد"
        >
          <Plus className="w-5 h-5" /> ضيف عنوان جديد
        </button>
      )}

      {addresses.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-4 border border-surface-hover">
            <MapPin className="w-9 h-9 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">لسه ما ضفتش عنوان</h3>
          <p className="text-gray-500">ضيف عنوانك علشان الطلبات توصل بسهولة ومن غير لخبطة.</p>
        </div>
      )}
    </div>
  )
}
