// src/models/vehicle.js
// Frontend helpers for the Vehicle Add/Edit form

// Enums used by selects in the form
export const VEHICLE_TYPES = [
  "Small Truck",
  "Medium Truck",
  "Large Truck",
  "Van",
];

export const VEHICLE_STATUSES = [
  "Active",
  "Inactive",
  "Maintenance",
  "Out of Service",
];

export const FUEL_TYPES = [
  "Diesel",
  "Petrol",
  "Electric",
  "Hybrid",
];

export const MAINTENANCE_STATUSES = [
  "Good",
  "Service Due",
  "Needs Repair",
  "In Service",
];

// Default form state for creating a new vehicle
export function createDefaultVehicleForm() {
  return {
    vehicleId: "",
    type: "Medium Truck",
    capacityBottles: "",
    capacityWeight: "",
    // specs
    model: "",
    licensePlate: "",
    color: "",
    // status
    status: "Active",
    // fuel
    fuelLevel: 100,
    fuelType: "Diesel",
    // maintenance
    maintenanceStatus: "Good",
  };
}

// Validate the form. Returns { valid, errors }
export function validateVehicleForm(form) {
  const errors = {};

  // vehicleId required (letters/numbers/-/_ 2-20)
  if (!form.vehicleId || !String(form.vehicleId).trim()) {
    errors.vehicleId = "Vehicle ID is required";
  } else if (!/^[A-Za-z0-9-_]{2,20}$/.test(String(form.vehicleId).trim())) {
    errors.vehicleId = "Vehicle ID must be 2-20 chars (letters, numbers, - or _)";
  }

  // type enum
  if (!VEHICLE_TYPES.includes(form.type)) {
    errors.type = "Invalid vehicle type";
  }

  // capacity positive numbers
  const bottles = Number(form.capacityBottles);
  const weight = Number(form.capacityWeight);
  if (!(bottles > 0)) errors.capacityBottles = "Capacity (bottles) must be > 0";
  if (!(weight > 0)) errors.capacityWeight = "Capacity (weight) must be > 0";

  // status enum
  if (!VEHICLE_STATUSES.includes(form.status)) {
    errors.status = "Invalid status";
  }

  // fuel
  const fuelLevel = Number(form.fuelLevel);
  if (!(fuelLevel >= 0 && fuelLevel <= 100)) {
    errors.fuelLevel = "Fuel level must be 0-100";
  }
  if (!FUEL_TYPES.includes(form.fuelType)) {
    errors.fuelType = "Invalid fuel type";
  }

  // maintenance status enum
  if (!MAINTENANCE_STATUSES.includes(form.maintenanceStatus)) {
    errors.maintenanceStatus = "Invalid maintenance status";
  }

  // optional fields simple limits
  if (form.licensePlate && String(form.licensePlate).length > 15) {
    errors.licensePlate = "License plate is too long";
  }
  if (form.color && String(form.color).length > 20) {
    errors.color = "Color is too long";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// Map form state to backend payload (TransportModel Vehicle schema)
export function mapFormToVehiclePayload(form) {
  return {
    vehicleId: form.vehicleId,
    type: form.type,
    capacity: {
      bottles: Number(form.capacityBottles) || 0,
      weight: Number(form.capacityWeight) || 0,
    },
    specifications: {
      model: form.model || undefined,
      licensePlate: form.licensePlate || undefined,
      color: form.color || undefined,
    },
    status: form.status,
    fuel: {
      level: Number(form.fuelLevel) || 0,
      fuelType: form.fuelType,
    },
    maintenance: {
      status: form.maintenanceStatus,
    },
  };
}

// Map backend document to form for Edit
export function mapVehicleDocToForm(doc) {
  return {
    vehicleId: doc.vehicleId || "",
    type: doc.type || "Medium Truck",
    capacityBottles: doc.capacity?.bottles ?? "",
    capacityWeight: doc.capacity?.weight ?? "",
    model: doc.specifications?.model || "",
    licensePlate: doc.specifications?.licensePlate || "",
    color: doc.specifications?.color || "",
    status: doc.status || "Active",
    fuelLevel: doc.fuel?.level ?? 100,
    fuelType: doc.fuel?.fuelType || "Diesel",
    maintenanceStatus: doc.maintenance?.status || "Good",
  };
}
