export const staffCategories = [
  {
    id: "TECHNICIAN",
    name: "Technicians",
    description: "Electrical, AV, equipment and technical services",
  },
  {
    id: "IT_SUPPORT",
    name: "IT support",
    description: "Devices, networks and school systems",
  },
  {
    id: "LAB_SUPPORT",
    name: "Laboratory support",
    description: "Lab preparation, equipment and practical sessions",
  },
  {
    id: "MAINTENANCE",
    name: "Maintenance",
    description: "Buildings, repairs and facilities",
  },
  {
    id: "HOUSEKEEPING",
    name: "Housekeeping",
    description: "Cleanliness and campus upkeep",
  },
  {
    id: "SECURITY",
    name: "Security",
    description: "Campus entry and safety services",
  },
  {
    id: "TRANSPORT",
    name: "Transport",
    description: "Drivers, attendants and transport operations",
  },
  {
    id: "OFFICE",
    name: "Office & administration",
    description: "Front office, accounts and administration",
  },
  {
    id: "LIBRARY",
    name: "Library support",
    description: "Library operations and learning resources",
  },
  {
    id: "HEALTHCARE",
    name: "Health & wellbeing",
    description: "School health and first aid support",
  },
  {
    id: "GENERAL",
    name: "Other support staff",
    description: "Other non-teaching campus services",
  },
  {
    id: "FACULTY",
    name: "Teaching faculty",
    description: "Academic and teaching colleagues",
  },
];
export function getStaffCategory(staff: any): string {
  if (staffCategories.some((category) => category.id === staff.staff_category))
    return staff.staff_category;
  if (["TEACHER", "FACULTY"].includes(staff.role)) return "FACULTY";
  const text =
    `${staff.designation || ""} ${staff.department || ""}`.toLowerCase();
  for (const [pattern, category] of [
    [/\bit\b|network|systems? admin|computer support/, "IT_SUPPORT"],
    [/laboratory|\blab\b/, "LAB_SUPPORT"],
    [/technician|electrician|av support|technical/, "TECHNICIAN"],
    [/maintenance|facilit|plumb|carpent/, "MAINTENANCE"],
    [/housekeep|clean|janitor/, "HOUSEKEEPING"],
    [/security|guard|safety officer/, "SECURITY"],
    [/transport|driver|bus attendant/, "TRANSPORT"],
    [/librar/, "LIBRARY"],
    [/nurse|health|medical|first aid/, "HEALTHCARE"],
    [/office|admin|account|reception|registrar|operations/, "OFFICE"],
  ] as const)
    if (pattern.test(text)) return category;
  return "GENERAL";
}
export function directoryEntry(staff: any) {
  return {
    id: staff.id,
    employeeId: staff.employee_id,
    fullName: staff.full_name,
    designation: staff.designation || "Staff member",
    department: staff.department || "General",
    category: getStaffCategory(staff),
    email: staff.email || "",
    phone: staff.phone || "",
    status: staff.status || "ACTIVE",
  };
}
