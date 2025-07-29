// Enterprise-scale site data for Situ8 Security Platform
// 30+ facilities across North America with realistic geographic distribution

export interface Site {
  id: string;
  name: string;
  code: string;
  region: string;
  type: 'distribution-hub' | 'fulfillment-center' | 'sort-center' | 'delivery-station' | 'corporate' | 'data-center';
  coordinates: {
    lat: number;
    lng: number;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  size: 'small' | 'medium' | 'large' | 'mega';
  employeeCount: number;
  buildings: string[];
  operationalHours: '24/7' | 'business' | 'extended';
  securityLevel: 'standard' | 'enhanced' | 'maximum';
}

export const ENTERPRISE_SITES: Site[] = [
  // West Coast Region
  {
    id: 'sea-hub-001',
    name: 'Seattle Distribution Hub',
    code: 'SEA1',
    region: 'West Coast',
    type: 'distribution-hub',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    address: {
      street: '1800 9th Avenue',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 5000,
    buildings: ['Main Warehouse', 'Sort Center A', 'Sort Center B', 'Admin Tower', 'Maintenance Facility', 'Security Building', 'Parking Structure A', 'Parking Structure B'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'pdx-fc-001',
    name: 'Portland Fulfillment Center',
    code: 'PDX1',
    region: 'West Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 45.5152, lng: -122.6784 },
    address: {
      street: '2201 NW Yeon Ave',
      city: 'Portland',
      state: 'OR',
      zip: '97210',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3500,
    buildings: ['Fulfillment Center', 'Returns Processing', 'Outbound Dock', 'Employee Center', 'Maintenance Shop'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'sfo-ds-001',
    name: 'San Francisco Delivery Station',
    code: 'SFO3',
    region: 'West Coast',
    type: 'delivery-station',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    address: {
      street: '749 Toland St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94124',
      country: 'USA'
    },
    size: 'medium',
    employeeCount: 800,
    buildings: ['Delivery Station', 'Vehicle Maintenance', 'Driver Facilities'],
    operationalHours: 'extended',
    securityLevel: 'standard'
  },
  {
    id: 'lax-hub-001',
    name: 'Los Angeles Mega Hub',
    code: 'LAX1',
    region: 'West Coast',
    type: 'distribution-hub',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    address: {
      street: '5650 Dolly Ave',
      city: 'Buena Park',
      state: 'CA',
      zip: '90621',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 6000,
    buildings: ['North Warehouse', 'South Warehouse', 'Cross-dock Facility', 'International Processing', 'Admin Complex', 'Security Center', 'Fleet Parking'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'phx-fc-001',
    name: 'Phoenix Fulfillment Center',
    code: 'PHX1',
    region: 'West Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 33.4484, lng: -112.0740 },
    address: {
      street: '6835 W Buckeye Rd',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85043',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 4000,
    buildings: ['Main Fulfillment', 'Robotics Center', 'Climate-controlled Storage', 'Shipping Dock', 'Employee Services'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  
  // Central Region
  {
    id: 'dfw-hub-001',
    name: 'Dallas-Fort Worth Distribution Hub',
    code: 'DFW1',
    region: 'Central',
    type: 'distribution-hub',
    coordinates: { lat: 32.7767, lng: -96.7970 },
    address: {
      street: '2700 Regent Blvd',
      city: 'Dallas',
      state: 'TX',
      zip: '75261',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 5500,
    buildings: ['Distribution Center A', 'Distribution Center B', 'Air Cargo Facility', 'Rail Terminal', 'Admin Building', 'Security Operations'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'hou-fc-001',
    name: 'Houston Fulfillment Center',
    code: 'HOU1',
    region: 'Central',
    type: 'fulfillment-center',
    coordinates: { lat: 29.7604, lng: -95.3698 },
    address: {
      street: '10550 Ella Blvd',
      city: 'Houston',
      state: 'TX',
      zip: '77038',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3800,
    buildings: ['Fulfillment Center', 'Hazmat Storage', 'Heavy Items Processing', 'Outbound Staging', 'Maintenance'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'chi-hub-001',
    name: 'Chicago Distribution Hub',
    code: 'ORD1',
    region: 'Central',
    type: 'distribution-hub',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    address: {
      street: '7001 S Central Ave',
      city: 'Chicago',
      state: 'IL',
      zip: '60638',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 5200,
    buildings: ['Main Distribution', 'Cold Storage', 'Intermodal Terminal', 'Sort Center', 'Fleet Hub', 'Security Building'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'msp-fc-001',
    name: 'Minneapolis Fulfillment Center',
    code: 'MSP1',
    region: 'Central',
    type: 'fulfillment-center',
    coordinates: { lat: 44.9778, lng: -93.2650 },
    address: {
      street: '2601 4th Ave S',
      city: 'Minneapolis',
      state: 'MN',
      zip: '55408',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3200,
    buildings: ['Fulfillment Center', 'Winter Storage', 'Returns Center', 'Employee Facilities', 'Vehicle Bay'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'den-sc-001',
    name: 'Denver Sort Center',
    code: 'DEN2',
    region: 'Central',
    type: 'sort-center',
    coordinates: { lat: 39.7392, lng: -104.9903 },
    address: {
      street: '19799 E 36th Ave',
      city: 'Aurora',
      state: 'CO',
      zip: '80011',
      country: 'USA'
    },
    size: 'medium',
    employeeCount: 1500,
    buildings: ['Sort Facility', 'Conveyor Systems', 'Loading Docks', 'Admin Office'],
    operationalHours: '24/7',
    securityLevel: 'standard'
  },
  
  // East Coast Region
  {
    id: 'jfk-hub-001',
    name: 'New York Metro Distribution Hub',
    code: 'JFK1',
    region: 'East Coast',
    type: 'distribution-hub',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    address: {
      street: '1 Centerpoint Dr',
      city: 'Newark',
      state: 'NJ',
      zip: '07114',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 6500,
    buildings: ['Distribution Center North', 'Distribution Center South', 'Air Cargo Terminal', 'International Hub', 'Security Complex', 'Admin Tower'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'bos-fc-001',
    name: 'Boston Fulfillment Center',
    code: 'BOS1',
    region: 'East Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    address: {
      street: '1180 Innovation Way',
      city: 'Fall River',
      state: 'MA',
      zip: '02720',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3000,
    buildings: ['Main Fulfillment', 'Robotics Wing', 'Quality Control', 'Shipping Hub', 'Employee Center'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'atl-hub-001',
    name: 'Atlanta Distribution Hub',
    code: 'ATL1',
    region: 'East Coast',
    type: 'distribution-hub',
    coordinates: { lat: 33.7490, lng: -84.3880 },
    address: {
      street: '4500 Fulton Industrial Blvd',
      city: 'Atlanta',
      state: 'GA',
      zip: '30336',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 5800,
    buildings: ['East Distribution', 'West Distribution', 'Regional Sort', 'Cross-dock', 'Fleet Center', 'Security HQ'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'mia-fc-001',
    name: 'Miami Fulfillment Center',
    code: 'MIA1',
    region: 'East Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    address: {
      street: '13600 NW 107th Ave',
      city: 'Hialeah Gardens',
      state: 'FL',
      zip: '33018',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3500,
    buildings: ['Fulfillment Center', 'Hurricane-proof Storage', 'International Processing', 'Loading Complex', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'dc-corp-001',
    name: 'Corporate Headquarters',
    code: 'HQ1',
    region: 'East Coast',
    type: 'corporate',
    coordinates: { lat: 38.9072, lng: -77.0369 },
    address: {
      street: '1800 K Street NW',
      city: 'Washington',
      state: 'DC',
      zip: '20006',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 2000,
    buildings: ['Executive Tower', 'Operations Center', 'Technology Hub', 'Conference Center', 'Security Command'],
    operationalHours: 'business',
    securityLevel: 'maximum'
  },
  
  // Additional Strategic Locations
  {
    id: 'mem-hub-001',
    name: 'Memphis Air Hub',
    code: 'MEM1',
    region: 'Central',
    type: 'distribution-hub',
    coordinates: { lat: 35.1495, lng: -90.0490 },
    address: {
      street: '3292 Players Club Pkwy',
      city: 'Memphis',
      state: 'TN',
      zip: '38125',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 4500,
    buildings: ['Air Cargo Terminal', 'Sort Center A', 'Sort Center B', 'Ground Hub', 'Maintenance Hangar', 'Admin Complex'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'cvg-hub-001',
    name: 'Cincinnati Northern Kentucky Hub',
    code: 'CVG1',
    region: 'Central',
    type: 'distribution-hub',
    coordinates: { lat: 39.0458, lng: -84.6620 },
    address: {
      street: '1155 Worldwide Blvd',
      city: 'Hebron',
      state: 'KY',
      zip: '41048',
      country: 'USA'
    },
    size: 'mega',
    employeeCount: 5000,
    buildings: ['Main Sort', 'International Hub', 'Domestic Terminal', 'Fleet Operations', 'Security Center'],
    operationalHours: '24/7',
    securityLevel: 'maximum'
  },
  {
    id: 'ind-fc-001',
    name: 'Indianapolis Fulfillment Center',
    code: 'IND1',
    region: 'Central',
    type: 'fulfillment-center',
    coordinates: { lat: 39.7684, lng: -86.1581 },
    address: {
      street: '4255 Anson Dr',
      city: 'Whitestown',
      state: 'IN',
      zip: '46075',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3300,
    buildings: ['Fulfillment Center', 'Robotics Floor', 'Outbound Dock', 'Returns Processing', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'clt-fc-001',
    name: 'Charlotte Fulfillment Center',
    code: 'CLT1',
    region: 'East Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 35.2271, lng: -80.8431 },
    address: {
      street: '10240 Old Dowd Rd',
      city: 'Charlotte',
      state: 'NC',
      zip: '28214',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3600,
    buildings: ['Main Fulfillment', 'Pick Tower', 'Pack Floor', 'Shipping Center', 'Employee Services'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'cmh-fc-001',
    name: 'Columbus Fulfillment Center',
    code: 'CMH1',
    region: 'Central',
    type: 'fulfillment-center',
    coordinates: { lat: 39.9612, lng: -82.9988 },
    address: {
      street: '7200 Green Meadows Dr N',
      city: 'Lewis Center',
      state: 'OH',
      zip: '43035',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3400,
    buildings: ['Fulfillment Center', 'Small Items', 'Large Items', 'Specialty Handling', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'bna-fc-001',
    name: 'Nashville Fulfillment Center',
    code: 'BNA1',
    region: 'Central',
    type: 'fulfillment-center',
    coordinates: { lat: 36.1627, lng: -86.7816 },
    address: {
      street: '50 Airways Blvd',
      city: 'Nashville',
      state: 'TN',
      zip: '37217',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3200,
    buildings: ['Fulfillment Center', 'Music Equipment Specialty', 'Standard Processing', 'Outbound', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'slc-fc-001',
    name: 'Salt Lake City Fulfillment Center',
    code: 'SLC1',
    region: 'West Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 40.7608, lng: -111.8910 },
    address: {
      street: '777 N 5600 W',
      city: 'Salt Lake City',
      state: 'UT',
      zip: '84116',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 2800,
    buildings: ['Main Fulfillment', 'Winter Gear Specialty', 'Standard Items', 'Shipping Hub', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'abq-ds-001',
    name: 'Albuquerque Delivery Station',
    code: 'ABQ1',
    region: 'West Coast',
    type: 'delivery-station',
    coordinates: { lat: 35.0844, lng: -106.6504 },
    address: {
      street: '6001 Edith Blvd NE',
      city: 'Albuquerque',
      state: 'NM',
      zip: '87107',
      country: 'USA'
    },
    size: 'small',
    employeeCount: 500,
    buildings: ['Delivery Station', 'Vehicle Bay', 'Driver Lounge'],
    operationalHours: 'extended',
    securityLevel: 'standard'
  },
  {
    id: 'rno-fc-001',
    name: 'Reno Fulfillment Center',
    code: 'RNO1',
    region: 'West Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 39.5296, lng: -119.8138 },
    address: {
      street: '8000 N Virginia St',
      city: 'Reno',
      state: 'NV',
      zip: '89506',
      country: 'USA'
    },
    size: 'medium',
    employeeCount: 2200,
    buildings: ['Fulfillment Center', 'Nevada Tax-Free Storage', 'Shipping', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'pdx-ds-001',
    name: 'Portland Delivery Station',
    code: 'PDX3',
    region: 'West Coast',
    type: 'delivery-station',
    coordinates: { lat: 45.5898, lng: -122.5951 },
    address: {
      street: '9525 NE Alderwood Rd',
      city: 'Portland',
      state: 'OR',
      zip: '97220',
      country: 'USA'
    },
    size: 'small',
    employeeCount: 600,
    buildings: ['Delivery Hub', 'Van Loading', 'Driver Services'],
    operationalHours: 'extended',
    securityLevel: 'standard'
  },
  {
    id: 'oak-sc-001',
    name: 'Oakland Sort Center',
    code: 'OAK1',
    region: 'West Coast',
    type: 'sort-center',
    coordinates: { lat: 37.8044, lng: -122.2712 },
    address: {
      street: '1555 Davis St',
      city: 'San Leandro',
      state: 'CA',
      zip: '94577',
      country: 'USA'
    },
    size: 'medium',
    employeeCount: 1200,
    buildings: ['Sort Center', 'Package Processing', 'Loading Docks', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'standard'
  },
  {
    id: 'phl-fc-001',
    name: 'Philadelphia Fulfillment Center',
    code: 'PHL1',
    region: 'East Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 39.9526, lng: -75.1652 },
    address: {
      street: '675 Allen Rd',
      city: 'Carlisle',
      state: 'PA',
      zip: '17015',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3100,
    buildings: ['Fulfillment Center', 'Multi-story Pick Tower', 'Pack Center', 'Dock Complex', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'bwi-fc-001',
    name: 'Baltimore Fulfillment Center',
    code: 'BWI1',
    region: 'East Coast',
    type: 'fulfillment-center',
    coordinates: { lat: 39.2904, lng: -76.6122 },
    address: {
      street: '2010 Broening Hwy',
      city: 'Baltimore',
      state: 'MD',
      zip: '21224',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 2900,
    buildings: ['Main Fulfillment', 'Port Interface', 'Import Processing', 'Outbound', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'dtw-fc-001',
    name: 'Detroit Fulfillment Center',
    code: 'DTW1',
    region: 'Central',
    type: 'fulfillment-center',
    coordinates: { lat: 42.3314, lng: -83.0458 },
    address: {
      street: '32801 Ecorse Rd',
      city: 'Romulus',
      state: 'MI',
      zip: '48174',
      country: 'USA'
    },
    size: 'large',
    employeeCount: 3000,
    buildings: ['Fulfillment Center', 'Auto Parts Specialty', 'Standard Processing', 'Shipping', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'enhanced'
  },
  {
    id: 'stl-sc-001',
    name: 'St. Louis Sort Center',
    code: 'STL1',
    region: 'Central',
    type: 'sort-center',
    coordinates: { lat: 38.6270, lng: -90.1994 },
    address: {
      street: '3050 Gateway Commerce Center Dr',
      city: 'Edwardsville',
      state: 'IL',
      zip: '62025',
      country: 'USA'
    },
    size: 'medium',
    employeeCount: 1100,
    buildings: ['Sort Facility', 'Regional Processing', 'Fleet Dock', 'Admin'],
    operationalHours: '24/7',
    securityLevel: 'standard'
  }
];

// Helper function to get site by ID
export const getSiteById = (siteId: string): Site | undefined => {
  return ENTERPRISE_SITES.find(site => site.id === siteId);
};

// Helper function to get sites by region
export const getSitesByRegion = (region: string): Site[] => {
  return ENTERPRISE_SITES.filter(site => site.region === region);
};

// Helper function to get sites by type
export const getSitesByType = (type: Site['type']): Site[] => {
  return ENTERPRISE_SITES.filter(site => site.type === type);
};

// Helper function to get all regions
export const getAllRegions = (): string[] => {
  return [...new Set(ENTERPRISE_SITES.map(site => site.region))];
};

// Helper function to get site statistics
export const getSiteStatistics = () => {
  const totalSites = ENTERPRISE_SITES.length;
  const totalEmployees = ENTERPRISE_SITES.reduce((sum, site) => sum + site.employeeCount, 0);
  const sitesByType = ENTERPRISE_SITES.reduce((acc, site) => {
    acc[site.type] = (acc[site.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sitesByRegion = ENTERPRISE_SITES.reduce((acc, site) => {
    acc[site.region] = (acc[site.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSites,
    totalEmployees,
    sitesByType,
    sitesByRegion,
    megaSites: ENTERPRISE_SITES.filter(s => s.size === 'mega').length,
    criticalSites: ENTERPRISE_SITES.filter(s => s.securityLevel === 'maximum').length
  };
};