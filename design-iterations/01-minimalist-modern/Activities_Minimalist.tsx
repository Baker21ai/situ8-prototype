import React, { useState } from 'react';
import { EnterpriseActivityManager } from '../../components/EnterpriseActivityManager';
import { ResponsiveActivityDetail } from '../../components/ResponsiveActivityDetail';
import { CommunicationsPanel } from '../../components/CommunicationsPanel';
import { RadioModal } from '../../components/RadioModal';
import { CommunicationsPage } from '../../components/CommunicationsPage';
import { enterpriseActivities, getFacilityStats } from '../../components/enterpriseMockData';
import { Card as _Card, CardContent as _CardContent } from '../../components/ui/card';
import { Badge as _Badge } from '../../components/ui/badge';
import { Button as _Button } from '../../components/ui/button';
import { Input as _Input } from '../../components/ui/input';
import { 
  Building, 
  Camera, 
  Activity, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap as _Zap,
  Radio,
  Headphones,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  MapPin
} from 'lucide-react';
import './minimalist-styles.css';

export function Activities_Minimalist() {
  const facilityStats = getFacilityStats(enterpriseActivities);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<any>(null);
  const [showRadioModal, setShowRadioModal] = useState(false);
  const [showCommunicationsPage, setShowCommunicationsPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleActivitySelect = (activity: any) => {
    setSelectedActivityDetail(activity);
  };

  const handleActivityAction = (action: string, activity: any) => {
    console.log(`Activity action: ${action}`, activity);
  };

  const handleBulkAction = (action: string, activities: any[]) => {
    console.log(`Bulk action: ${action} on ${activities.length} activities`);
  };

  const statsData = [
    { 
      icon: Camera, 
      value: facilityStats.totalCameras, 
      label: 'Security Cameras', 
      color: 'text-blue-600',
      change: '+12 this month'
    },
    { 
      icon: Activity, 
      value: facilityStats.totalActivities, 
      label: 'Total Activities', 
      color: 'text-green-600',
      change: 'Last 24 hours'
    },
    { 
      icon: AlertTriangle, 
      value: facilityStats.criticalToday, 
      label: 'Critical Today', 
      color: 'text-red-600', 
      critical: true,
      change: '3 resolved'
    },
    { 
      icon: Building, 
      value: facilityStats.buildingsMonitored, 
      label: 'Buildings', 
      color: 'text-purple-600',
      change: 'All online'
    },
    { 
      icon: Users, 
      value: facilityStats.employeesOnSite.toLocaleString(), 
      label: 'Personnel On-Site', 
      color: 'text-orange-600',
      change: 'Normal capacity'
    },
    { 
      icon: TrendingUp, 
      value: facilityStats.systemUptime, 
      label: 'System Uptime', 
      color: 'text-teal-600',
      change: 'Excellent'
    },
    { 
      icon: Shield, 
      value: facilityStats.securityPersonnel, 
      label: 'Security Staff', 
      color: 'text-indigo-600',
      change: '12 on duty'
    },
    { 
      icon: Clock, 
      value: facilityStats.averageResponseTime, 
      label: 'Response Time', 
      color: 'text-yellow-600',
      change: '15% improvement'
    }
  ];

  return (
    <div className="minimalist-theme minimalist-container" data-design="minimalist">
      {/* Clean Header */}
      <div className="minimalist-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Enterprise Activities Center</h1>
            <p>Comprehensive security activity management and monitoring</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="minimalist-button">
              <Download className="minimalist-icon" />
              Export
            </button>
            <button className="minimalist-button">
              <RefreshCw className="minimalist-icon" />
              Refresh
            </button>
            <button
              className="minimalist-button"
              onClick={() => setShowRadioModal(true)}
            >
              <Radio className="minimalist-icon" />
              Radio
            </button>
            <button
              className="minimalist-button"
              onClick={() => setShowCommunicationsPage(true)}
            >
              <Headphones className="minimalist-icon" />
              Communications
            </button>
          </div>
        </div>

        {/* Facility Overview Stats */}
        <div className="minimalist-stats-grid mt-6">
          {statsData.map(({ icon: Icon, value, label, color, critical, change }) => (
            <div 
              key={label} 
              className={`minimalist-stat-card ${critical ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`minimalist-stat-icon ${color}`} />
                {critical && parseInt(value) > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className={`minimalist-stat-value ${critical ? 'text-red-700' : ''}`}>
                {value}
              </div>
              <div className="minimalist-stat-label">{label}</div>
              {change && (
                <div className="text-xs text-gray-500 mt-1">{change}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-6 p-6 h-[calc(100vh-240px)]">
        {/* Activities Panel - 75% */}
        <div className="flex-[3] minimalist-panel">
          <div className="minimalist-card-header">
            <div className="flex items-center justify-between">
              <div className="minimalist-card-title">
                <Activity className="minimalist-icon" />
                Activity Management
              </div>
              <div className="flex items-center gap-3">
                <span className="minimalist-badge">
                  {enterpriseActivities.length} Total Activities
                </span>
                <button className="minimalist-button minimalist-button-primary">
                  <BarChart3 className="minimalist-icon" />
                  Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 minimalist-search-container">
                <Search className="minimalist-search-icon" />
                <input
                  type="text"
                  placeholder="Search activities by title, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="minimalist-input minimalist-search-input"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="minimalist-icon text-gray-500" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="minimalist-input w-32"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="assigned">Assigned</option>
                </select>
                
                <select className="minimalist-input w-32">
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <select className="minimalist-input w-32">
                  <option value="all">All Buildings</option>
                  <option value="building-a">Building A</option>
                  <option value="building-b">Building B</option>
                  <option value="building-c">Building C</option>
                </select>
              </div>
            </div>
          </div>

          <div className="minimalist-card-content flex-1 p-0">
            <EnterpriseActivityManager
              activities={enterpriseActivities}
              onActivitySelect={handleActivitySelect}
              onActivityAction={handleActivityAction}
              onBulkAction={handleBulkAction}
              realTimeMode={true}
              className="h-full"
            />
          </div>
        </div>

        {/* Communications Sidebar - 25% */}
        <div className="flex-[1] min-w-[320px] minimalist-panel">
          <div className="minimalist-card-header">
            <div className="minimalist-card-title">
              <Radio className="minimalist-icon" />
              Communications Hub
            </div>
          </div>
          
          <div className="minimalist-card-content flex-1 p-0">
            <CommunicationsPanel 
              onOpenModal={() => setShowRadioModal(true)}
              onOpenFullPage={() => setShowCommunicationsPage(true)}
              activities={enterpriseActivities}
              showAllTab={true}
              defaultTab="incidents"
              className="h-full"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="border-t border-gray-200 p-4">
            <div className="space-y-2">
              <button className="minimalist-button w-full text-left">
                <AlertTriangle className="minimalist-icon" />
                Emergency Broadcast
              </button>
              <button className="minimalist-button w-full text-left">
                <Users className="minimalist-icon" />
                All-Call Guards
              </button>
              <button className="minimalist-button w-full text-left">
                <MapPin className="minimalist-icon" />
                Location Check-in
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Activity Detail Modal */}
      {selectedActivityDetail && (
        <ResponsiveActivityDetail
          activity={{
            id: parseInt(selectedActivityDetail.id.toString()),
            type: selectedActivityDetail.type,
            title: selectedActivityDetail.title,
            description: selectedActivityDetail.description || '',
            location: selectedActivityDetail.location,
            time: selectedActivityDetail.timestamp,
            priority: selectedActivityDetail.priority,
            status: selectedActivityDetail.status,
            assignedTo: selectedActivityDetail.assignedTo || '',
            evidence: [],
            tags: []
          }}
          isOpen={!!selectedActivityDetail}
          onClose={() => setSelectedActivityDetail(null)}
          onUpdate={(activityId, updates) => {
            console.log('Activity update:', activityId, updates);
            setSelectedActivityDetail(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}

      {/* Radio Modal */}
      <RadioModal
        isOpen={showRadioModal}
        onClose={() => setShowRadioModal(false)}
        onOpenFullPage={() => {
          setShowRadioModal(false);
          setShowCommunicationsPage(true);
        }}
      />

      {/* Communications Page */}
      {showCommunicationsPage && (
        <div className="fixed inset-0 bg-white z-50">
          <CommunicationsPage
            onBackToCommandCenter={() => setShowCommunicationsPage(false)}
          />
        </div>
      )}
    </div>
  );
}