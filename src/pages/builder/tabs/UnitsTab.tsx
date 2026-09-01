import { useEffect, useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Field, SmallButton } from '../../../components/ui/Field'

type Tower = { id: string; name: string; total_floors: number | null }
type Unit = {
  id: string
  tower_id: string
  unit_number: string
  floor: number | null
  unit_type: string | null
  carpet_area_sqft: number | null
  status: string
  list_price: number | null
  parking_details: string | null
}
type Charge = { id: string; charge_name: string; amount: number }

export function UnitsTab({ projectId }: { projectId: string }) {
  const [towers, setTowers] = useState<Tower[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [towerName, setTowerName] = useState('')
  const [towerFloors, setTowerFloors] = useState('')
  const [savingTower, setSavingTower] = useState(false)

  const [selectedTower, setSelectedTower] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [unitType, setUnitType] = useState('')
  const [area, setArea] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [parking, setParking] = useState('')
  const [savingUnit, setSavingUnit] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    if (!supabase) return
    const { data: t } = await supabase.from('towers').select('id, name, total_floors').eq('project_id', projectId).order('name')
    setTowers((t as Tower[]) ?? [])
    if (t && t.length && !selectedTower) setSelectedTower((t[0] as Tower).id)

    const towerIds = (t as Tower[] | null)?.map((x) => x.id) ?? []
    if (towerIds.length) {
      const { data: u } = await supabase
        .from('units')
        .select('id, tower_id, unit_number, floor, unit_type, carpet_area_sqft, status, list_price, parking_details')
        .in('tower_id', towerIds)
        .order('unit_number')
      setUnits((u as Unit[]) ?? [])
    } else {
      setUnits([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleCreateTower(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSavingTower(true)
    await supabase.from('towers').insert({
      project_id: projectId,
      name: towerName,
      total_floors: towerFloors ? Number(towerFloors) : null,
    })
    setSavingTower(false)
    setTowerName('')
    setTowerFloors('')
    load()
  }

  async function handleCreateUnit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !selectedTower) return
    setSavingUnit(true)
    await supabase.from('units').insert({
      tower_id: selectedTower,
      unit_number: unitNumber,
      floor: floor ? Number(floor) : null,
      unit_type: unitType || null,
      carpet_area_sqft: area ? Number(area) : null,
      list_price: listPrice ? Number(listPrice) : null,
      parking_details: parking || null,
    })
    setSavingUnit(false)
    setUnitNumber('')
    setFloor('')
    setUnitType('')
    setArea('')
    setListPrice('')
    setParking('')
    load()
  }

  const towerName_ = (id: string) => towers.find((t) => t.id === id)?.name ?? '—'

  async function setUnitStatus(id: string, status: string) {
    if (!supabase) return
    await supabase.from('units').update({ status }).eq('id', id)
    load()
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Towers</h2>
        <form onSubmit={handleCreateTower} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-0 p-4">
          <div className="w-32">
            <Field label="Name" required value={towerName} onChange={(e) => setTowerName(e.target.value)} placeholder="Tower B" />
          </div>
          <div className="w-28">
            <Field label="Floors" type="number" value={towerFloors} onChange={(e) => setTowerFloors(e.target.value)} placeholder="20" />
          </div>
          <SmallButton disabled={savingTower} type="submit">
            {savingTower ? 'Adding…' : 'Add tower'}
          </SmallButton>
        </form>
        <div className="mt-3 space-y-2">
          {towers.map((t) => (
            <div key={t.id} className="flex justify-between rounded-lg border border-neutral-200 px-3.5 py-2.5 text-callout">
              <span className="text-neutral-900">{t.name}</span>
              <span className="text-neutral-400">{t.total_floors ? `${t.total_floors} floors` : ''}</span>
            </div>
          ))}
          {towers.length === 0 && <p className="text-callout text-neutral-400">No towers yet.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Units</h2>
        <form onSubmit={handleCreateUnit} className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-neutral-0 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-footnote font-medium text-neutral-600">Tower</span>
              <select
                value={selectedTower}
                onChange={(e) => setSelectedTower(e.target.value)}
                className="w-full rounded-md border border-neutral-200 bg-neutral-0 px-3 py-2 text-callout text-neutral-900 outline-none focus:border-accent-500"
              >
                {towers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Unit number" required value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="1204" />
            <Field label="Floor" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="12" />
            <Field label="Type" value={unitType} onChange={(e) => setUnitType(e.target.value)} placeholder="2BHK" />
            <Field label="Carpet area (sq.ft)" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="850" />
            <Field label="List price (₹)" type="number" value={listPrice} onChange={(e) => setListPrice(e.target.value)} placeholder="8500000" />
            <div className="col-span-2">
              <Field label="Parking" value={parking} onChange={(e) => setParking(e.target.value)} placeholder="1 covered, basement level 1" />
            </div>
          </div>
          <SmallButton disabled={savingUnit || !selectedTower} type="submit">
            {savingUnit ? 'Adding…' : 'Add unit'}
          </SmallButton>
        </form>
        <div className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto">
          {units.map((u) => (
            <div key={u.id} className="rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                <button onClick={() => setExpanded(expanded === u.id ? null : u.id)} className="flex flex-1 items-center gap-1.5 text-left text-callout">
                  {expanded === u.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span className="text-neutral-900">
                    {towerName_(u.tower_id)} &middot; {u.unit_number}
                  </span>
                </button>
                <span className="text-footnote text-neutral-400">{u.unit_type}</span>
                <select
                  value={u.status}
                  onChange={(e) => setUnitStatus(u.id, e.target.value)}
                  className="rounded-md border border-neutral-200 bg-neutral-0 px-2 py-1 text-caption text-neutral-900 outline-none"
                >
                  <option value="available">Available</option>
                  <option value="blocked">Blocked</option>
                  <option value="booked">Booked</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              {expanded === u.id && <UnitChargesPanel unit={u} onSaved={load} />}
            </div>
          ))}
          {units.length === 0 && <p className="text-callout text-neutral-400">No units yet.</p>}
        </div>
      </div>
    </div>
  )
}

function UnitChargesPanel({ unit, onSaved }: { unit: Unit; onSaved: () => void }) {
  const [charges, setCharges] = useState<Charge[]>([])
  const [chargeName, setChargeName] = useState('')
  const [amount, setAmount] = useState('')
  const [listPrice, setListPrice] = useState(unit.list_price != null ? String(unit.list_price) : '')
  const [parking, setParking] = useState(unit.parking_details ?? '')

  async function load() {
    if (!supabase) return
    const { data } = await supabase.from('unit_charges').select('id, charge_name, amount').eq('unit_id', unit.id)
    setCharges((data as Charge[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id])

  async function addCharge(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('unit_charges').insert({ unit_id: unit.id, charge_name: chargeName, amount: Number(amount) })
    setChargeName('')
    setAmount('')
    load()
  }

  async function removeCharge(id: string) {
    if (!supabase) return
    await supabase.from('unit_charges').delete().eq('id', id)
    load()
  }

  async function saveOverview(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    await supabase.from('units').update({ list_price: listPrice ? Number(listPrice) : null, parking_details: parking || null }).eq('id', unit.id)
    onSaved()
  }

  return (
    <div className="space-y-4 border-t border-neutral-200 bg-neutral-50 p-3.5">
      <form onSubmit={saveOverview} className="flex flex-wrap items-end gap-2">
        <div className="w-36">
          <Field label="List price (₹)" type="number" value={listPrice} onChange={(e) => setListPrice(e.target.value)} />
        </div>
        <div className="w-48">
          <Field label="Parking" value={parking} onChange={(e) => setParking(e.target.value)} />
        </div>
        <SmallButton type="submit">Save</SmallButton>
      </form>

      <div>
        <p className="text-caption font-semibold tracking-[0.02em] text-neutral-400 uppercase">Additional charges</p>
        <form onSubmit={addCharge} className="mt-2 flex flex-wrap items-end gap-2">
          <div className="w-40">
            <Field label="Charge" required value={chargeName} onChange={(e) => setChargeName(e.target.value)} placeholder="Clubhouse charge" />
          </div>
          <div className="w-28">
            <Field label="Amount (₹)" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <SmallButton type="submit">Add</SmallButton>
        </form>
        <div className="mt-2 space-y-1">
          {charges.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-footnote text-neutral-600">
              <span>{c.charge_name}</span>
              <span className="flex items-center gap-2">
                ₹{Number(c.amount).toLocaleString('en-IN')}
                <button onClick={() => removeCharge(c.id)} className="text-neutral-400 hover:text-status-overdue">
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          ))}
          {charges.length === 0 && <p className="text-footnote text-neutral-400">No additional charges yet.</p>}
        </div>
      </div>
    </div>
  )
}
