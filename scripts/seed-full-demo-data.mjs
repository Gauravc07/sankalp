import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const project = await prisma.projects.findFirst({ where: { name: 'Skyline Heights' } })
if (!project) throw new Error('Run scripts/seed-demo.mjs first to create the demo builder/project.')

const towerB = await prisma.towers.findFirst({ where: { project_id: project.id, name: 'Tower B' } })

console.log('Seeding rich demo data into project', project.id)

// ---------------------------------------------------------------------------
// Construction milestones (chronological, increasing overall completion %)
// ---------------------------------------------------------------------------
await prisma.construction_milestones.createMany({
  data: [
    { project_id: project.id, tower_id: towerB.id, title: 'Foundation & piling completed', percent_complete: 15, status: 'completed', milestone_date: new Date('2026-02-10') },
    { project_id: project.id, tower_id: towerB.id, title: 'Plinth beam & podium slab cast', percent_complete: 28, status: 'completed', milestone_date: new Date('2026-03-15') },
    { project_id: project.id, tower_id: towerB.id, title: '5th floor slab cast', percent_complete: 42, status: 'completed', milestone_date: new Date('2026-04-20') },
    { project_id: project.id, tower_id: towerB.id, title: '9th floor slab cast', percent_complete: 55, status: 'completed', milestone_date: new Date('2026-05-25') },
    { project_id: project.id, tower_id: towerB.id, title: '12th floor slab cast — delayed by monsoon', percent_complete: 61, status: 'delayed', milestone_date: new Date('2026-06-20') },
  ],
})

// ---------------------------------------------------------------------------
// Drawings across every type
// ---------------------------------------------------------------------------
await prisma.drawings.createMany({
  data: [
    { project_id: project.id, tower_id: towerB.id, title: 'Sanctioned Building Plan - Tower B', drawing_type: 'sanctioned_building_plan', file_url: 'https://example.com/drawings/tower-b-sanctioned-plan.pdf' },
    { project_id: project.id, tower_id: towerB.id, title: 'Structural Drawing - Tower B, Typical Floor', drawing_type: 'structural', file_url: 'https://example.com/drawings/tower-b-structural-typical.pdf' },
    { project_id: project.id, tower_id: towerB.id, title: 'Electrical Layout - Tower B, 12th Floor', drawing_type: 'electrical', file_url: 'https://example.com/drawings/tower-b-electrical-12f.pdf' },
    { project_id: project.id, tower_id: towerB.id, title: 'Plumbing Layout - Tower B, 12th Floor', drawing_type: 'plumbing', file_url: 'https://example.com/drawings/tower-b-plumbing-12f.pdf' },
    { project_id: project.id, tower_id: towerB.id, title: 'Fire Safety Layout - Tower B', drawing_type: 'other', file_url: 'https://example.com/drawings/tower-b-fire-safety.pdf' },
  ],
})

// ---------------------------------------------------------------------------
// Quality checks — mixed pass/fail/pending
// ---------------------------------------------------------------------------
await prisma.quality_checks.createMany({
  data: [
    { project_id: project.id, tower_id: towerB.id, checklist_item: 'Concrete cube test - M30 grade, 12th floor', result: 'pass', inspector_name: 'R. Deshmukh', checked_at: new Date('2026-06-18') },
    { project_id: project.id, tower_id: towerB.id, checklist_item: 'Waterproofing check - terrace', result: 'fail', inspector_name: 'S. Kulkarni', remarks: 'Reapplication needed after monsoon damage', checked_at: new Date('2026-06-25') },
    { project_id: project.id, tower_id: towerB.id, checklist_item: 'Rebar spacing check - 14th floor', result: 'pass', inspector_name: 'R. Deshmukh', checked_at: new Date('2026-07-27') },
    { project_id: project.id, tower_id: towerB.id, checklist_item: 'Plastering thickness check - 10th floor', result: 'pending', checked_at: new Date('2026-07-28') },
  ],
})

