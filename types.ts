
export enum ProjectStatus {
  LEAD = 'Potensial',
  SURVEY = 'Survei Lokasi',
  QUOTATION = 'Pengajuan Harga',
  NEGOTIATION = 'Negosiasi',
  DEAL = 'Deal / Kontrak',
  CONSTRUCTION = 'Konstruksi',
  COMMISSIONING = 'Uji Coba',
  MAINTENANCE = 'Maintenance'
}

export interface ProjectFinancials {
  materialCost: number;
  laborCost: number;
  operationalCost: number; // Transport, Meals
  agreedValue: number;
  invoiced: number;
  paid: number;
}

export interface ScheduleTask {
  id: string;
  name: string;
  weekStart: number;
  durationWeeks: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  progress: number; // 0-100
  dependencies?: string[]; // New: List of Task IDs that must complete first
}

export interface RiskAssessment {
    score: number; // 0-100 (100 is high risk)
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    analysis: string;
    factors: string[];
    mitigationSuggestions: string[];
    lastUpdated: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Project {
  id: string;
  clientName: string;
  projectType: string; // e.g., 'Residential', 'Commercial', 'Government'
  location: string;
  coordinates?: Coordinates; // New: For Map
  capacityKWp: number;
  status: ProjectStatus;
  progress: number;
  lastUpdate: string;
  startDate?: string;
  endDate?: string;
  financials: ProjectFinancials;
  assignedManpowerIds: string[];
  schedule: ScheduleTask[];
  riskAssessment?: RiskAssessment;
  projectPlan?: string; // Base64 of PDF/DOCX
  planAnalysis?: string; // AI Analysis of the plan
  notes: string;
}

export interface Certification {
    name: string;
    issuer: string;
    expiryDate: string;
}

export interface WorkerDocument {
    id: string;
    name: string; // KTP, SIM, Sertifikat
    type: 'Image' | 'PDF';
    url?: string; // Base64
}

export interface AttendanceRecord {
    date: string;
    status: 'Present' | 'Absent' | 'Sick' | 'Leave';
}

export interface Manpower {
  id: string;
  name: string;
  role: string;
  status: 'Available' | 'On-Site' | 'Off-Duty';
  coordinates?: Coordinates; // New: For Map
  skills: string[];
  certifications?: Certification[];
  documents?: WorkerDocument[]; 
  attendanceHistory?: AttendanceRecord[]; 
  dailyRate: number;
  currentProjectId?: string;
  performanceScore: number; // 0-100
  projectsCompleted: number;
  phone?: string;
  joinDate?: string;
  attendanceDaysThisMonth: number;
  totalEarnedThisMonth: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isAi?: boolean;
  channel: 'Management' | 'Manpower-Group' | 'General' | 'Sales';
  attachment?: string; // Base64 string
  attachmentType?: 'image' | 'document' | 'video' | 'audio';
  attachmentName?: string;
  downloadableReport?: {
      title: string;
      content: string;
  };
  feedback?: 'positive' | 'negative' | 'retrain';
  feedbackReason?: 'correctness' | 'tone' | 'detail'; // New: Granular Feedback
  modelUsed?: string; // New: Track which model generated the response
  
  // New AI Features
  groundingMetadata?: {
      searchQuery?: string;
      webSources?: { title: string; url: string }[];
      mapSources?: { title: string; address: string; url: string }[];
  };
  thinkingLog?: string; // Content of the thinking process (Gemini 2.5/3.0)
  audioResponse?: string; // Base64 Audio data for TTS
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email?: string;
    category: string; // e.g. "Panels", "Inverters"
    rating: number; // 1-5
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Solar Panel' | 'Inverter' | 'Cable' | 'Mounting' | 'Accessories' | 'Tools' | 'Safety';
  stock: number;
  unit: string;
  minStock: number;
  location: string;
  pricePerUnit: number;
  lastUpdated?: string;
  supplierId?: string; // Link to Supplier
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  amount: number;
  date: string;
  notes: string;
  PIC: string;
}

export interface StorageFile {
  id: string;
  name: string;
  type: 'Image' | 'Document' | 'Contract';
  data?: string; // Base64 data for real storage
  date: string;
  size: number; // in bytes
  projectId?: string;
}

export interface SolarCalculation {
  capacity: number;
  systemPrice: number;
  pricePerKwp: number;
  roiYears: number;
  monthlySaving: number;
  materialCost: number;
  laborCost: number;
  margin: number;
  analysis?: string;
  // New Hybrid Fields
  batteryCapacityAh?: number;
  totalBatteries?: number;
  autonomyDays?: number;
  inverterType?: string;
}

export interface WiringCalculation {
    targetKWp: number;
    panelWattage: number; // e.g. 550
    inverterCapacity: number; // e.g. 5000 (5kW)
    totalPanels: number;
    totalInverters: number;
    stringConfig: string;
    estimatedCableDC: number; // meters
}

export interface CompanySettings {
    companyName: string;
    baseCurrency: string;
    taxRate: number;
    logoUrl?: string;
    plnRate?: number; // Real-time tracker
    activeAIModules?: string[];
}

export interface WeatherData {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    location: string;
}

// --- NEW MODULE TYPES ---

export interface SafetyIncident {
    id: string;
    date: string;
    type: 'Near Miss' | 'Minor Injury' | 'Equipment Damage' | 'Hazard';
    description: string;
    status: 'Open' | 'Resolved';
    projectId?: string;
}

export interface TrainingCourse {
    id: string;
    title: string;
    description: string;
    durationHours: number;
    mandatoryForRole?: string[];
    enrolledManpowerIds: string[];
}

export interface AutomationConfig {
    enabled: boolean;
    schedule: 'Daily' | 'Weekly' | 'Event';
    triggerEvent?: string; // e.g., 'New Project', 'Safety Incident'
    lastRun?: string;
}

export interface FeedbackStats {
    positive: number;
    negative: number;
    lastComment?: string;
}

export interface AIModule {
    id: string;
    name: string;
    category: 'Operational' | 'Financial' | 'Technical' | 'Legal' | 'HR' | 'Safety';
    description: string;
    status: 'Active' | 'Inactive';
    icon: string;
    version: string;
    automation?: AutomationConfig;
    feedback?: FeedbackStats;
}

export interface LiveSessionConfig {
    videoEnabled: boolean;
    voiceName: string; // 'Zephyr', 'Puck', etc.
}
