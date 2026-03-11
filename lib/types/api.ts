// ─── Shared ──────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
// GET /driver/driver-dashboard → DriverStatsProfile

export interface DriverStatsProfile {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    imageUrl: string | null;
    approvalStatus: string;
    availabilityStatus: string;
    isActive: boolean;
    createdAt: string;
    postcode: string;
    balance: string | null;
  };
  driver: {
    id: number;
    phoneNumber: string;
    approvalStatus: string;
    availabilityStatus: string;
    createdAt: string;
    postcode: string;
    balance: string | null;
  };
  ratings: {
    count: number;
    averageRating: number | null;
    completedJobs: number;
  };
  reviews: DriverReview[];
}

export interface DriverReview {
  rating: number;
  feedback: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    imageUrl: string | null;
  };
}

// ─── Profile ─────────────────────────────────────────────────────────────────
// GET /driver/profile → DriverProfile

export interface DriverProfile {
  id: number;
  authId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  driver: {
    id: number;
    phoneNumber: string;
    vehicleType: string | null;
    maxWeight: number | null;
    agreedTerms: boolean;
    availabilityStatus: string;
    approvalStatus: string;
    vehicleRegistration: string | null;
    licenseNumber: string | null;
    serviceRadius: number | null;
    postcode: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    address1: string | null;
    organizationName: string | null;
    isTowDriver: boolean;
    isMechanic: boolean;
    balance: string | null;
    profileDescription: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// ─── Assigned Requests (list) ─────────────────────────────────────────────────
// GET /driver/assigned-requests → PaginatedResponse<AssignedRequest>
// Flat structure (all fields at top level)

export interface AssignedRequest {
  id: number;
  requestId: number;
  driverStatus: string;
  userStatus: string | null;
  estimation: string | null;
  explanation: string | null;
  updatedAt: string;
  createdAt: string;
  // Request/job fields (flattened)
  address: string | null;
  toAddress: string | null;
  postCode: string | null;
  toPostCode: string | null;
  description: string | null;
  regNo: string | null;
  make: string | null;
  makeModel: string | null;
  firstName: string | null;   // customer first name
  lastName: string | null;    // customer last name
  mobileNumber: string | null;
  requestType: string | null;
  status: string;
  isCompleted: boolean;
  isJobConfirmed: boolean;
  userLocationLat: number | null;
  userLocationLng: number | null;
}

// ─── Assigned Request Detail ──────────────────────────────────────────────────
// GET /driver/assigned-request/:requestId → AssignedRequestDetail
// Nested structure returned by getSpecificDriverRequestWithInfo

export interface AssignedRequestDetail {
  id: number;
  requestId: number;
  driverStatus: string;
  userStatus: string | null;
  estimation: string | null;
  explanation: string | null;
  updatedAt: string;
  createdAt: string;
  isCompleted: boolean;
  isJobConfirmed: boolean;
  address: string | null;
  toAddress: string | null;
  postCode: string | null;
  toPostCode: string | null;
  closedAt: string | null;
  closedBy: string | null;
  requestStatus: string;
  userRequest: {
    id: number;
    status: string;
    description: string | null;
    regNo: string | null;
    make: string | null;
    makeModel: string | null;
    mobileNumber: string | null;
    requestType: string | null;
    address: string | null;
    postCode: string | null;
    toAddress: string | null;
    toPostCode: string | null;
    deliveryDistance: number | null;
    weight: number | null;
    numberOfPassengers: number | null;
  };
  customer: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    mobileNumber: string | null;
    imageUrl: string | null;
  };
  driver: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    vehicleType: string | null;
    vehicleRegistration: string | null;
    phoneNumber: string | null;
  };
}

// ─── Quote ───────────────────────────────────────────────────────────────────

export interface QuoteSubmission {
  estimation: number;
  explanation: string;
  vehicleNo: string;
  driverStatus: 'QUOTED';
}
