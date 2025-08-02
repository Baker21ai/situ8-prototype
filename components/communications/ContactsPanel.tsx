import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, 
  User, 
  Users, 
  Building, 
  MessageCircle,
  Phone,
  Shield,
  Star,
  Circle,
  MapPin
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'guard' | 'viewer';
  clearanceLevel: number;
  badgeNumber: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen: string;
  building?: string;
  location?: string;
  profileImage?: string;
  department?: string;
  shift?: string;
  isFavorite?: boolean;
}

interface Building {
  id: string;
  name: string;
  activeGuards: number;
  totalGuards: number;
  status: 'normal' | 'alert' | 'emergency';
}

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  lastActivity: string;
  type: 'department' | 'shift' | 'custom' | 'location';
}

interface ContactsPanelProps {
  onContactSelect?: (contact: Contact) => void;
  onGroupSelect?: (group: Group) => void;
  onBuildingSelect?: (building: Building) => void;
  className?: string;
}

// Mock data
const mockContacts: Contact[] = [
  {
    id: 'garcia-m',
    name: 'Michael Garcia',
    email: 'garcia@situ8.com',
    role: 'guard',
    clearanceLevel: 3,
    badgeNumber: 'G-4521',
    status: 'online',
    lastSeen: '2 min ago',
    building: 'Building A',
    location: 'Floor 3',
    department: 'Security',
    shift: 'Day Shift',
    isFavorite: true
  },
  {
    id: 'wilson-r',
    name: 'Robert Wilson',
    email: 'wilson@situ8.com',
    role: 'guard',
    clearanceLevel: 3,
    badgeNumber: 'G-4522',
    status: 'busy',
    lastSeen: 'Now',
    building: 'Building A',
    location: 'Parking Lot',
    department: 'Security',
    shift: 'Day Shift'
  },
  {
    id: 'chen-l',
    name: 'Lisa Chen',
    email: 'chen@situ8.com',
    role: 'supervisor',
    clearanceLevel: 4,
    badgeNumber: 'S-2301',
    status: 'online',
    lastSeen: '5 min ago',
    building: 'Building B',
    location: 'Control Room',
    department: 'Security',
    shift: 'Day Shift',
    isFavorite: true
  },
  {
    id: 'admin-1',
    name: 'John Administrator',
    email: 'admin@situ8.com',
    role: 'admin',
    clearanceLevel: 5,
    badgeNumber: 'A-1001',
    status: 'away',
    lastSeen: '1 hour ago',
    building: 'HQ',
    department: 'Management'
  }
];

const mockBuildings: Building[] = [
  { id: 'bldg-a', name: 'Building A', activeGuards: 4, totalGuards: 6, status: 'normal' },
  { id: 'bldg-b', name: 'Building B', activeGuards: 3, totalGuards: 4, status: 'alert' },
  { id: 'bldg-c', name: 'Building C', activeGuards: 2, totalGuards: 3, status: 'normal' },
  { id: 'hq', name: 'Headquarters', activeGuards: 2, totalGuards: 2, status: 'normal' }
];

const mockGroups: Group[] = [
  {
    id: 'grp-admin',
    name: 'Administrators',
    description: 'System administrators and managers',
    memberCount: 3,
    lastActivity: '10 min ago',
    type: 'department'
  },
  {
    id: 'grp-day',
    name: 'Day Shift',
    description: 'All day shift personnel',
    memberCount: 12,
    lastActivity: '2 min ago',
    type: 'shift'
  },
  {
    id: 'grp-emergency',
    name: 'Emergency Response',
    description: 'Quick response team',
    memberCount: 8,
    lastActivity: '1 hour ago',
    type: 'custom'
  },
  {
    id: 'grp-bldg-a',
    name: 'Building A Team',
    description: 'All personnel assigned to Building A',
    memberCount: 6,
    lastActivity: '5 min ago',
    type: 'location'
  }
];

export function ContactsPanel({ 
  onContactSelect, 
  onGroupSelect, 
  onBuildingSelect,
  className = '' 
}: ContactsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('people');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'favorites'>('all');

  // Filter contacts based on search and filters
  const filteredContacts = useMemo(() => {
    return mockContacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contact.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = selectedFilter === 'all' ||
                          (selectedFilter === 'online' && contact.status === 'online') ||
                          (selectedFilter === 'favorites' && contact.isFavorite);
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
    }
  };

  const getRoleBadgeVariant = (role: Contact['role']) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'supervisor': return 'default';
      case 'guard': return 'secondary';
      case 'viewer': return 'outline';
    }
  };

  const getBuildingStatusColor = (status: Building['status']) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'alert': return 'text-yellow-600';
      case 'emergency': return 'text-red-600';
    }
  };

  const renderContact = (contact: Contact) => (
    <div
      key={contact.id}
      className="p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
      onClick={() => onContactSelect?.(contact)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar with status */}
          <div className="relative">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <Circle className={`absolute bottom-0 right-0 h-3 w-3 ${getStatusColor(contact.status)} rounded-full border-2 border-white`} />
          </div>
          
          {/* Contact Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{contact.name}</span>
              {contact.isFavorite && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <div className="text-sm text-gray-500">{contact.badgeNumber}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getRoleBadgeVariant(contact.role)} className="text-xs">
                {contact.role}
              </Badge>
              {contact.building && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {contact.building}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBuilding = (building: Building) => (
    <div
      key={building.id}
      className="p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors border"
      onClick={() => onBuildingSelect?.(building)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-600" />
          <span className="font-medium">{building.name}</span>
        </div>
        <span className={`text-sm font-medium ${getBuildingStatusColor(building.status)}`}>
          {building.status.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Guards</span>
        <span className="font-medium">
          {building.activeGuards}/{building.totalGuards} active
        </span>
      </div>
    </div>
  );

  const renderGroup = (group: Group) => (
    <div
      key={group.id}
      className="p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors border"
      onClick={() => onGroupSelect?.(group)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{group.name}</span>
          </div>
          <p className="text-sm text-gray-500 mb-2">{group.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{group.memberCount} members</span>
            <span>Active {group.lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contacts & Groups
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts, groups, or buildings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4">
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          {/* People Tab */}
          <TabsContent value="people" className="flex-1 mt-0">
            {/* Filters */}
            <div className="px-4 py-2 border-b">
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('online')}
                >
                  Online
                </Button>
                <Button
                  variant={selectedFilter === 'favorites' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('favorites')}
                >
                  <Star className="h-3 w-3 mr-1" />
                  Favorites
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {filteredContacts.map(renderContact)}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Buildings Tab */}
          <TabsContent value="buildings" className="flex-1 mt-0">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {mockBuildings.map(renderBuilding)}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="flex-1 mt-0">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {mockGroups.map(renderGroup)}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}