# Visitor Management System

A comprehensive visitor management system for the Situ8 platform that integrates with Lenel access control and supports configurable third-party integrations.

## Overview

This visitor management system provides:
- **Lenel OnGuard Integration**: Full integration with Lenel access control systems
- **Modular Architecture**: Support for multiple third-party providers (HID EasyLobby, custom APIs)
- **Real-time Synchronization**: Bidirectional sync with external systems
- **Configurable Workflows**: Automated visitor processing based on custom rules
- **Comprehensive Dashboard**: Real-time visitor tracking and management
- **Advanced Security**: Background checks, watchlist screening, and access control
- **Compliance Ready**: GDPR, CCPA, and other privacy regulation support

## Architecture

### Core Components

1. **Visitor Service** (`visitor.service.ts`)
   - Manages visitor CRUD operations
   - Handles check-in/check-out processes
   - Synchronizes with external systems
   - Provides real-time status updates

2. **Configuration Service** (`visitor-config.service.ts`)
   - Manures third-party integrations
   - Configures workflows and automation rules
   - Handles provider-specific settings
   - Supports import/export of configurations

3. **Type Definitions** (`lib/types/visitor.ts`)
   - Comprehensive visitor entity model
   - Integration-specific data structures
   - Configuration schemas
   - API request/response types

4. **UI Components**
   - `VisitorManagementDashboard.tsx`: Main dashboard for visitor management
   - `VisitorManagementConfig.tsx`: Configuration interface for admins

### Integration Support

#### Lenel OnGuard
- **Cardholder Management**: Automatic creation of temporary cardholders
- **Access Level Assignment**: Dynamic clearance level management
- **Badge Generation**: Automated visitor badge creation
- **Real-time Sync**: Bidirectional synchronization of visitor data
- **Event Integration**: Visitor events integrated with Lenel security events

#### HID EasyLobby
- **Pre-registration**: Support for advance visitor registration
- **Photo Capture**: Integrated photo capture and storage
- **Watchlist Screening**: Automated background checks
- **Document Management**: Visitor document storage and verification
- **Reporting**: Comprehensive visitor reporting and analytics

#### Custom APIs
- **RESTful Integration**: Standard REST API integration pattern
- **Webhook Support**: Real-time notifications and updates
- **Custom Fields**: Extensible data model for custom requirements
- **Rate Limiting**: Built-in rate limiting and retry logic

## Usage

### Basic Setup

1. **Enable Visitor Management**
   ```typescript
   import { VisitorConfigService } from './services/visitor-config.service';
   
   const configService = new VisitorConfigService();
   await configService.updateConfiguration({
     enabled: true,
     integration_type: 'lenel_onguard',
     // ... other configuration
   });
   ```

2. **Add a Visitor**
   ```typescript
   import { VisitorService } from './services/visitor.service';
   
   const visitorService = new VisitorService();
   const response = await visitorService.createVisitor({
     first_name: 'John',
     last_name: 'Doe',
     email: 'john.doe@company.com',
     company: 'Tech Corp',
     host_user_id: 'user-123',
     host_name: 'Jane Smith',
     purpose: 'Business meeting',
     expected_arrival: new Date('2024-01-15T09:00:00Z'),
     expected_departure: new Date('2024-01-15T17:00:00Z'),
     site_id: 'SITE-001',
     access_level: 'VISITOR'
   });
   ```

3. **Check-in Visitor**
   ```typescript
   const checkInResponse = await visitorService.checkIn(visitorId, {
     location_id: 'SITE-001',
     check_in_method: 'kiosk',
     badge_number: 'TEMP-001'
   });
   ```

### Configuration Examples

#### Lenel OnGuard Configuration
```json
{
  "lenel_config": {
    "server_url": "https://lenel.example.com",
    "database_connection": "lenel_db",
    "card_format": "H10301",
    "clearance_levels": ["VISITOR", "CONTRACTOR", "VIP"],
    "visitor_card_type": "TEMP",
    "default_expiry_hours": 8
  }
}
```

