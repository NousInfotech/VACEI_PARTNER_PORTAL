import type { ComplianceItem } from "./types";
export const MOCK_COMPLIANCE: ComplianceItem[] = [
  {
    id: "1",
    title: "VAT Return Submission Q4",
    companyName: "Acme Corp",
    category: "Tax",
    dueDate: "2024-02-15",
    status: "PENDING"
  },
  {
    id: "2",
    title: "Annual General Meeting Minutes",
    companyName: "Global Trade Hub",
    category: "Corporate",
    dueDate: "2024-01-20",
    status: "COMPLETED"
  },
  {
    id: "3",
    title: "Internal Audit Review",
    companyName: "Nexus AI Research",
    category: "Audit",
    dueDate: "2024-03-01",
    status: "PENDING"
  },
  {
    id: "4",
    title: "Business License Renewal",
    companyName: "Acme Corp",
    category: "Legal",
    dueDate: "2023-12-15",
    status: "OVERDUE"
  },
  {
    id: "5",
    title: "Corporate Income Tax Return",
    companyName: "Mediterranean Hospitality",
    category: "Tax",
    dueDate: "2024-06-30",
    status: "PENDING"
  }
];