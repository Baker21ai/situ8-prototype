# Demo Users Setup for Situ8 Prototype

## Quick User Switching Strategy (No Login Required)

### Demo Users Configuration

```javascript
// Add to your stores or create a demo service
export const demoUsers = [
  // Security Guards (Front-line users)
  {
    id: 'guard-001',
    username: 'mike.johnson',
    full_name: 'Mike Johnson',
    email: 'mike.johnson@demo.situ8.com',
    role: {
      name: 'Security Guard',
      can_create_activities: true,
      can_assign_activities: false,
      can_resolve_activities: true,
      sites_access: 'assigned'
    },
    site_access: ['site-downtown', 'site-warehouse'],
    avatar: '👮‍♂️',
    status: 'on-duty'
  },
  
  {
    id: 'guard-002',
    username: 'sarah.chen',
    full_name: 'Sarah Chen',
    email: 'sarah.chen@demo.situ8.com',
    role: {
      name: 'Security Guard',
      can_create_activities: true,
      can_assign_activities: false,
      can_resolve_activities: true,
      sites_access: 'assigned'
    },
    site_access: ['site-corporate', 'site-retail'],
    avatar: '👮‍♀️',
    status: 'on-patrol'
  },

  // Supervisors (Middle management)
  {
    id: 'supervisor-001',
    username: 'david.rodriguez',
    full_name: 'David Rodriguez',
    email: 'david.rodriguez@demo.situ8.com',
    role: {
      name: 'Security Supervisor',
      can_create_activities: true,
      can_assign_activities: true,
      can_resolve_activities: true,
      can_create_incidents: true,
      sites_access: 'assigned'
    },
    site_access: ['site-downtown', 'site-warehouse', 'site-corporate'],
    avatar: '👨‍💼',
    status: 'available'
  },

  // Site Administrator (High-level access)
  {
    id: 'admin-001',
    username: 'lisa.thompson',
    full_name: 'Lisa Thompson',
    email: 'lisa.thompson@demo.situ8.com',
    role: {
      name: 'Site Administrator',
      can_create_activities: true,
      can_assign_activities: true,
      can_resolve_activities: true,
      can_create_incidents: true,
      can_create_cases: true,
      can_manage_bols: true,
      can_view_audit_trail: true,
      sites_access: 'all'
    },
    site_access: ['all'],
    avatar: '👩‍💼',
    status: 'available'
  },

  // Regional Manager (Multi-site access)
  {
    id: 'regional-001',
    username: 'james.wilson',
    full_name: 'James Wilson',
    email: 'james.wilson@demo.situ8.com',
    role: {
      name: 'Regional Manager',
      can_create_activities: true,
      can_assign_activities: true,
      can_resolve_activities: true,
      can_create_incidents: true,
      can_create_cases: true,
      can_manage_bols: true,
      can_view_audit_trail: true,
      sites_access: 'all'
    },
    site_access: ['all'],
    avatar: '🏢',
    status: 'available'
  },

  // Night Shift Guard
  {
    id: 'guard-night-001',
    username: 'alex.martinez',
    full_name: 'Alex Martinez',
    email: 'alex.martinez@demo.situ8.com',
    role: {
      name: 'Security Guard (Night Shift)',
      can_create_activities: true,
      can_assign_activities: false,
      can_resolve_activities: true,
      sites_access: 'assigned'
    },
    site_access: ['site-warehouse', 'site-retail'],
    avatar: '🌙',
    status: 'on-duty'
  }
];
```

## Demo Sites Configuration

