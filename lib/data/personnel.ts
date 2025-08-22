/**
 * Personnel data for assignment dropdown
 * In a real application, this would come from an API or database
 */

export interface SecurityPersonnel {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'available' | 'busy' | 'off-duty';
  badge: string;
  shift: 'day' | 'night' | 'swing';
  specializations?: string[];
  contactInfo?: {
    radio?: string;
    phone?: string;
    email?: string;
  };
}

export const SECURITY_PERSONNEL: SecurityPersonnel[] = [
  {
    id: 'officer-001',
    name: 'Rodriguez, M.',
    role: 'Security Officer',
    department: 'Security',
    status: 'available',
    badge: 'SEC-001',
    shift: 'day',
    specializations: ['Emergency Response', 'Access Control'],
    contactInfo: {
      radio: 'Unit-1A',
      phone: '(555) 001-0001',
      email: 'rodriguez.m@company.com'
    }
  },
  {
    id: 'officer-002',
    name: 'Chen, L.',
    role: 'Senior Security Officer',
    department: 'Security',
    status: 'available',
    badge: 'SEC-002',
    shift: 'day',
    specializations: ['Incident Investigation', 'Technical Security'],
    contactInfo: {
      radio: 'Unit-1B',
      phone: '(555) 001-0002',
      email: 'chen.l@company.com'
    }
  },
  {
    id: 'officer-003',
    name: 'Davis, K.',
    role: 'Security Officer',
    department: 'Security',
    status: 'available',
    badge: 'SEC-003',
    shift: 'day',
    specializations: ['Medical Emergency', 'Fire Safety'],
    contactInfo: {
      radio: 'Unit-1C',
      phone: '(555) 001-0003',
      email: 'davis.k@company.com'
    }
  },
  {
    id: 'officer-004',
    name: 'Martinez, A.',
    role: 'Security Officer',
    department: 'Security',
    status: 'available',
    badge: 'SEC-004',
    shift: 'day',
    specializations: ['Patrol', 'Perimeter Security'],
    contactInfo: {
      radio: 'Patrol-1',
      phone: '(555) 001-0004',
      email: 'martinez.a@company.com'
    }
  },
  {
    id: 'officer-005',
    name: 'Wilson, R.',
    role: 'Security Officer',
    department: 'Security',
    status: 'available',
    badge: 'SEC-005',
    shift: 'day',
    specializations: ['Access Systems', 'Maintenance Coordination'],
    contactInfo: {
      radio: 'Unit-2A',
      phone: '(555) 001-0005',
      email: 'wilson.r@company.com'
    }
  },
  {
    id: 'supervisor-001',
    name: 'Garcia, S.',
    role: 'Security Supervisor',
    department: 'Security',
    status: 'available',
    badge: 'SUP-001',
    shift: 'day',
    specializations: ['Team Management', 'Crisis Response', 'Investigation'],
    contactInfo: {
      radio: 'Command-1',
      phone: '(555) 001-0010',
      email: 'garcia.s@company.com'
    }
  },
  {
    id: 'officer-006',
    name: 'Thompson, J.',
    role: 'Security Officer',
    department: 'Security',
    status: 'busy',
    badge: 'SEC-006',
    shift: 'day',
    specializations: ['Fire Response', 'Emergency Coordination'],
    contactInfo: {
      radio: 'Unit-1D',
      phone: '(555) 001-0006',
      email: 'thompson.j@company.com'
    }
  },
  {
    id: 'officer-007',
    name: 'Park, J.',
    role: 'Security Officer',
    department: 'Security',
    status: 'available',
    badge: 'SEC-007',
    shift: 'day',
    specializations: ['Perimeter Security', 'Wildlife Management'],
    contactInfo: {
      radio: 'Perimeter-1',
      phone: '(555) 001-0007',
      email: 'park.j@company.com'
    }
  },
  {
    id: 'officer-008',
    name: 'Blake, R.',
    role: 'Armed Security Officer',
    department: 'Security',
    status: 'available',
    badge: 'SEC-008',
    shift: 'day',
    specializations: ['Armed Response', 'Checkpoint Security'],
    contactInfo: {
      radio: 'Security-Team-1',
      phone: '(555) 001-0008',
      email: 'blake.r@company.com'
    }
  },
  {
    id: 'dispatch-001',
    name: 'Communications Center',
    role: 'Dispatcher',
    department: 'Communications',
    status: 'available',
    badge: 'DISP-001',
    shift: 'day',
    specializations: ['Emergency Dispatch', 'Communications Coordination'],
    contactInfo: {
      radio: 'Dispatch-Main',
      phone: '(555) 911-0000',
      email: 'dispatch@company.com'
    }
  }
];

export const getAvailablePersonnel = (): SecurityPersonnel[] => {
  return SECURITY_PERSONNEL.filter(person => person.status === 'available');
};

export const getPersonnelByShift = (shift: 'day' | 'night' | 'swing'): SecurityPersonnel[] => {
  return SECURITY_PERSONNEL.filter(person => person.shift === shift);
};

export const getPersonnelBySpecialization = (specialization: string): SecurityPersonnel[] => {
  return SECURITY_PERSONNEL.filter(person => 
    person.specializations?.includes(specialization)
  );
};

export const getPersonnelById = (id: string): SecurityPersonnel | undefined => {
  return SECURITY_PERSONNEL.find(person => person.id === id);
};

export const getPersonnelByName = (name: string): SecurityPersonnel | undefined => {
  return SECURITY_PERSONNEL.find(person => person.name === name);
};