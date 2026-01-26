'use client'

import { useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Search, Filter, SortAsc, Mountain, Gauge, Globe, X, Save } from "lucide-react"
import { createLocation, updateLocation, deleteLocation } from "@/actions/locations"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { toast } from "sonner"

// Common countries for a Himalayan agency
const COUNTRIES = ["Nepal", "India", "Bhutan", "Tibet (China)", "Thailand", "Sri Lanka"]

export function LocationManager({ initialData }: { initialData: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    // --- SEARCH & FILTER STATE ---
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCountry, setSelectedCountry] = useState("All")
    const [sortBy, setSortBy] = useState<"name" | "altitude">("name")

    // --- FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        return initialData
            .filter(loc => {
                const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesCountry = selectedCountry === "All" || loc.country === selectedCountry
                return matchesSearch && matchesCountry
            })
            .sort((a, b) => {
                if (sortBy === 'altitude') return (b.altitude || 0) - (a.altitude || 0) // Highest first
                return a.name.localeCompare(b.name) // A-Z
            })
    }, [initialData, searchQuery, selectedCountry, sortBy])

    // --- HANDLERS ---
    function handleEdit(item: any) { setEditingItem(item); setIsModalOpen(true) }
    function handleCreate() { setEditingItem(null); setIsModalOpen(true) }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        if (editingItem) formData.append('id', editingItem.id)

        const action = editingItem ? updateLocation : createLocation
        const result = await action(null, formData)

        if (result?.success) {
            toast.success(result.message)
            setIsModalOpen(false)
        } else {
            toast.error(result?.error || "Error saving")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this location?")) return
        const result = await deleteLocation(id)
        if (result?.success) toast.success("Deleted"); else toast.error(result?.error)
    }

    return (
        <div className="space-y-6">

            {/* 1. TOOLBAR (Search, Filter, Sort, Add) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={16} />
                    <input
                        type="text"
                        placeholder="Search locations..."
                        className="input input-bordered input-sm w-full pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {/* Country Filter */}
                    <select
                        className="select select-bordered select-sm"
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                        <option value="All">All Countries</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Sort */}
                    <button onClick={() => setSortBy(prev => prev === 'name' ? 'altitude' : 'name')} className="btn btn-sm btn-ghost gap-2 border border-base-300">
                        <SortAsc size={16} /> {sortBy === 'name' ? 'Name' : 'Altitude'}
                    </button>

                    {/* Add Button */}
                    <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2">
                        <Plus size={16} /> Add Location
                    </button>
                </div>
            </div>

            {/* 2. GRID LIST */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredData.map((loc: any) => (
                    <div key={loc.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                        {/* Image Area */}
                        <div className="h-32 w-full bg-base-200 relative">
                            {loc.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-base-content/10"><Mountain size={48} /></div>
                            )}
                            {/* Overlay Actions */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(loc)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow"><Pencil size={12} /></button>
                                <button onClick={() => handleDelete(loc.id)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow text-error"><Trash2 size={12} /></button>
                            </div>
                            <div className="absolute bottom-2 left-2 badge badge-sm bg-base-100/90 backdrop-blur border-0 text-xs font-semibold">
                                {loc.country}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold">{loc.name}</h3>
                                {loc.altitude && <span className="text-xs font-mono opacity-50">{loc.altitude}m</span>}
                            </div>
                            <p className="text-xs text-base-content/60 mt-2 line-clamp-2 min-h-[2.5em]">
                                {loc.description || "No description provided."}
                            </p>
                        </div>
                    </div>
                ))}

                {filteredData.length === 0 && (
                    <div className="col-span-full text-center py-10 opacity-50">
                        No locations found matching your filter.
                    </div>
                )}
            </div>

            {/* 3. MODAL FORM */}
            {isModalOpen && (
                <dialog className="modal modal-open backdrop-blur-sm">
                    <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden">
                        <div className="px-6 py-4 border-b border-base-200 bg-base-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editingItem ? 'Edit Location' : 'New Location'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-circle btn-ghost"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
                            {/* Left: Inputs */}
                            <div className="flex-1 p-6 space-y-4">
                                <div className="form-control">
                                    <label className="label text-xs font-bold">Name</label>
                                    <div className="relative"><Mountain size={14} className="absolute left-3 top-3 opacity-40" /><input name="name" defaultValue={editingItem?.name} className="input input-bordered w-full pl-9" required /></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label text-xs font-bold">Country</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-3 top-3.5 opacity-40" />
                                            <select name="country" defaultValue={editingItem?.country || "Nepal"} className="select select-bordered w-full pl-9">
                                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label text-xs font-bold">Altitude (m)</label>
                                        <div className="relative"><Gauge size={14} className="absolute left-3 top-3 opacity-40" /><input name="altitude" type="number" defaultValue={editingItem?.altitude} className="input input-bordered w-full pl-9" /></div>
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label text-xs font-bold">Description</label>
                                    <textarea name="description" defaultValue={editingItem?.description} className="textarea textarea-bordered h-24" placeholder="About this place..." />
                                </div>
                            </div>

                            {/* Right: Image */}
                            <div className="w-full md:w-64 bg-base-200/50 p-6 border-l border-base-200 flex flex-col">
                                <label className="label text-xs font-bold mb-2">Cover Image</label>
                                <div className="flex-1">
                                    <ImageUpload name="image" defaultValue={editingItem?.imageUrl} />
                                </div>
                                <button type="submit" className="btn btn-primary w-full mt-4 gap-2">
                                    <Save size={16} /> Save Location
                                </button>
                            </div>
                        </form>
                    </div>
                </dialog>
            )}
        </div>
    )
}