```javascript
export const demoSites = [
  {
    id: 'site-downtown',
    name: 'Downtown Corporate Plaza',
    code: 'DCP-001',
    address: '123 Business District, Downtown',
    security_level: 'high',
    operational_hours: '24/7',
    buildings: [
      { name: 'Tower A', code: 'TA', floors: 25 },
      { name: 'Tower B', code: 'TB', floors: 30 },
      { name: 'Parking Garage', code: 'PG', floors: 5 }
    ],
    active_guards: 3,
    recent_activities: 12
  },
  
  {
    id: 'site-warehouse',
    name: 'Industrial Warehouse Complex',
    code: 'IWC-002',
    address: '456 Industrial Blvd, Warehouse District',
    security_level: 'medium',
    operational_hours: '6:00 AM - 10:00 PM',
    buildings: [
      { name: 'Warehouse 1', code: 'W1', floors: 2 },
      { name: 'Warehouse 2', code: 'W2', floors: 2 },
      { name: 'Office Building', code: 'OB', floors: 3 }
    ],
    active_guards: 2,
    recent_activities: 8
  },
  
  {
    id: 'site-corporate',
    name: 'Corporate Headquarters',
    code: 'CHQ-003',
    address: '789 Executive Way, Business Park',
    security_level: 'critical',
    operational_hours: '24/7',
    buildings: [
      { name: 'Main Building', code: 'MB', floors: 15 },
      { name: 'Data Center', code: 'DC', floors: 2 },
      { name: 'Executive Wing', code: 'EW', floors: 5 }
    ],
    active_guards: 4,
    recent_activities: 15
  },
  
  {
    id: 'site-retail',
    name: 'Retail Shopping Center',
    code: 'RSC-004',
    address: '321 Shopping Plaza, Retail District',
    security_level: 'medium',
    operational_hours: '6:00 AM - 11:00 PM',
    buildings: [
      { name: 'Main Mall', code: 'MM', floors: 3 },
      { name: 'Anchor Store A', code: 'ASA', floors: 2 },
      { name: 'Anchor Store B', code: 'ASB', floors: 2 }
    ],
    active_guards: 2,
    recent_activities: 6
  }
];
```

## User Switching Component

```jsx
// components/DemoUserSwitcher.tsx
export function DemoUserSwitcher() {
  const [currentUser, setCurrentUser] = useState(demoUsers[0]);
  
  return (
    <div className="demo-user-switcher">
      <Select value={currentUser.id} onValueChange={(userId) => {
        const user = demoUsers.find(u => u.id === userId);
        setCurrentUser(user);
        // Update your user store/context here
      }}>
        <SelectTrigger className="w-64">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentUser.avatar}</span>
            <div>
              <div className="font-medium">{currentUser.full_name}</div>
              <div className="text-xs text-muted-foreground">{currentUser.role.name}</div>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent>
          {demoUsers.map(user => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <span>{user.avatar}</span>
                <div>
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-xs text-muted-foreground">{user.role.name}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

## Demo Data Strategy

### Activities & Incidents
- **50-100 realistic activities** across all sites
- **10-15 incidents** in various states (open, investigating, resolved)
- **Mix of activity types**: patrol, medical, security-breach, alert, evidence
- **Time distribution**: Recent (last 24h), this week, this month

### BOL (Be On Lookout) Entries
- **5-10 active BOLs** with photos and descriptions
- **Mix of threat levels**: low, medium, high, critical
- **Various types**: suspicious person, vehicle, package

### Cases
- **3-5 ongoing cases** with multiple linked activities
- **2-3 closed cases** showing resolution workflow

## Implementation Steps

1. **Create Demo Service**
   ```bash
   # Create demo data service
   touch services/demo.service.ts
   ```

2. **Add User Switcher to Header**
   - Place in CommandCenter.tsx header
   - Make it prominent but not intrusive

3. **Seed Demo Data**
   - Pre-populate stores with realistic data
   - Ensure data relationships are logical

4. **Add Demo Mode Toggle**
   - Easy way to switch between demo and real data
   - Clear visual indicator when in demo mode

## Demo Flow Recommendations

### For Security Company Prospects:
1. **Start as Guard** → Show daily patrol workflow
2. **Switch to Supervisor** → Show management capabilities
3. **Switch to Admin** → Show reporting and analytics

### For Enterprise Prospects:
1. **Start as Admin** → Show overview and control
2. **Switch to Guard** → Show ease of use for front-line
3. **Back to Admin** → Show how data flows up

### For Technology Prospects:
1. **Show API integrations** (visitor management, access control)
2. **Demonstrate real-time updates**
3. **Show mobile responsiveness**