/**
 * Visitor Management Dashboard
 * Main dashboard for managing visitors in Situ8 platform
 * Integrates with Lenel access control and third-party systems
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  UserCheck,
  UserX
} from 'lucide-react';
import { Visitor, VisitorState, VisitorFilter } from '../lib/types/visitor';
import { useVisitorService } from '../services/ServiceProvider';

interface VisitorManagementDashboardProps {
  className?: string;
}

export const VisitorManagementDashboard: React.FC<VisitorManagementDashboardProps> = ({
  className
}) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VisitorState | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    expected: 0,
    expired: 0
  });
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [showAddVisitor, setShowAddVisitor] = useState(false);

  const visitorService = useVisitorService();

  useEffect(() => {
    loadVisitors();
    const interval = setInterval(loadVisitors, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter]);

  const loadVisitors = async () => {
    try {
      setLoading(true);
      
      const filters: VisitorFilter[] = [];
      
      if (statusFilter !== 'all') {
        filters.push({
          field: 'status',
          operator: 'in',
          value: [statusFilter]
        });
      }
      
      const dateRange = getDateRange(dateFilter);
      if (dateRange.start && dateRange.end) {
        filters.push({
          field: 'expected_arrival',
          operator: 'between',
          value: {
            start: dateRange.start,
            end: dateRange.end
          }
        });
      }

      const response = await visitorService.searchVisitors({
        filters,
        pagination: { page: 1, limit: 100 },
        sort: [{ field: 'expected_arrival', direction: 'desc' }]
      }, {
        userId: 'system',
        userName: 'system',
        userRole: 'admin',
        action: 'search_visitors'
      });

      if (response.success && response.data) {
        setVisitors(response.data.visitors);
        calculateStats(response.data.visitors);
      }
    } catch (error) {
      console.error('Failed to load visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filter: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      default:
        return { start: null, end: null };
    }

    return { start, end: now };
  };

  const calculateStats = (visitors: Visitor[]) => {
    const now = new Date();
    const stats = {
      total: visitors.length,
      checkedIn: visitors.filter(v => v.status.current === 'checked_in' || v.status.current === 'in_facility').length,
      expected: visitors.filter(v => v.status.current === 'pre_registered').length,
      expired: visitors.filter(v => 
        v.status.current === 'pre_registered' && 
        new Date(v.expected_arrival) < now
      ).length
    };
    setStats(stats);
  };

  const getStatusBadge = (status: VisitorState) => {
    const statusConfig = {
      pre_registered: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      checked_in: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      in_facility: { color: 'bg-green-100 text-green-800', icon: UserCheck },
      checked_out: { color: 'bg-gray-100 text-gray-800', icon: UserX },
      expired: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      cancelled: { color: 'bg-orange-100 text-orange-800', icon: XCircle },
      denied: { color: 'bg-red-100 text-red-800', icon: Shield },
      escalated: { color: 'bg-purple-100 text-purple-800', icon: AlertTriangle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleCheckIn = async (visitor: Visitor) => {
    try {
      const response = await visitorService.checkInVisitor(visitor.id, {
        method: 'guard',
        location: visitor.site_id,
        photo_url: visitor.photo_url,
        signature_url: visitor.signature_url
      }, {
        userId: 'system',
        userName: 'system',
        userRole: 'admin',
        action: 'check_in_visitor'
      });

      if (response.success) {
        await loadVisitors();
      }
    } catch (error) {
      console.error('Failed to check in visitor:', error);
    }
  };

  const handleCheckOut = async (visitor: Visitor) => {
    try {
      const response = await visitorService.checkOutVisitor(visitor.id, {
        userId: 'system',
        userName: 'system',
        userRole: 'admin',
        action: 'check_out_visitor'
      });

      if (response.success) {
        await loadVisitors();
      }
    } catch (error) {
      console.error('Failed to check out visitor:', error);
    }
  };

  const handleAddVisitor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const visitorData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
      host_name: formData.get('host_name') as string,
      purpose: formData.get('purpose') as string,
      expected_arrival: new Date(formData.get('expected_arrival') as string),
      expected_departure: new Date(formData.get('expected_departure') as string),
      access_level: formData.get('access_level') as string,
      priority: formData.get('priority') as 'standard' | 'vip' | 'contractor' | 'emergency',
      site_id: formData.get('site_id') as string,
      host_user_id: 'system-user', // Default host
    };

    try {
      const response = await visitorService.createVisitor(visitorData, {
        userId: 'system',
        userName: 'system',
        userRole: 'admin',
        action: 'create_visitor'
      });

      if (response.success) {
        setShowAddVisitor(false);
        await loadVisitors();
      }
    } catch (error) {
      console.error('Failed to add visitor:', error);
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = searchTerm === '' || 
      visitor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.host_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || visitor.status.current === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Visitor Management</h1>
            <p className="text-gray-600">Manage visitors and track facility access</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadVisitors}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowAddVisitor(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Visitor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.expected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search visitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as VisitorState | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pre_registered">Expected</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="in_facility">In Facility</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visitors List */}
      <Card>
        <CardHeader>
          <CardTitle>Visitors</CardTitle>
          <CardDescription>
            {filteredVisitors.length} visitor{filteredVisitors.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Visitor</th>
                    <th className="text-left py-3 px-4">Company</th>
                    <th className="text-left py-3 px-4">Host</th>
                    <th className="text-left py-3 px-4">Expected</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{visitor.first_name} {visitor.last_name}</div>
                          <div className="text-sm text-gray-600">{visitor.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          {visitor.company || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          {visitor.host_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(visitor.expected_arrival).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(visitor.status.current)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {visitor.site_id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {visitor.status.current === 'pre_registered' && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(visitor)}
                            >
                              Check In
                            </Button>
                          )}
                          {(visitor.status.current === 'checked_in' || visitor.status.current === 'in_facility') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(visitor)}
                            >
                              Check Out
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedVisitor(visitor)}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredVisitors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No visitors found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Visitor Details</CardTitle>
              <CardDescription>
                {selectedVisitor.first_name} {selectedVisitor.last_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Email:</strong> {selectedVisitor.email || 'N/A'}</div>
                      <div><strong>Phone:</strong> {selectedVisitor.phone || 'N/A'}</div>
                      <div><strong>Company:</strong> {selectedVisitor.company || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Visit Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Host:</strong> {selectedVisitor.host_name}</div>
                      <div><strong>Purpose:</strong> {selectedVisitor.purpose}</div>
                      <div><strong>Expected:</strong> {new Date(selectedVisitor.expected_arrival).toLocaleString()}</div>
                      <div><strong>Expected Departure:</strong> {new Date(selectedVisitor.expected_departure).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status History</h4>
                  <div className="space-y-1">
                    {selectedVisitor.status.history.map((history, index) => (
                      <div key={index} className="text-sm flex items-center gap-2">
                        <span className="text-gray-600">{new Date(history.timestamp).toLocaleString()}</span>
                        <span>{history.state.toUpperCase()}</span>
                        {history.reason && <span className="text-gray-600">- {history.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setSelectedVisitor(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Visitor Modal */}
      {showAddVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Visitor</CardTitle>
              <CardDescription>Register a new visitor for facility access</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddVisitor} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <Input
                      name="first_name"
                      required
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <Input
                      name="last_name"
                      required
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <Input
                    name="company"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Host Name</label>
                  <Input
                    name="host_name"
                    required
                    placeholder="Enter host name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Purpose of Visit</label>
                  <Input
                    name="purpose"
                    required
                    placeholder="Enter purpose of visit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expected Arrival</label>
                    <Input
                      name="expected_arrival"
                      type="datetime-local"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expected Departure</label>
                    <Input
                      name="expected_departure"
                      type="datetime-local"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Access Level</label>
                  <Select name="access_level" defaultValue="lobby_access">
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lobby_access">Lobby Access</SelectItem>
                      <SelectItem value="building_access">Building Access</SelectItem>
                      <SelectItem value="secure_access">Secure Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <Select name="priority" defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Site ID</label>
                  <Input
                    name="site_id"
                    required
                    placeholder="Enter site ID"
                    defaultValue="main_campus"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddVisitor(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Visitor
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VisitorManagementDashboard;