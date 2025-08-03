import React from 'react';
import { Button } from '../ui/button';
import { useGuardStore } from '../../stores/guardStore';
import { useIncidentStore } from '../../stores/incidentStore';

// Generate random coordinates around campus center
const generateRandomCoordinate = (center: { lat: number; lng: number }, range: number = 0.005) => {
  return {
    lat: center.lat + (Math.random() - 0.5) * range,
    lng: center.lng + (Math.random() - 0.5) * range
  };
};

export const MapTestData: React.FC = () => {
  const { guards, updateGuardLocation } = useGuardStore();
  const { createIncident } = useIncidentStore();
  
  const campusCenter = { lat: 37.7749, lng: -122.4194 };

  // Generate test guards
  const generateTestGuards = () => {
    const statuses = ['available', 'patrolling', 'responding', 'investigating', 'break'];
    
    // Generate 20 additional test guards
    for (let i = 10; i <= 30; i++) {
      const coords = generateRandomCoordinate(campusCenter);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      updateGuardLocation(i, coords.lat, coords.lng);
      
      // Also update status if the guard exists
      const guard = guards.find(g => g.id === i);
      if (guard) {
        useGuardStore.getState().updateGuard(i, { status });
      }
    }
  };

  // Generate test incidents
  const generateTestIncidents = () => {
    const priorities = ['critical', 'high', 'medium', 'low'];
    const types = ['security', 'medical', 'fire', 'maintenance'];
    const titles = [
      'Unauthorized Access Attempt',
      'Medical Emergency',
      'Fire Alarm Activated',
      'Suspicious Activity',
      'Equipment Malfunction',
      'Perimeter Breach',
      'Vandalism Report',
      'Lost Child',
      'Power Outage',
      'Water Leak'
    ];
    
    // Generate 30 test incidents
    for (let i = 0; i < 30; i++) {
      const coords = generateRandomCoordinate(campusCenter);
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      
      const incidentData = {
        title: `${title} #${i + 1}`,
        description: `Test incident for clustering demonstration. Priority: ${priority}`,
        type,
        priority,
        site_id: 'SITE-001',
        building_id: 'building-a',
        latitude: coords.lat,
        longitude: coords.lng,
        status: i % 3 === 0 ? 'active' : 'investigating',
        assigned_to: i % 2 === 0 ? 'Officer Smith' : undefined,
        auto_created: false
      };
      
      createIncident(incidentData as any, { 
        action: 'created', 
        timestamp: new Date(), 
        userId: 'test-user', 
        entityType: 'incident' 
      });
    }
  };

  // Simulate movement
  const simulateGuardMovement = () => {
    const interval = setInterval(() => {
      guards.forEach(guard => {
        if (guard.status === 'patrolling' || guard.status === 'responding') {
          const newCoords = {
            lat: guard.latitude + (Math.random() - 0.5) * 0.0002,
            lng: guard.longitude + (Math.random() - 0.5) * 0.0002
          };
          updateGuardLocation(guard.id, newCoords.lat, newCoords.lng);
        }
      });
    }, 3000); // Update every 3 seconds

    // Stop after 30 seconds
    setTimeout(() => clearInterval(interval), 30000);
  };

  return (
    <div className="absolute top-4 right-4 bg-background/95 p-4 rounded-lg shadow-lg border z-[1000]">
      <h3 className="text-sm font-semibold mb-3">Map Test Controls</h3>
      <div className="space-y-2">
        <Button
          size="sm"
          variant="outline"
          onClick={generateTestGuards}
          className="w-full"
        >
          Add 20 Test Guards
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={generateTestIncidents}
          className="w-full"
        >
          Add 30 Test Incidents
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={simulateGuardMovement}
          className="w-full"
        >
          Simulate Movement (30s)
        </Button>
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        <p>Guards: {guards.length}</p>
        <p>Incidents: {useIncidentStore.getState().incidents.filter(i => i.status !== 'resolved').length}</p>
      </div>
    </div>
  );
};