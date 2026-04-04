export type UserRole = 'farmer' | 'lab' | 'processor' | 'manufacturer' | 'distributor' | 'retailer' | 'admin';

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  organization: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'farmer-1', name: 'Rajesh Kumar', role: 'farmer', email: 'rajesh@keralacoop.org', organization: 'Kerala Ashwagandha Growers Collective' },
  { id: 'lab-1', name: 'Dr. Priya Nair', role: 'lab', email: 'priya@ayurtestlabs.in', organization: 'AyurTest Labs' },
  { id: 'proc-1', name: 'Anand Menon', role: 'processor', email: 'anand@herbcraft.in', organization: 'HerbCraft Processing' },
  { id: 'mfg-1', name: 'Lakshmi Devi', role: 'manufacturer', email: 'lakshmi@vedicwellness.com', organization: 'Vedic Wellness Pvt. Ltd.' },
  { id: 'admin-1', name: 'Suresh Pillai', role: 'admin', email: 'suresh@ayushministry.gov.in', organization: 'AYUSH Ministry' },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  farmer: 'Farmer / Collector',
  lab: 'Lab Technician',
  processor: 'Processor',
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  retailer: 'Retailer',
  admin: 'Admin / Regulator',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  farmer: 'bg-sage-100 text-sage-700',
  lab: 'bg-info/10 text-info',
  processor: 'bg-terra-100 text-terra-700',
  manufacturer: 'bg-amber-100 text-amber-800',
  distributor: 'bg-blue-100 text-blue-800',
  retailer: 'bg-purple-100 text-purple-800',
  admin: 'bg-muted text-foreground',
};

export interface CollectionEvent {
  id: string;
  batchId: string;
  species: string;
  quantity: number;
  unit: string;
  lat: number;
  lng: number;
  collectorId: string;
  collectorName: string;
  date: string;
  quality: 'excellent' | 'good' | 'fair';
  weather: string;
  temperature: number;
  status: 'synced' | 'pending';
  txHash?: string;
}

export interface LabTest {
  id: string;
  batchId: string;
  testType: string;
  result: string;
  status: 'pass' | 'fail' | 'pending';
  technicianId: string;
  date: string;
  txHash?: string;
}

export interface ProcessingStep {
  id: string;
  batchId: string;
  stage: string;
  startDate: string;
  endDate?: string;
  temperature?: number;
  humidity?: number;
  facilityId: string;
  status: 'in-progress' | 'completed';
  txHash?: string;
}

export interface Product {
  id: string;
  name: string;
  batchId: string;
  herbs: { name: string; ratio: number }[];
  dosage: string;
  mfgDate: string;
  expDate: string;
  qrCode: string;
  status: 'active' | 'recalled';
  txHash?: string;
}

export const DEMO_COLLECTIONS: CollectionEvent[] = [
  { id: 'col-1', batchId: 'ASHW-2026-001', species: 'Ashwagandha (Withania somnifera)', quantity: 25, unit: 'kg', lat: 10.5276, lng: 76.2144, collectorId: 'farmer-1', collectorName: 'Rajesh Kumar', date: '2026-03-15', quality: 'excellent', weather: 'Sunny', temperature: 28, status: 'synced', txHash: '0xa1b2c3d4e5f6…' },
  { id: 'col-2', batchId: 'ASHW-2026-002', species: 'Ashwagandha (Withania somnifera)', quantity: 18, unit: 'kg', lat: 10.5190, lng: 76.2050, collectorId: 'farmer-1', collectorName: 'Rajesh Kumar', date: '2026-03-20', quality: 'good', weather: 'Cloudy', temperature: 26, status: 'synced', txHash: '0xf6e5d4c3b2a1…' },
  { id: 'col-3', batchId: 'TULSI-2026-001', species: 'Tulsi (Ocimum tenuiflorum)', quantity: 12, unit: 'kg', lat: 10.5300, lng: 76.2200, collectorId: 'farmer-1', collectorName: 'Rajesh Kumar', date: '2026-03-28', quality: 'excellent', weather: 'Sunny', temperature: 30, status: 'pending' },
];

