'use client'

import { useState, useMemo } from "react"
import {
    Plus, Pencil, Trash2, Search, PartyPopper,
    MapPin, Save, X, Ticket
} from "lucide-react"
import { createActivity, updateActivity, deleteResource } from "@/actions/resources"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"

interface ActivityManagerProps {
    initialData: any[]
    locations: any[]
}

export function ActivityManager({ initialData, locations }: ActivityManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    // --- SEARCH & FILTER ---
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedLocation, setSelectedLocation] = useState("All")

    const filteredData = useMemo(() => {
        return initialData.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesLoc = selectedLocation === "All" || item.locationId === selectedLocation
            return matchesSearch && matchesLoc
        })
    }, [initialData, searchQuery, selectedLocation])

    // --- HANDLERS ---
    function handleEdit(item: any) { setEditingItem(item); setIsModalOpen(true) }
    function handleCreate() { setEditingItem(null); setIsModalOpen(true) }

    async function handleDelete(id: string) {
        if (!confirm("Delete this activity?")) return
        const result = await deleteResource(id, 'activity')
        if (result?.success) toast.success("Activity deleted")
        else toast.error(result?.error)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        if (editingItem) formData.append('id', editingItem.id)

        const action = editingItem ? updateActivity : createActivity
        const result = await action(null, formData)

        if (result?.success) {
            toast.success(result.message)
            setIsModalOpen(false)
        } else {
            toast.error(result?.error || "Error saving activity")
        }
    }

    return (
        <div className="space-y-6">

            {/* 1. TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={16} />
                    <input
                        type="text"
                        placeholder="Search activities..."
                        className="input input-bordered input-sm w-full pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <select
                        className="select select-bordered select-sm"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="All">All Locations</option>
                        {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <button onClick={handleCreate} className="btn btn-primary btn-sm gap-2 whitespace-nowrap">
                        <Plus size={16} /> Add Activity
                    </button>
                </div>
            </div>

            {/* 2. GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredData.map((a: any) => (
                    <div key={a.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden">

                        {/* Header Image */}
                        <div className="h-40 w-full bg-base-200 relative">
                            {a.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-base-content/10"><PartyPopper size={48} /></div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(a)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow text-primary"><Pencil size={12} /></button>
                                <button onClick={() => handleDelete(a.id)} className="btn btn-xs btn-circle btn-ghost bg-base-100 shadow text-error"><Trash2 size={12} /></button>
                            </div>
                            <div className="absolute bottom-2 left-2 badge badge-sm bg-base-100/90 backdrop-blur border-0 text-xs font-semibold gap-1">
                                <MapPin size={10} /> {a.location?.name || "Unknown"}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold leading-tight text-lg">{a.name}</h3>
                            </div>

                            <div className="mt-4 pt-4 border-t border-base-200 flex justify-between items-end">
                                <span className="text-xs font-bold text-base-content/40 uppercase tracking-wide">Cost Per Pax</span>
                                <span className="font-mono font-bold text-xl text-primary">{formatCurrency(a.costPerHead, a.currency)}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredData.length === 0 && <div className="col-span-full text-center py-10 opacity-50">No activities found.</div>}
            </div>

            {/* 3. MODAL */}
            {isModalOpen && (
                <dialog className="modal modal-open backdrop-blur-sm">
                    <div className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100 shadow-2xl">
                        <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-100">
                            <h3 className="font-bold text-lg">{editingItem ? 'Edit Activity' : 'Add Activity'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-circle btn-ghost"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">

                            {/* LEFT: DETAILS */}
                            <div className="md:w-1/2 bg-base-200/50 p-6 space-y-4 border-r border-base-200">
                                <div className="text-xs font-bold text-base-content/40 uppercase tracking-wider">Activity Info</div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Image</label>
                                    <ImageUpload name="image" defaultValue={editingItem?.imageUrl} />
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Name <span className="text-error">*</span></label>
                                    <div className="relative"><PartyPopper size={14} className="absolute left-3 top-3 opacity-40" /><input name="name" defaultValue={editingItem?.name} className="input input-bordered input-sm w-full pl-9" required placeholder="e.g. Paragliding" /></div>
                                </div>

                                <div className="form-control w-full">
                                    <label className="label label-text text-xs font-bold">Location <span className="text-error">*</span></label>
                                    <div className="relative">
                                        <MapPin size={14} className="absolute left-3 top-2.5 opacity-40" />
                                        <select name="locationId" defaultValue={editingItem?.locationId || ""} className="select select-bordered select-sm w-full pl-9" required>
                                            <option value="">Select Location...</option>
                                            {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: PRICING */}
                            <div className="md:w-1/2 p-6 flex flex-col justify-center items-center text-center">
                                <div className="w-full max-w-xs p-6 border border-base-200 rounded-2xl bg-base-100 shadow-sm">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Ticket size={24} />
                                    </div>
                                    <label className="text-sm font-bold text-base-content/60 block mb-2">Cost Per Head</label>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-2xl font-bold text-base-content/30">NPR</span>
                                        <input
                                            name="costPerHead"
                                            defaultValue={editingItem?.costPerHead}
                                            type="number"
                                            className="input input-ghost text-4xl font-bold w-40 text-center p-0 h-auto focus:bg-transparent text-primary"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-base-content/40">Enter the cost for a single participant.</p>
                                    <input type="hidden" name="currency" value="NPR" />
                                </div>

                                <div className="w-full mt-auto pt-8">
                                    <button type="submit" className="btn btn-primary w-full gap-2 shadow-lg shadow-primary/20">
                                        <Save size={16} /> Save Activity
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm w-full mt-2">Cancel</button>
                                </div>
                            </div>

                        </form>
                    </div>
                </dialog>
            )}
        </div>
    )
}