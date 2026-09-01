import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function createConfirmedUser(email, password, role, fullName, companyName) {
  const rawUserMeta = JSON.stringify({ role, full_name: fullName, ...(companyName ? { company_name: companyName } : {}) })
  const rows = await prisma.$queryRawUnsafe(
    `insert into auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token
     ) values (
       '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb, now(), now(),
       '', '', '', '', '', ''
     ) returning id`,
    email, password, rawUserMeta
  )
  const userId = rows[0].id
  await prisma.$executeRawUnsafe(
    `insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values (gen_random_uuid(), $1::uuid::text, $1::uuid, jsonb_build_object('sub', $1::text, 'email', $2), 'email', now(), now(), now())`,
    userId, email
  )
  return userId
}

const builderEmail = 'prathamesh.meraki2025+demobuilder@gmail.com'
const customerEmail = 'prathamesh.meraki2025+democustomer@gmail.com'
const password = 'Sankalp@123'

const builderUserId = await createConfirmedUser(builderEmail, password, 'builder_admin', 'Rohan Mehta', 'Skyline Developers Pvt. Ltd.')
console.log('builder user id:', builderUserId)

const builder = await prisma.builders.findUnique({ where: { owner_profile_id: builderUserId } })

const project = await prisma.projects.create({
  data: {
    builder_id: builder.id,
    name: 'Skyline Heights',
    city: 'Pune',
    address: 'Baner Road, Pune',
    rera_registration_number: 'P52100098765',
    rera_registered_name: 'Skyline Heights',
    rera_status: 'active',
    rera_certificate_url: 'https://maharera.mahaonline.gov.in/example-cert',
  },
})

const tower = await prisma.towers.create({ data: { project_id: project.id, name: 'Tower B', total_floors: 20 } })
const unit = await prisma.units.create({
  data: { tower_id: tower.id, unit_number: '1204', floor: 12, unit_type: '2BHK', carpet_area_sqft: 850 },
})

await prisma.construction_milestones.create({
  data: { project_id: project.id, tower_id: tower.id, title: '14th floor slab cast', percent_complete: 68, status: 'on_schedule' },
})
await prisma.drawings.create({
  data: { project_id: project.id, tower_id: tower.id, title: 'Floor Plan - Tower B, 14th Floor', drawing_type: 'floor_plan', file_url: 'https://example.com/drawings/tower-b-14f.pdf' },
})
await prisma.quality_checks.create({
  data: { project_id: project.id, tower_id: tower.id, checklist_item: 'Concrete cube test - M25 grade', result: 'pass', inspector_name: 'R. Deshmukh' },
})
await prisma.material_consumption.create({
  data: { project_id: project.id, tower_id: tower.id, material_name: 'Cement (OPC 53)', quantity: 450, unit: 'bags' },
})

const reraReq = await prisma.compliance_requirements.findUnique({ where: { code: 'RERA_REGISTRATION' } })
await prisma.compliance_records.create({
  data: { project_id: project.id, requirement_id: reraReq.id, status: 'approved', reference_number: 'P52100098765' },
})
await prisma.premium_calculations.create({
  data: { project_id: project.id, premium_type: 'Fungible FSI Premium', calculation_basis: '10% of ready reckoner rate x fungible area', calculated_amount: 1250000, payment_status: 'pending' },
})

const bookingCode = 'SLAB-DEMO'
await prisma.bookings.create({ data: { unit_id: unit.id, booking_code: bookingCode } })

const customerUserId = await createConfirmedUser(customerEmail, password, 'customer', 'Asha Rao', null)
console.log('customer user id:', customerUserId)

await prisma.bookings.updateMany({
  where: { booking_code: bookingCode, customer_profile_id: null },
  data: { customer_profile_id: customerUserId },
})

console.log('DONE')
console.log('BUILDER_EMAIL:', builderEmail)
console.log('CUSTOMER_EMAIL:', customerEmail)
console.log('PASSWORD:', password)

await prisma.$disconnect()
