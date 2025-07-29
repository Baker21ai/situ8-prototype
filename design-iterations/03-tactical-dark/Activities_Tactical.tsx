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
  Activity as _Activity, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Radio,
  Headphones as _Headphones,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Clock as _Clock,
  MapPin as _MapPin,
  Eye,
  Crosshair,
  Radar,
  Signal,
  Target,
  Settings as _Settings,
  Database as _Database,
  Layers as _Layers,
  Globe as _Globe,
  Cpu
} from 'lucide-react';
import './tactical-dark-styles.css';

export function Activities_Tactical() {
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
      label: 'SURVEILLANCE NODES', 
      color: 'text-green-400',
      change: '+12 TACTICAL UNITS'
    },
    { 
      icon: Radar, 
      value: facilityStats.totalActivities, 
      label: 'ACTIVE CONTACTS', 
      color: 'text-green-400',
      change: 'TRACKING ACTIVE'
    },
    { 
      icon: AlertTriangle, 
      value: facilityStats.criticalToday, 
      label: 'CRITICAL THREATS', 
      color: 'text-red-400', 
      critical: true,
      change: '3 NEUTRALIZED'
    },
    { 
      icon: Building, 
      value: facilityStats.buildingsMonitored, 
      label: 'SECTORS', 
      color: 'text-amber-400',
      change: 'ALL SECURE'
    },
    { 
      icon: Users, 
      value: facilityStats.employeesOnSite.toLocaleString(), 
      label: 'PERSONNEL', 
      color: 'text-blue-400',
      change: 'OPTIMAL DEPLOYMENT'
    },
    { 
      icon: TrendingUp, 
      value: facilityStats.systemUptime, 
      label: 'SYSTEM STATUS', 
      color: 'text-green-400',
      change: 'OPERATIONAL'
    },
    { 
      icon: Shield, 
      value: facilityStats.securityPersonnel, 
      label: 'TACTICAL UNITS', 
      color: 'text-green-400',
      change: '12 DEPLOYED'
    },
    { 
      icon: Zap, 
      value: facilityStats.averageResponseTime, 
      label: 'RESPONSE TIME', 
      color: 'text-amber-400',
      change: '15% FASTER'
    }
  ];

  return (
    <div className="tactical-theme tactical-background" data-design="tactical">
      {/* Tactical Command Header */}
      <div className="tactical-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>TACTICAL OPERATIONS CENTER</h1>
            <p>ADVANCED THREAT DETECTION & TACTICAL RESPONSE</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="tactical-button tactical-button-primary">
              <Download className="tactical-icon" />
              EXTRACT
            </button>
            <button className="tactical-button tactical-button-primary">
              <RefreshCw className="tactical-icon" />
              SYNC
            </button>
            <button
              className="tactical-button tactical-button-blue"
              onClick={() => setShowRadioModal(true)}
            >
              <Radio className="tactical-icon" />
              TAC-RADIO
            </button>
            <button
              className="tactical-button tactical-button-blue"
              onClick={() => setShowCommunicationsPage(true)}
            >
              <Signal className="tactical-icon" />
              COMMS
            </button>
          </div>
        </div>

        {/* Tactical HUD Overview */}
        <div className="tactical-stats-grid mt-4">
          {statsData.map(({ icon: Icon, value, label, color, critical, change }) => (
            <div 
              key={label} 
              className={`tactical-stat-card tactical-hud-element ${critical ? 'tactical-alert-critical' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={`tactical-stat-icon ${color}`} />
                {critical && parseInt(value) > 0 && (
                  <div className="w-2 h-2 bg-red-400 rounded-sm animate-pulse"></div>
                )}
              </div>
              <div className={`tactical-stat-value ${critical ? 'text-red-400' : 'text-green-400'}`}>
                {value}
              </div>
              <div className="tactical-stat-label">{label}</div>
              {change && (
                <div className="text-xs text-gray-500 mt-1 font-mono">{change}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Tactical Interface */}
      <div className="flex gap-4 p-4 h-[calc(100vh-240px)]">
        {/* Tactical Operations Panel - 75% */}
        <div className="flex-[3] tactical-panel">
          <div className="tactical-card-header">
            <div className="flex items-center justify-between">
              <div className="tactical-card-title">
                <Target className="tactical-icon" />
                TACTICAL OPERATIONS PROCESSOR
              </div>
              <div className="flex items-center gap-2">
                <span className="tactical-badge tactical-badge-low">
                  {enterpriseActivities.length} ACTIVE CONTACTS
                </span>
                <button className="tactical-button tactical-button-primary">
                  <BarChart3 className="tactical-icon" />
                  ANALYTICS
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Tactical Search */}
          <div className="border-b border-gray-800 p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 tactical-search-container">
                <Search className="tactical-search-icon" />
                <input
                  type="text"
                  placeholder="SEARCH THREATS AND TACTICAL CONTACTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tactical-input tactical-search-input"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="tactical-icon text-green-400" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="tactical-input w-24"
                >
                  <option value="all">ALL</option>
                  <option value="new">NEW</option>
                  <option value="active">ACTIVE</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="assigned">ASSIGNED</option>
                </select>
                
                <select className="tactical-input w-24">
                  <option value="all">THREATS</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                  <option value="low">LOW</option>
                </select>
                
                <select className="tactical-input w-24">
                  <option value="all">SECTORS</option>
                  <option value="building-a">ALPHA</option>
                  <option value="building-b">BRAVO</option>
                  <option value="building-c">CHARLIE</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tactical-card-content flex-1 p-0">
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

        {/* Tactical Communications Hub - 25% */}
        <div className="flex-[1] min-w-[300px] tactical-panel">
          <div className="tactical-card-header">
            <div className="tactical-card-title">
              <Signal className="tactical-icon" />
              TAC-COMMS HUB
            </div>
          </div>
          
          <div className="tactical-card-content flex-1 p-0">
            <CommunicationsPanel 
              onOpenModal={() => setShowRadioModal(true)}
              onOpenFullPage={() => setShowCommunicationsPage(true)}
              activities={enterpriseActivities}
              showAllTab={true}
              defaultTab="incidents"
              className="h-full"
            />
          </div>
          
          {/* Tactical Command Operations */}
          <div className="border-t border-gray-800 p-3">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-green-400 mb-2">
                TACTICAL COMMANDS
              </h3>
              <button className="tactical-button tactical-button-danger w-full text-left">
                <AlertTriangle className="tactical-icon" />
                EMERGENCY PROTOCOL
              </button>
              <button className="tactical-button tactical-button-primary w-full text-left">
                <Users className="tactical-icon" />
                ALL-CALL UNITS
              </button>
              <button className="tactical-button tactical-button-blue w-full text-left">
                <Crosshair className="tactical-icon" />
                TACTICAL PING
              </button>
              <button className="tactical-button tactical-button-blue w-full text-left">
                <Eye className="tactical-icon" />
                SURVEILLANCE MODE
              </button>
            </div>
            
            {/* System Status Terminal */}
            <div className="mt-4 pt-3 border-t border-gray-800">
              <h4 className="text-xs text-green-400 mb-2 font-bold">SYSTEM STATUS</h4>
              <div className="tactical-terminal">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span>TACTICAL NET</span>
                    <div className="tactical-status tactical-status-new"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ENCRYPTION</span>
                    <div className="tactical-status tactical-status-new"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>THREAT SCAN</span>
                    <div className="tactical-status tactical-status-active"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>BIO-METRICS</span>
                    <div className="tactical-status tactical-status-new"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI ANALYSIS</span>
                    <div className="tactical-status tactical-status-active"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Activity Detail Modal */}
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

      {/* Tactical Radio Modal */}
      <RadioModal
        isOpen={showRadioModal}
        onClose={() => setShowRadioModal(false)}
        onOpenFullPage={() => {
          setShowRadioModal(false);
          setShowCommunicationsPage(true);
        }}
      />

      {/* Tactical Communications Interface */}
      {showCommunicationsPage && (
        <div className="fixed inset-0 tactical-background z-50">
          <CommunicationsPage
            onBackToCommandCenter={() => setShowCommunicationsPage(false)}
          />
        </div>
      )}
    </div>
  );
}