#### HID EasyLobby Configuration
```json
{
  "easylobby_config": {
    "server_url": "https://easylobby.example.com",
    "api_key": "your-api-key",
    "watchlist_check": true,
    "photo_required": true,
    "background_check": true
  }
}
```

#### Custom API Configuration
```json
{
  "custom_api_config": {
    "base_url": "https://custom-api.example.com",
    "api_key": "your-api-key",
    "timeout_ms": 30000,
    "retry_count": 3,
    "webhook_url": "https://your-app.com/webhook"
  }
}
```

## UI Components

### VisitorManagementDashboard

Main dashboard component for viewing and managing visitors:

```tsx
import { VisitorManagementDashboard } from './components/VisitorManagementDashboard';

function App() {
  return (
    <div>
      <h1>Visitor Management</h1>
      <VisitorManagementDashboard />
    </div>
  );
}
```

### VisitorManagementConfig

Configuration interface for administrators:

```tsx
import { VisitorManagementConfig } from './components/VisitorManagementConfig';

function AdminPanel() {
  return (
    <div>
      <h1>Visitor Management Configuration</h1>
      <VisitorManagementConfig />
    </div>
  );
}
```

## API Endpoints

### Visitor Operations
- `GET /api/visitors` - List visitors with filtering and pagination
- `POST /api/visitors` - Create new visitor
- `GET /api/visitors/:id` - Get visitor details
- `PUT /api/visitors/:id` - Update visitor information
- `DELETE /api/visitors/:id` - Remove visitor
- `POST /api/visitors/:id/check-in` - Check in visitor
- `POST /api/visitors/:id/check-out` - Check out visitor

### Configuration Operations
- `GET /api/visitor-config` - Get current configuration
- `PUT /api/visitor-config` - Update configuration
- `POST /api/visitor-config/import` - Import configuration
- `GET /api/visitor-config/export` - Export configuration

## Security Features

### Access Control
- **Role-based Permissions**: Different access levels for different user roles
- **Audit Logging**: Complete audit trail of all visitor activities
- **Data Encryption**: End-to-end encryption for sensitive data
- **API Security**: OAuth 2.0 and API key authentication

### Compliance
- **GDPR Compliance**: Right to be forgotten, data portability
- **CCPA Compliance**: California Consumer Privacy Act requirements
- **Data Retention**: Configurable data retention policies
- **Privacy Controls**: Granular privacy settings

## Testing

Run the test suite:

```bash
npm test visitor-management
```

Run integration tests:

```bash
npm run test:integration
```

## Deployment

### Environment Variables
```bash
# Lenel Configuration
LENEL_SERVER_URL=https://lenel.example.com
LENEL_DATABASE_CONNECTION=lenel_db
LENEL_CARD_FORMAT=H10301

# HID EasyLobby Configuration
EASYLOBBY_API_KEY=your-api-key
EASYLOBBY_SERVER_URL=https://easylobby.example.com

# Custom API Configuration
CUSTOM_API_BASE_URL=https://custom-api.example.com
CUSTOM_API_KEY=your-api-key

# General Configuration
VISITOR_MANAGEMENT_ENABLED=true
DATA_RETENTION_DAYS=90
ENCRYPTION_KEY=your-encryption-key
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Integration Sync Failures**
   - Check network connectivity to external systems
   - Verify API credentials and permissions
   - Review error logs for specific error messages

2. **Visitor Check-in Issues**
   - Verify access level configuration
   - Check badge/card availability
   - Ensure proper permissions for check-in staff

3. **Configuration Problems**
   - Validate configuration JSON syntax
   - Check required fields are populated
   - Verify provider-specific settings

### Debug Mode
Enable debug logging:
```bash
DEBUG=visitor-management:* npm start
```

## Support

For technical support or questions:
- Check the troubleshooting section above
- Review the test files for usage examples
- Consult the type definitions for API documentation
- Contact the development team for integration-specific questions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This visitor management system is part of the Situ8 platform and follows the same license terms.