export const DEMO_TESTS: LabTest[] = [
  { id: 'test-1', batchId: 'ASHW-2026-001', testType: 'DNA Barcoding', result: 'Confirmed Withania somnifera', status: 'pass', technicianId: 'lab-1', date: '2026-03-18', txHash: '0x1234abcd…' },
  { id: 'test-2', batchId: 'ASHW-2026-001', testType: 'Heavy Metals', result: 'Below limits (Pb: 0.02ppm)', status: 'pass', technicianId: 'lab-1', date: '2026-03-18', txHash: '0x5678efgh…' },
  { id: 'test-3', batchId: 'ASHW-2026-001', testType: 'Pesticide Residue', result: 'Not detected', status: 'pass', technicianId: 'lab-1', date: '2026-03-19', txHash: '0x9abcdef0…' },
  { id: 'test-4', batchId: 'ASHW-2026-002', testType: 'Moisture Content', result: '8.2%', status: 'pass', technicianId: 'lab-1', date: '2026-03-23' },
  { id: 'test-5', batchId: 'TULSI-2026-001', testType: 'DNA Barcoding', result: 'Pending analysis', status: 'pending', technicianId: 'lab-1', date: '2026-04-01' },
];

export const DEMO_PROCESSING: ProcessingStep[] = [
  { id: 'proc-1', batchId: 'ASHW-2026-001', stage: 'Drying', startDate: '2026-03-20', endDate: '2026-03-23', temperature: 45, humidity: 15, facilityId: 'FAC-HC-01', status: 'completed', txHash: '0xaaaa1111…' },
  { id: 'proc-2', batchId: 'ASHW-2026-001', stage: 'Grinding', startDate: '2026-03-24', endDate: '2026-03-24', temperature: 22, humidity: 40, facilityId: 'FAC-HC-01', status: 'completed', txHash: '0xbbbb2222…' },
  { id: 'proc-3', batchId: 'ASHW-2026-001', stage: 'Storage', startDate: '2026-03-25', temperature: 20, humidity: 35, facilityId: 'FAC-HC-02', status: 'in-progress' },
  { id: 'proc-4', batchId: 'ASHW-2026-002', stage: 'Drying', startDate: '2026-03-25', temperature: 44, humidity: 16, facilityId: 'FAC-HC-01', status: 'in-progress' },
];

export const DEMO_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'AshwaVital Capsules', batchId: 'VW-AVC-2026-001', herbs: [{ name: 'Ashwagandha', ratio: 85 }, { name: 'Black Pepper', ratio: 10 }, { name: 'Ginger', ratio: 5 }], dosage: '500mg x 60 capsules', mfgDate: '2026-03-28', expDate: '2028-03-28', qrCode: 'ASHVITAL-001-2026', status: 'active', txHash: '0xcccc3333…' },
];

export const JOURNEY_DATA = {
  productName: 'AshwaVital Capsules',
  batchId: 'VW-AVC-2026-001',
  manufacturer: 'Vedic Wellness Pvt. Ltd.',
  authenticityScore: 98,
  steps: [
    { title: 'Harvested', date: '2026-03-15', location: 'Thrissur, Kerala', actor: 'Rajesh Kumar', org: 'Kerala Ashwagandha Growers Collective', details: 'Wild-harvested Ashwagandha roots, 25kg', lat: 10.5276, lng: 76.2144, icon: 'leaf', verified: true },
    { title: 'Lab Tested', date: '2026-03-18', location: 'Kochi, Kerala', actor: 'Dr. Priya Nair', org: 'AyurTest Labs', details: 'DNA Barcoding ✓ | Heavy Metals ✓ | Pesticides ✓', lat: 9.9312, lng: 76.2673, icon: 'flask', verified: true },
    { title: 'Processed', date: '2026-03-20 – 03-25', location: 'Ernakulam, Kerala', actor: 'Anand Menon', org: 'HerbCraft Processing', details: 'Dried at 45°C → Ground to fine powder', lat: 10.0, lng: 76.3, icon: 'factory', verified: true },
    { title: 'Manufactured', date: '2026-03-28', location: 'Thiruvananthapuram, Kerala', actor: 'Lakshmi Devi', org: 'Vedic Wellness Pvt. Ltd.', details: '500mg capsules, 60 per bottle', lat: 8.5241, lng: 76.9366, icon: 'package', verified: true },
  ],
};
