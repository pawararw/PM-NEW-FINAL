
export interface PMItem {
  // A-O (Indices 0-14)
  id: string;               // A: ID
  date: string;             // B: Last PM Date
  nextPmDate?: string;      // C: Next PM Date
  department: string;       // D: Department
  device: 'Computer' | 'Printer'; // E: Category
  personnel: string;        // F: Personnel/User
  status: 'Completed' | 'In Progress' | 'Pending'; // G: Status
  activity?: string;        // H: PM Activities (Checklist)
  computerName?: string;    // I: Hostname
  computerUser?: string;    // J: Login Account
  password?: string;        // K: Machine Password
  serverPassword?: string;  // L: Server Password
  antivirus?: string;       // M: Antivirus Info
  imageUrl?: string;        // N: Image URL (Base64 or Cloud Link)
  technician?: string;      // O: Technician Name
  
  // P-V (Indices 15-21)
  startDate?: string;       // P: Start Date
  warrantyExpiry?: string;  // Q: Warranty Expiration
  spareField?: string;      // R: Notes / Spare Parts
  assetName?: string;       // S: Asset Name
  model?: string;           // T: Spec / Model
  serialNumber?: string;    // U: Serial Number
  location?: string;        // V: Physical Location

  // UI Only
  deviceStatus?: string; 
}

export interface DeptWorkload {
  name: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  count: number;
}

export interface MonthlySummary {
  month: string;
  count: number;
  completion: number;
  note: string;
}