// ---------------------------------------------------------------------------
// Material consumption — multiple materials over time
// ---------------------------------------------------------------------------
await prisma.material_consumption.createMany({
  data: [
    { project_id: project.id, tower_id: towerB.id, material_name: 'Steel TMT bars (Fe 500)', quantity: 32, unit: 'tonnes', log_date: new Date('2026-07-20') },
    { project_id: project.id, tower_id: towerB.id, material_name: 'River sand', quantity: 180, unit: 'cu.m', log_date: new Date('2026-07-22') },
    { project_id: project.id, tower_id: towerB.id, material_name: 'Aggregate (20mm)', quantity: 210, unit: 'cu.m', log_date: new Date('2026-07-24') },
    { project_id: project.id, tower_id: towerB.id, material_name: 'Ready-mix concrete (M25)', quantity: 95, unit: 'cu.m', log_date: new Date('2026-07-26') },
  ],
})

// ---------------------------------------------------------------------------
// Compliance records — cover every requirement with a realistic status
// ---------------------------------------------------------------------------
const requirements = await prisma.compliance_requirements.findMany()
const statusByCode = {
  RERA_REGISTRATION: null, // already seeded as approved
  COMMENCEMENT_CERT: { status: 'approved', reference_number: 'CC/2025/00842' },
  ENVIRONMENT_CLEARANCE: { status: 'not_applicable', notes: 'Built-up area below EIA notification threshold' },
  FIRE_NOC: { status: 'applied', reference_number: 'FIRE/2026/1187' },
  TREE_AUTHORITY_NOC: { status: 'approved', reference_number: 'TREE/2025/0456' },
  STRUCTURAL_STABILITY_CERT: { status: 'approved', reference_number: 'SSC/2025/0092' },
  OCCUPANCY_CERT: { status: 'pending' },
  COMPLETION_CERT: { status: 'pending' },
}
for (const req of requirements) {
  const entry = statusByCode[req.code]
  if (!entry) continue
  await prisma.compliance_records.upsert({
    where: { project_id_requirement_id: { project_id: project.id, requirement_id: req.id } },
    update: entry,
    create: { project_id: project.id, requirement_id: req.id, ...entry },
  })
}

// ---------------------------------------------------------------------------
// Premium calculations — a realistic spread
// ---------------------------------------------------------------------------
await prisma.premium_calculations.createMany({
  data: [
    { project_id: project.id, premium_type: 'Staircase & Lift Premium', calculation_basis: 'Fixed rate per sq.m of staircase/lift area', area_sqm: 120, rate_per_sqm: 4000, calculated_amount: 480000, payment_status: 'paid', paid_date: new Date('2026-01-15') },
    { project_id: project.id, premium_type: 'Additional FSI Premium', calculation_basis: '40% of ready reckoner rate x additional FSI area', area_sqm: 350, rate_per_sqm: 6000, calculated_amount: 2100000, payment_status: 'pending' },
    { project_id: project.id, premium_type: 'Open Space Deficiency Premium', calculation_basis: 'One-time waiver granted by planning authority', calculated_amount: 175000, payment_status: 'waived' },
  ],
})

// ---------------------------------------------------------------------------
// Second tower + units + an unclaimed booking, for builder-console testing
// ---------------------------------------------------------------------------
const towerA =
  (await prisma.towers.findFirst({ where: { project_id: project.id, name: 'Tower A' } })) ??
  (await prisma.towers.create({ data: { project_id: project.id, name: 'Tower A', total_floors: 15 } }))

const unit801 = await prisma.units.upsert({
  where: { tower_id_unit_number: { tower_id: towerA.id, unit_number: '801' } },
  update: {},
  create: { tower_id: towerA.id, unit_number: '801', floor: 8, unit_type: '3BHK', carpet_area_sqft: 1120 },
})
const unit802 = await prisma.units.upsert({
  where: { tower_id_unit_number: { tower_id: towerA.id, unit_number: '802' } },
  update: {},
  create: { tower_id: towerA.id, unit_number: '802', floor: 8, unit_type: '1BHK', carpet_area_sqft: 560 },
})

await prisma.bookings.upsert({
  where: { booking_code: 'SLAB-A801' },
  update: {},
  create: { unit_id: unit801.id, booking_code: 'SLAB-A801' },
})
await prisma.bookings.upsert({
  where: { booking_code: 'SLAB-A802' },
  update: {},
  create: { unit_id: unit802.id, booking_code: 'SLAB-A802' },
})

console.log('DONE seeding rich demo data.')
console.log('Extra unclaimed booking codes for testing signup: SLAB-A801, SLAB-A802')

await prisma.$disconnect()
