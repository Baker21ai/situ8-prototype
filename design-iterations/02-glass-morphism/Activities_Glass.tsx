import React, { useState } from 'react';
import { EnterpriseActivityManager } from '../../components/EnterpriseActivityManager';
import { ResponsiveActivityDetail } from '../../components/ResponsiveActivityDetail';
import { CommunicationsPanel } from '../../components/CommunicationsPanel';
import { RadioModal } from '../../components/RadioModal';
import { CommunicationsPage } from '../../components/CommunicationsPage';
import { enterpriseActivities, getFacilityStats } from '../../components/enterpriseMockData';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Building, 
  Camera, 
  Activity, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Radio,
  Headphones,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  MapPin,
  Eye,
  Wifi,
  Database,
  Layers,
  Globe,
  Cpu
} from 'lucide-react';
import './glass-morphism-styles.css';

export function Activities_Glass() {
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
      label: 'Neural Sensors', 
      color: 'text-cyan-400',
      change: '+12 quantum nodes',
      glow: 'glass-glow-accent'
    },
    { 
      icon: Activity, 
      value: facilityStats.totalActivities, 
      label: 'Active Patterns', 
      color: 'text-green-400',
      change: 'Neural processing',
      glow: 'glass-glow-success'
    },
    { 
      icon: AlertTriangle, 
      value: facilityStats.criticalToday, 
      label: 'Threat Vectors', 
      color: 'text-red-400', 
      critical: true,
      change: '3 neutralized',
      glow: 'glass-glow-critical'
    },
    { 
      icon: Building, 
      value: facilityStats.buildingsMonitored, 
      label: 'Sectors', 
      color: 'text-purple-400',
      change: 'All secure',
      glow: 'glass-glow-accent'
    },
    { 
      icon: Users, 
      value: facilityStats.employeesOnSite.toLocaleString(), 
      label: 'Bio-signatures', 
      color: 'text-orange-400',
      change: 'Optimal density',
      glow: 'glass-glow-success'
    },
    { 
      icon: TrendingUp, 
      value: facilityStats.systemUptime, 
      label: 'Neural Uptime', 
      color: 'text-teal-400',
      change: 'Quantum stable',
      glow: 'glass-glow-accent'
    },
    { 
      icon: Shield, 
      value: facilityStats.securityPersonnel, 
      label: 'Operatives', 
      color: 'text-indigo-400',
      change: '12 deployed',
      glow: 'glass-glow-success'
    },
    { 
      icon: Zap, 
      value: facilityStats.averageResponseTime, 
      label: 'Neural Response', 
      color: 'text-yellow-400',
      change: '15% faster',
      glow: 'glass-glow-accent'
    }
  ];

  return (
    <div className="glass-theme glass-background" data-design="glass">
      {/* Holographic Header */}
      <div className="glass-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>NEURAL ACTIVITY MATRIX</h1>
            <p>Advanced pattern recognition and threat assessment</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="glass-button glass-glow-success">
              <Download className="glass-icon" />
              EXTRACT DATA
            </button>
            <button className="glass-button glass-glow-accent">
              <RefreshCw className="glass-icon" />
              SYNC NEURAL NET
            </button>
            <button
              className="glass-button glass-button-primary"
              onClick={() => setShowRadioModal(true)}
            >
              <Radio className="glass-icon" />
              TACTICAL RADIO
            </button>
            <button
              className="glass-button glass-button-primary"
              onClick={() => setShowCommunicationsPage(true)}
            >
              <Headphones className="glass-icon" />
              NEURAL LINK
            </button>
          </div>
        </div>

        {/* Holographic System Overview */}
        <div className="glass-stats-grid mt-6">
          {statsData.map(({ icon: Icon, value, label, color, critical, change, glow }) => (
            <div 
              key={label} 
              className={`glass-stat-card ${glow} ${critical ? 'glass-priority-critical animate-pulse' : ''} hover:scale-105 transition-transform`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`glass-stat-icon ${color}`} />
                {critical && parseInt(value) > 0 && (
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse glass-glow-critical"></div>
                )}
              </div>
              <div className={`glass-stat-value ${critical ? 'text-red-400' : 'text-white'}`}>
                {value}
              </div>
              <div className="glass-stat-label uppercase tracking-wider">{label}</div>
              {change && (
                <div className="text-xs text-gray-400 mt-2 opacity-80">{change}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Matrix */}
      <div className="flex gap-6 p-6 h-[calc(100vh-280px)]">
        {/* Neural Activity Panel - 75% */}
        <div className="flex-[3] glass-panel">
          <div className="glass-card-header">
            <div className="flex items-center justify-between">
              <div className="glass-card-title">
                <Cpu className="glass-icon" />
                NEURAL ACTIVITY PROCESSOR
              </div>
              <div className="flex items-center gap-3">
                <span className="glass-badge glass-glow-accent">
                  {enterpriseActivities.length} ACTIVE PATTERNS
                </span>
                <button className="glass-button glass-button-primary glass-glow-accent">
                  <BarChart3 className="glass-icon" />
                  NEURAL ANALYTICS
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Search Interface */}
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 glass-search-container">
                <Search className="glass-search-icon" />
                <input
                  type="text"
                  placeholder="Search neural patterns and threat vectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input glass-search-input"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="glass-icon text-cyan-400 glass-glow-accent" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="glass-input w-32"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="new">NEW</option>
                  <option value="active">ACTIVE</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="assigned">ASSIGNED</option>
                </select>
                
                <select className="glass-input w-32">
                  <option value="all">ALL THREATS</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                  <option value="low">LOW</option>
                </select>
                
                <select className="glass-input w-32">
                  <option value="all">ALL SECTORS</option>
                  <option value="building-a">SECTOR ALPHA</option>
                  <option value="building-b">SECTOR BETA</option>
                  <option value="building-c">SECTOR GAMMA</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card-content flex-1 p-0">
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

        {/* Neural Communications Hub - 25% */}
        <div className="flex-[1] min-w-[320px] glass-panel">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Wifi className="glass-icon" />
              NEURAL COMMUNICATIONS HUB
            </div>
          </div>
          
          <div className="glass-card-content flex-1 p-0">
            <CommunicationsPanel 
              onOpenModal={() => setShowRadioModal(true)}
              onOpenFullPage={() => setShowCommunicationsPage(true)}
              activities={enterpriseActivities}
              showAllTab={true}
              defaultTab="incidents"
              className="h-full"
            />
          </div>
          
          {/* Tactical Operations */}
          <div className="border-t border-white/10 p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider mb-3">
                TACTICAL OPERATIONS
              </h3>
              <button className="glass-button glass-button-danger w-full text-left glass-glow-critical">
                <AlertTriangle className="glass-icon" />
                EMERGENCY BROADCAST
              </button>
              <button className="glass-button glass-glow-success w-full text-left">
                <Users className="glass-icon" />
                ALL-CALL OPERATIVES
              </button>
              <button className="glass-button glass-glow-accent w-full text-left">
                <MapPin className="glass-icon" />
                NEURAL PING
              </button>
              <button className="glass-button glass-glow-accent w-full text-left">
                <Eye className="glass-icon" />
                SURVEILLANCE MODE
              </button>
            </div>
            
            {/* System Status */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">SYSTEM STATUS</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Neural Network</span>
                  <div className="glass-status glass-status-new"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Quantum Encryption</span>
                  <div className="glass-status glass-status-new"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Threat Analysis</span>
                  <div className="glass-status glass-status-active"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Bio-metric Scanner</span>
                  <div className="glass-status glass-status-new"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holographic Activity Detail Modal */}
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

      {/* Neural Communications Interface */}
      {showCommunicationsPage && (
        <div className="fixed inset-0 glass-background z-50">
          <CommunicationsPage
            onBackToCommandCenter={() => setShowCommunicationsPage(false)}
          />
        </div>
      )}
    </div>
  );
}