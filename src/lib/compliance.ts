import type { ComplianceCalendarItem } from "./types";
export const MOCK_COMPLIANCE: Partial<ComplianceCalendarItem>[] = [
  {
    id: "1",
    title: "VAT Return Submission Q4",
    companyId: "Acme Corp",
    serviceCategory: "Tax",
    dueDate: "2024-02-15",
    frequency: "YEARLY"
  },
  {
    id: "2",
    title: "Annual General Meeting Minutes",
    companyId: "Global Trade Hub",
    serviceCategory: "Corporate",
    dueDate: "2024-01-20",
    frequency: "YEARLY"
  },
  {
    id: "3",
    title: "Internal Audit Review",
    companyId: "Nexus AI Research",
    serviceCategory: "Audit",
    dueDate: "2024-03-01",
    frequency: "YEARLY"
  },
  {
    id: "4",
    title: "Business License Renewal",
    companyId: "Acme Corp",
    serviceCategory: "Legal",
    dueDate: "2023-12-15",
  },
  {
    id: "5",
    title: "Corporate Income Tax Return",
    companyId: "Mediterranean Hospitality",
    serviceCategory: "Tax",
    dueDate: "2024-06-30",
  }
];