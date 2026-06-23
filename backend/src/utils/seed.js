require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

// ✅ CORRECT LD College of Engineering coordinates
// Boundary corners from Google Maps:
// NW: 23.035306, 72.544258
// NE: 23.035728, 72.548643
// SE: 23.031532, 72.549807
// SW: 23.031288, 72.544277

const CAMPUS_BUILDINGS = [
  // Derived from Google Maps image — real LDCE building positions
  { name: 'Main Block (Admin)',       lat: 23.03327, lng: 72.54720 },
  { name: 'Civil Engineering Dept.',  lat: 23.03448, lng: 72.54680 },
  { name: 'Civil Drawing Hall',       lat: 23.03390, lng: 72.54730 },
  { name: 'Chemical Engineering',     lat: 23.03360, lng: 72.54490 },
  { name: 'LD College Ground',        lat: 23.03460, lng: 72.54500 },
  { name: 'Overhead Water Tank',      lat: 23.03270, lng: 72.54510 },
  { name: 'Anexee Building',          lat: 23.03240, lng: 72.54540 },
  { name: 'Block-8',                  lat: 23.03200, lng: 72.54550 },
  { name: 'Hostel Block-A',           lat: 23.03170, lng: 72.54780 },
  { name: 'Hostel Block-B',           lat: 23.03155, lng: 72.54640 },
  { name: 'LD College Canteen',       lat: 23.03225, lng: 72.54730 },
  { name: 'Rector Bunglow',           lat: 23.03130, lng: 72.54600 },
  { name: 'Building 2',               lat: 23.03370, lng: 72.54830 },
  { name: 'Lalbhai Dalpatbhai Block', lat: 23.03280, lng: 72.54740 },
];

const CATEGORIES  = ['Electrical','Plumbing','WiFi','Hostel','Cleanliness','Furniture','Security','Classroom','Laboratory','Other'];
const PRIORITIES  = ['Low','Medium','High','Emergency'];
const STATUSES    = ['Pending','In Progress','Resolved'];
const DEPARTMENTS = ['Computer Science','Mechanical','Electrical','Civil','IT'];

const SAMPLE_TITLES = [
  'Broken light fixture in corridor','Water leakage from ceiling','WiFi not working in room',
  'Damaged bed frame','Garbage not collected','Broken chair in classroom','CCTV camera not working',
  'AC not functioning','Lab equipment damaged','Electrical short circuit',
  'Blocked drain in washroom','Internet very slow','Hostel gate lock broken',
  'Dustbins overflowing','Classroom projector not working','Security light broken',
  'Water cooler not cold','Table fan broken','Lab tap leaking','Noisy generator',
];

// Random point inside the LDCE polygon boundary
function randomInBounds() {
  // Boundary: NW(23.035306,72.544258) NE(23.035728,72.548643) SE(23.031532,72.549807) SW(23.031288,72.544277)
  const minLat = 23.0313, maxLat = 23.0357;
  const minLng = 72.5443, maxLng = 72.5497;
  return {
    lat: parseFloat((minLat + Math.random() * (maxLat - minLat)).toFixed(6)),
    lng: parseFloat((minLng + Math.random() * (maxLng - minLng)).toFixed(6)),
  };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await User.deleteMany({});
  await Complaint.deleteMany({});
  console.log('🗑️  Cleared existing data');

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@campus.edu',
    password: 'password123',
    role: 'admin',
    department: 'Administration',
  });
  console.log(`✅ Admin created: ${admin.email}`);

  const students = [];
  for (let i = 1; i <= 10; i++) {
    students.push(await User.create({
      name: `Student ${i}`,
      email: `student${i}@campus.edu`,
      password: 'password123',
      role: 'student',
      department: DEPARTMENTS[i % DEPARTMENTS.length],
    }));
  }
  console.log(`✅ ${students.length} students created`);

  const complaints = [];
  for (let i = 0; i < 50; i++) {
    const building = CAMPUS_BUILDINGS[i % CAMPUS_BUILDINGS.length];
    // Add small random offset to building position (still inside campus)
    const jitter = randomInBounds();
    const coords = {
      lat: parseFloat((building.lat + (Math.random() - 0.5) * 0.0008).toFixed(6)),
      lng: parseFloat((building.lng + (Math.random() - 0.5) * 0.0008).toFixed(6)),
    };
    complaints.push({
      title: `${SAMPLE_TITLES[i % SAMPLE_TITLES.length]} #${i + 1}`,
      description: `Detailed description for complaint ${i + 1}. This issue needs attention in the ${building.name} area at LDCE. It has been affecting students and staff.`,
      category: CATEGORIES[i % CATEGORIES.length],
      building: building.name,
      coordinates: coords,
      priority: PRIORITIES[i % PRIORITIES.length],
      status: STATUSES[i % STATUSES.length],
      submittedBy: students[i % students.length]._id,
      assignedAdmin: i % 3 === 0 ? admin._id : null,
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
    });
  }

  await Complaint.insertMany(complaints);
  console.log(`✅ 50 complaints seeded inside LDCE boundary`);
  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:   admin@campus.edu / password123');
  console.log('Student: student1@campus.edu / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
