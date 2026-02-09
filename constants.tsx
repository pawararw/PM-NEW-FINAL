import { PMItem } from './types';

export const DEPARTMENTS = [
  'Maintenance / ซ่อมบำรุง', 
  'Safety / จป.', 
  'Packing / บรรจุ', 
  'QA/QC', 
  'Plating / ชุบ', 
  'Store Inventory / คลังสินค้า', 
  'Wax setting / เซ็ตเทียน', 
  'Wax / ฉีดเทียน', 
  'Polishing / ขัด', 
  'Factory Manager / ผจก.โรงงาน', 
  'Executive Secretary / เลขาฯ', 
  'Accounting / บัญชี', 
  'Import Export / นำเข้า-ส่งออก', 
  'Purchasing / จัดซื้อ', 
  'IT / ไอที', 
  'HR Sup.', 
  'HR admin',
  'Others / อื่นๆ'
];

export const DEVICE_STATUS_OPTIONS = [
  'Ready / ใช้งานได้ปกติ (In Use / กำลังใช้งาน)',
  'Ready / ใช้งานได้ปกติ (Standby / ไม่ได้ใช้งาน)',
  'Broken / เสียกำลังซ่อม (Under Repair)'
];

export const COMPUTER_STANDARD_ACTIVITIES = [
  "Hardware Check / ตรวจสอบฮาร์ดแวร์ (6M)",
  "OS Update / ระบบปฏิบัติการ (6M)",
  "Security Scan / ความปลอดภัย (6M)",
  "Performance Tuning / ประสิทธิภาพ (6M)",
  "Data Backup / สำรองข้อมูล (6M)",
  "Network Testing / ระบบเครือข่าย (6M)",
  "Cleanup Junk Files / ไฟล์ขยะ (6M)"
];

export const PRINTER_STANDARD_ACTIVITIES = [
  "Usage Check / ตรวจสอบการใช้งาน (2M)",
  "External Cleaning / ทำความสะอาดภายนอก (2M)",
  "Roller Check / ตรวจสอบลูกล้อ (2M)",
  "Nozzle Check / ตรวจสอบหัวพิมพ์ (2M)",
  "Head Alignment / จัดตำแหน่งหัวพิมพ์ (2M)",
  "Firmware Update / อัปเดตเฟิร์มแวร์ (2M)",
  "Internal Cleaning / ทำความสะอาดภายใน (2M)",
  "Overall Condition / สภาพโดยรวม (2M)",
  "Consumables / วัสดุสิ้นเปลือง (2M)"
];

export const INITIAL_PM_DATA: PMItem[] = [
  { 
    id: 'PM-001', 
    date: '2025-01-15', 
    nextPmDate: '2025-07-14', 
    department: 'Maintenance / ซ่อมบำรุง', 
    device: 'Computer', 
    personnel: 'User 1', 
    status: 'Completed', 
    deviceStatus: 'Ready / ใช้งานได้ปกติ (In Use / กำลังใช้งาน)',
    activity: 'Hardware Check / ตรวจสอบฮาร์ดแวร์ (6M) | OS Update / ระบบปฏิบัติการ (6M)', 
    computerName: 'MT-PC-01', 
    computerUser: 'Administrator', 
    password: '', 
    serverPassword: '', 
    antivirus: '' 
  },
  { 
    id: 'PRT-001', 
    date: '2025-02-15', 
    nextPmDate: '2025-04-16', 
    department: 'Accounting / บัญชี', 
    device: 'Printer', 
    personnel: 'Accounting Staff', 
    status: 'Pending', 
    deviceStatus: 'Ready / ใช้งานได้ปกติ (Standby / ไม่ได้ใช้งาน)',
    activity: '', 
    computerName: 'ACC-PRT-01', 
    computerUser: 'Administrator', 
    password: '', 
    serverPassword: '', 
    antivirus: '' 
  },
];