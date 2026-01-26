'use client'

import { useState, useMemo } from "react"
import {
    Plus, Pencil, Trash2, Search, MapPin, X, Save,
    Phone, BedDouble, Utensils, Info
} from "lucide-react"
import { createHotel, updateHotel, deleteResource } from "@/actions/resources"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"

interface HotelManagerProps {
    initialData: any[]
    locations: any[]
}

export function HotelManager({ initialData, locations }: HotelManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    // --- SEARCH & FILTER STATE ---
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedLocation, setSelectedLocation] = useState("All")

    // --- FORM STATE ---
    // We keep rates in local state while editing to allow easy add/remove logic
    const [tempRates, setTempRates] = useState<any[]>([])

    // --- FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        return initialData.filter(hotel => {
            const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesLocation = selectedLocation === "All" || hotel.locationId === selectedLocation
            return matchesSearch && matchesLocation
        })
    }, [initialData, searchQuery, selectedLocation])

    // --- HANDLERS ---

    function handleEdit(item: any) {
        setEditingItem(item)
        // Load existing rates or default to one empty row
        if (item.rates && item.rates.length > 0) {
            setTempRates(item.rates)
        } else {
            setTempRates([{ roomType: "Standard", mealPlan: "EP", inclusions: "", costPrice: 0, currency: "NPR" }])
        }
        setIsModalOpen(true)
    }

    function handleCreate() {
        setEditingItem(null)
        setTempRates([{ roomType: "Standard", mealPlan: "EP", inclusions: "", costPrice: 0, currency: "NPR" }])
        setIsModalOpen(true)
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this hotel? This cannot be undone.")) return
        const result = await deleteResource(id, 'hotel')
        if (result?.success) toast.success("Hotel deleted")
        else toast.error(result?.error)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (editingItem) formData.append('id', editingItem.id)

        // Append the rates JSON
        formData.append('rates', JSON.stringify(tempRates))

        const action = editingItem ? updateHotel : createHotel
        const result = await action(null, formData)

        if (result?.success) {
            toast.success(result.message)
            setIsModalOpen(false)
        } else {
            toast.error(result?.error || "Error saving hotel")
        }
    }

    // --- RATE TABLE HELPERS ---
    function addRateRow() {
        setTempRates([...tempRates, { roomType: "", mealPlan: "BB", inclusions: "", costPrice: 0, currency: "NPR" }])
    }
    function removeRateRow(index: number) {
        if (tempRates.length > 1) {
            setTempRates(tempRates.filter((_, i) => i !== index))
        }
    }
    function updateRateRow(index: number, field: string, value: any) {
        const newRates = [...tempRates]
        newRates[index][field] = value
        setTempRates(newRates)
    }

    return (
        <div className="space-y-6">

            {/* 1. TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={16} />
                    <input
                        type="text"
                        placeholder="Search hotels..."
                        className="input input-bordered input-sm w-full pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Location Filter */}
                    <select
                        className="select select-bordered select-sm w-full md:w-auto"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="All">All Locations</option>
                        {locations.map((loc: any) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>

                    <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2 whitespace-nowrap">
                        <Plus size={16} /> Add Hotel
                    </button>
                </div>
            </div>

            {/* 2. GRID LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredData.map((hotel: any) => (
                    <div key={hotel.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden">

                        {/* Image Header */}
                        <div className="h-40 w-full bg-base-200 relative">
                            {hotel.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-base-content/10">
                                    <Building2 size={48} />
                                </div>
                            )}
                            {/* Overlay Actions */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(hotel)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow text-primary"><Pencil size={12} /></button>
                                <button onClick={() => handleDelete(hotel.id)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow text-error"><Trash2 size={12} /></button>
                            </div>
                            <div className="absolute bottom-2 left-2 badge badge-sm bg-base-100/90 backdrop-blur border-0 text-xs font-semibold gap-1">
                                <MapPin size={10} /> {hotel.location?.name || "Unknown"}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">{hotel.name}</h3>
                                    {hotel.contactInfo && (
                                        <div className="flex items-center gap-1 text-xs text-base-content/60 mt-1">
                                            <Phone size={10} /> {hotel.contactInfo}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mini Rate Table */}
                            <div className="bg-base-200/50 rounded-lg p-3 text-xs space-y-1.5 mt-3">
                                <div className="flex justify-between font-bold opacity-40 uppercase text-[10px]">
                                    <span>Room / Plan</span>
                                    <span>Price</span>
                                </div>
                                {hotel.rates.slice(0, 3).map((r: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{r.roomType}</span>
                                            <span className="opacity-50 text-[10px] border border-base-content/20 px-1 rounded">{r.mealPlan}</span>
                                        </div>
                                        <span className="font-mono font-bold text-primary">{formatCurrency(r.costPrice, r.currency)}</span>
                                    </div>
                                ))}
                                {hotel.rates.length === 0 && <div className="text-center opacity-40 italic py-1">No rates added</div>}
                                {hotel.rates.length > 3 && <div className="text-center opacity-40 pt-1">+{hotel.rates.length - 3} more rates</div>}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredData.length === 0 && (
                    <div className="col-span-full text-center py-16 opacity-50 flex flex-col items-center">
                        <Info size={48} className="mb-4 opacity-20" />
                        <p>No hotels found matching your filters.</p>
                    </div>
                )}
            </div>

            {/* 3. MODAL FORM */}
            {isModalOpen && (
                <dialog className="modal modal-open backdrop-blur-sm">
                    <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden bg-base-100 shadow-2xl">
                        <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100">
                            <h3 className="font-bold text-lg">{editingItem ? 'Edit Hotel' : 'Add New Hotel'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-circle btn-ghost"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-[80vh] md:h-auto">

                            {/* --- LEFT: BASIC INFO --- */}
                            <div className="md:w-1/3 bg-base-200/50 p-6 space-y-5 border-r border-base-200 overflow-y-auto">
                                <div className="text-xs font-bold text-base-content/40 uppercase tracking-wider">Hotel Details</div>

                                {/* Image Upload */}
                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Cover Image</label>
                                    <ImageUpload name="image" defaultValue={editingItem?.imageUrl} />
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Hotel Name <span className="text-error">*</span></label>
                                    <input name="name" defaultValue={editingItem?.name} className="input input-bordered input-sm w-full" required placeholder="e.g. Hotel Shanker" />
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Location <span className="text-error">*</span></label>
                                    <select name="locationId" defaultValue={editingItem?.locationId || ""} className="select select-bordered select-sm w-full" required>
                                        <option value="">Select Location...</option>
                                        {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Contact Info</label>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-2.5 opacity-40" />
                                        <input name="contactInfo" defaultValue={editingItem?.contactInfo} className="input input-bordered input-sm w-full pl-9" placeholder="Phone or Email" />
                                    </div>
                                </div>
                            </div>

                            {/* --- RIGHT: RATES TABLE --- */}
                            <div className="md:w-2/3 flex flex-col bg-base-100 h-full">
                                <div className="p-4 border-b border-base-200 bg-base-100 flex justify-between items-center">
                                    <div className="text-xs font-bold text-base-content/40 uppercase tracking-wider">Room Rates & Plans</div>
                                    <button type="button" onClick={addRateRow} className="btn btn-xs btn-primary gap-1"><Plus size={12} /> Add Rate</button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    <table className="table table-xs w-full">
                                        <thead>
                                            <tr className="text-base-content/50 border-b border-base-200">
                                                <th className="font-semibold"><div className="flex items-center gap-1"><BedDouble size={12} /> Room Type</div></th>
                                                <th className="font-semibold w-32"><div className="flex items-center gap-1"><Utensils size={12} /> Plan</div></th>
                                                <th className="font-semibold">Inclusions</th>
                                                <th className="font-semibold w-24 text-right">Cost (NPR)</th>
                                                <th className="w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tempRates.map((rate, idx) => (
                                                <tr key={idx} className="group hover:bg-base-50 transition-colors border-b border-base-100 last:border-0">
                                                    <td className="p-2">
                                                        <input
                                                            value={rate.roomType}
                                                            onChange={(e) => updateRateRow(idx, 'roomType', e.target.value)}
                                                            className="input input-bordered input-xs w-full focus:input-primary"
                                                            placeholder="Standard"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <select
                                                            value={rate.mealPlan}
                                                            onChange={(e) => updateRateRow(idx, 'mealPlan', e.target.value)}
                                                            className="select select-bordered select-xs w-full focus:select-primary"
                                                        >
                                                            <option value="EP">EP (Room Only)</option>
                                                            <option value="BB">BB (Breakfast)</option>
                                                            <option value="MAP">MAP (Dinner+Bfast)</option>
                                                            <option value="AP">AP (All Meals)</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            value={rate.inclusions}
                                                            onChange={(e) => updateRateRow(idx, 'inclusions', e.target.value)}
                                                            className="input input-bordered input-xs w-full focus:input-primary"
                                                            placeholder="e.g. 2 Eggs, Toast"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            value={rate.costPrice}
                                                            onChange={(e) => updateRateRow(idx, 'costPrice', e.target.value)}
                                                            className="input input-bordered input-xs w-full text-right font-mono font-bold text-primary focus:input-primary"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button type="button" onClick={() => removeRateRow(idx)} className="btn btn-ghost btn-xs text-base-content/30 hover:text-error">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {tempRates.length === 0 && (
                                        <div className="text-center py-10 opacity-40 text-sm">
                                            Click "Add Rate" to define pricing for this hotel.
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="p-4 border-t border-base-200 flex justify-end gap-3 bg-base-100">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
                                    <button type="submit" className="btn btn-primary px-8 gap-2">
                                        <Save size={16} /> Save Hotel
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                </dialog>
            )}
        </div>
    )
}

// Helper icon component
function Building2({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    )
}