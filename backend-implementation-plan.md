# Situ8 Backend Implementation Plan

## Phase 1: Supabase Demo Setup (Week 1)

### Day 1: Supabase Project Setup
```bash
# 1. Create Supabase project
# Go to supabase.com → New Project

# 2. Install Supabase client
npm install @supabase/supabase-js

# 3. Create environment variables
echo "VITE_SUPABASE_URL=your-project-url" >> .env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env
```

### Day 2: Database Schema
```sql
-- Activities table
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  site_id TEXT NOT NULL,
  location TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sites table
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  security_level TEXT,
  operational_hours TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users profile table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT NOT NULL,
  site_access TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Day 3: Real-time Setup
```javascript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Real-time subscriptions
export const subscribeToActivities = (callback) => {
  return supabase
    .channel('activities')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'activities' },
      callback
    )
    .subscribe()
}
```

### Day 4: Demo Data Seeding
```javascript
// scripts/seed-demo-data.js
const demoActivities = [
  {
    title: "Security Patrol - Building A",
    description: "Routine security check of all floors",
    type: "patrol",
    priority: "medium",
    status: "active",
    site_id: "site-downtown",
    location: "Building A - All Floors"
  },
  // ... more demo data
];

// Seed function
async function seedDemoData() {
  const { data, error } = await supabase
    .from('activities')
    .insert(demoActivities);
}
```

### Day 5: Integration with Existing Code
```javascript
// Update your existing stores to use Supabase
// stores/activityStore.ts
import { supabase } from '../lib/supabase'

export const activityStore = create((set, get) => ({
  activities: [],
  
  async createActivity(activityData) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activityData])
      .select()
      .single()
    
    if (error) throw error
    
    set(state => ({
      activities: [data, ...state.activities]
    }))
    
    return data
  },
  
  async fetchActivities() {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    set({ activities: data })
  }
}))
```

## Phase 2: Demo User System (Week 2)

### Demo Authentication (No Real Login)
```javascript
// services/demo-auth.service.ts
export class DemoAuthService {
  private currentUser = demoUsers[0] // Default to first user
  
  switchUser(userId: string) {
    this.currentUser = demoUsers.find(u => u.id === userId)
    // Update Supabase session context
    this.updateSupabaseContext()
  }
  
  getCurrentUser() {
    return this.currentUser
  }
}
```

## Phase 3: Production Migration Planning (Future)

### AWS Migration Checklist
- [ ] Set up AWS RDS PostgreSQL
- [ ] Migrate database schema
- [ ] Set up AWS Cognito for auth
- [ ] Configure S3 for file storage
- [ ] Set up Lambda functions
- [ ] Configure API Gateway
- [ ] Set up CloudWatch monitoring
- [ ] Configure auto-scaling
- [ ] Set up CI/CD pipeline

### Migration Tools
- **Database**: pg_dump/pg_restore for PostgreSQL migration
- **Auth**: Custom migration scripts for user data
- **Files**: AWS DataSync for S3 migration
- **Code**: Minimal changes due to similar APIs

## Benefits of This Approach

### Immediate Benefits (Supabase)
✅ Demo ready in 1 week
✅ Real-time features out of the box
✅ Automatic API generation
✅ Built-in authentication
✅ Visual database management
✅ Predictable costs

### Future Benefits (AWS Migration)
✅ Enterprise-grade scalability
✅ Custom compliance configurations
✅ Advanced security features
✅ Multi-region deployment
✅ Custom integrations
✅ Full control over infrastructure

## Risk Mitigation

### Vendor Lock-in Concerns
- Use standard PostgreSQL (easily portable)
- Abstract database calls through services
- Plan migration architecture from day 1
- Keep business logic separate from database

### Performance Concerns
- Supabase handles 100k+ concurrent users
- PostgreSQL is production-grade
- Built-in connection pooling
- CDN for static assets

## Cost Projections

### Demo Phase (Months 1-6)
- Supabase Pro: $25/month
- Total: $150 for 6 months

### Growth Phase (Months 6-12)
- Supabase Pro: $25/month
- Additional compute: $50/month
- Total: $75/month

### Enterprise Phase (Year 2+)
- AWS infrastructure: $500-2000/month
- But by then, you have revenue to support it!