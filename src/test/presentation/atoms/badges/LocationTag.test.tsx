import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  LocationTag, 
  LocationTagSite,
  LocationTagBuilding,
  LocationTagZone,
  LocationTagRoom,
  HierarchicalLocation,
  LocationTagProps 
} from '../../../../presentation/atoms/badges/LocationTag';

// Mock the Badge component
vi.mock('../../../../../components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <div data-testid="location-badge" className={className} {...props}>
      {children}
    </div>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MapPin: ({ className, ...props }: any) => (
    <div data-testid="map-pin-icon" className={className} {...props} aria-hidden="true" />
  ),
  Building: ({ className, ...props }: any) => (
    <div data-testid="building-icon" className={className} {...props} aria-hidden="true" />
  ),
  Navigation: ({ className, ...props }: any) => (
    <div data-testid="navigation-icon" className={className} {...props} aria-hidden="true" />
  ),
}));

describe('LocationTag', () => {
  const defaultProps: LocationTagProps = {
    location: 'Building A'
  };

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<LocationTag {...defaultProps} />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Building A');
    });

    it('should render different location types', () => {
      const locations = [
        { location: 'East Campus', type: 'site' as const },
        { location: 'Building B', type: 'building' as const },
        { location: 'Zone 3', type: 'zone' as const },
        { location: 'Room 101', type: 'room' as const }
      ];
      
      locations.forEach(({ location, type }) => {
        const { rerender } = render(<LocationTag location={location} type={type} />);
        
        const badge = screen.getByTestId('location-badge');
        expect(badge).toHaveTextContent(location);
        
        rerender(<div />);
      });
    });
  });

  describe('Type-based styling', () => {
    it('should apply site styles (purple theme)', () => {
      render(<LocationTag location="East Campus" type="site" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('bg-purple-500/20');
      expect(badge.className).toContain('border-purple-500');
      expect(badge.className).toContain('text-purple-300');
    });

    it('should apply building styles (blue theme)', () => {
      render(<LocationTag location="Building A" type="building" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('bg-blue-500/20');
      expect(badge.className).toContain('border-blue-500');
      expect(badge.className).toContain('text-blue-300');
    });

    it('should apply zone styles (green theme)', () => {
      render(<LocationTag location="Zone 3" type="zone" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('bg-green-500/20');
      expect(badge.className).toContain('border-green-500');
      expect(badge.className).toContain('text-green-300');
    });

    it('should apply room styles (gray theme)', () => {
      render(<LocationTag location="Room 101" type="room" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('bg-gray-500/20');
      expect(badge.className).toContain('border-gray-500');
      expect(badge.className).toContain('text-gray-300');
    });
  });

  describe('Size variants', () => {
    it('should apply extra small size styles', () => {
      render(<LocationTag {...defaultProps} size="xs" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('text-xs');
      expect(badge.className).toContain('px-1');
      expect(badge.className).toContain('py-0.5');
    });

    it('should apply small size styles (default)', () => {
      render(<LocationTag {...defaultProps} size="sm" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('text-xs');
      expect(badge.className).toContain('px-1.5');
      expect(badge.className).toContain('py-0.5');
    });

    it('should apply medium size styles', () => {
      render(<LocationTag {...defaultProps} size="md" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('text-sm');
      expect(badge.className).toContain('px-2');
      expect(badge.className).toContain('py-1');
    });

    it('should apply large size styles', () => {
      render(<LocationTag {...defaultProps} size="lg" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('text-base');
      expect(badge.className).toContain('px-3');
      expect(badge.className).toContain('py-1.5');
    });

    it('should apply extra large size styles', () => {
      render(<LocationTag {...defaultProps} size="xl" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('text-lg');
      expect(badge.className).toContain('px-4');
      expect(badge.className).toContain('py-2');
    });
  });

  describe('Variant styles', () => {
    it('should apply default variant styles', () => {
      render(<LocationTag location="East Campus" type="site" variant="default" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('bg-purple-500/20');
      expect(badge.className).toContain('border-purple-500');
      expect(badge.className).toContain('text-purple-300');
    });

    it('should apply outline variant styles', () => {
      render(<LocationTag location="East Campus" type="site" variant="outline" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('border-purple-500');
      expect(badge.className).toContain('text-purple-300');
      expect(badge.className).toContain('bg-transparent');
      expect(badge.className).toContain('border');
    });

    it('should apply minimal variant styles', () => {
      render(<LocationTag location="East Campus" type="site" variant="minimal" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain('text-purple-300');
      expect(badge.className).toContain('bg-transparent');
    });
  });

  describe('Icon display', () => {
    it('should show building icon for site and building types', () => {
      render(<LocationTag location="East Campus" type="site" showIcon={true} />);
      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
      
      render(<LocationTag location="Building A" type="building" showIcon={true} />);
      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
    });

    it('should show navigation icon for zone type', () => {
      render(<LocationTag location="Zone 3" type="zone" showIcon={true} />);
      expect(screen.getByTestId('navigation-icon')).toBeInTheDocument();
    });

    it('should show map pin icon for room type', () => {
      render(<LocationTag location="Room 101" type="room" showIcon={true} />);
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    });

    it('should not show icon when showIcon is false (default)', () => {
      render(<LocationTag {...defaultProps} showIcon={false} />);
      
      expect(screen.queryByTestId('building-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigation-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('map-pin-icon')).not.toBeInTheDocument();
    });

    it('should apply correct icon size and color', () => {
      render(<LocationTag location="East Campus" type="site" showIcon={true} size="lg" />);
      
      const icon = screen.getByTestId('building-icon');
      expect(icon.className).toContain('h-5 w-5');
      expect(icon.className).toContain('text-purple-400');
    });
  });

  describe('Custom styling', () => {
    it('should apply custom className', () => {
      const customClass = 'custom-location-class';
      render(<LocationTag {...defaultProps} className={customClass} />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain(customClass);
    });

    it('should combine custom className with default styles', () => {
      const customClass = 'border-4';
      render(<LocationTag {...defaultProps} className={customClass} />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge.className).toContain(customClass);
      expect(badge.className).toContain('font-medium');
      expect(badge.className).toContain('inline-flex');
    });
  });

  describe('Accessibility', () => {
    it('should have proper icon accessibility attributes', () => {
      render(<LocationTag location="East Campus" type="site" showIcon={true} />);
      
      const icon = screen.getByTestId('building-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be readable by screen readers', () => {
      render(<LocationTag location="Building A" type="building" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toHaveTextContent('Building A');
      expect(badge).toBeVisible();
    });
  });

  describe('Specialized variants', () => {
    it('should render LocationTagSite correctly', () => {
      render(<LocationTagSite location="East Campus" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toHaveTextContent('East Campus');
      expect(badge.className).toContain('bg-purple-500/20');
    });

    it('should render LocationTagBuilding correctly', () => {
      render(<LocationTagBuilding location="Building A" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toHaveTextContent('Building A');
      expect(badge.className).toContain('bg-blue-500/20');
    });

    it('should render LocationTagZone correctly', () => {
      render(<LocationTagZone location="Zone 3" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toHaveTextContent('Zone 3');
      expect(badge.className).toContain('bg-green-500/20');
    });

    it('should render LocationTagRoom correctly', () => {
      render(<LocationTagRoom location="Room 101" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toHaveTextContent('Room 101');
      expect(badge.className).toContain('bg-gray-500/20');
    });
  });

  describe('HierarchicalLocation', () => {
    it('should render hierarchical location structure', () => {
      render(
        <HierarchicalLocation
          site="East Campus"
          building="Building A"
          zone="Zone 3"
          room="Room 101"
        />
      );
      
      expect(screen.getByText('East Campus')).toBeInTheDocument();
      expect(screen.getByText('Building A')).toBeInTheDocument();
      expect(screen.getByText('Zone 3')).toBeInTheDocument();
      expect(screen.getByText('Room 101')).toBeInTheDocument();
    });

    it('should render only provided location levels', () => {
      render(
        <HierarchicalLocation
          site="East Campus"
          building="Building A"
        />
      );
      
      expect(screen.getByText('East Campus')).toBeInTheDocument();
      expect(screen.getByText('Building A')).toBeInTheDocument();
      expect(screen.queryByText('Zone')).not.toBeInTheDocument();
    });

    it('should render with default separator', () => {
      render(
        <HierarchicalLocation
          site="East Campus"
          building="Building A"
        />
      );
      
      expect(screen.getByText('›')).toBeInTheDocument();
    });

    it('should render with custom separator', () => {
      render(
        <HierarchicalLocation
          site="East Campus"
          building="Building A"
          separator=" | "
        />
      );
      
      expect(screen.getByText('|')).toBeInTheDocument();
    });

    it('should return null when no locations provided', () => {
      const { container } = render(<HierarchicalLocation />);
      expect(container.firstChild).toBeNull();
    });

    it('should apply correct variants for hierarchy levels', () => {
      render(
        <HierarchicalLocation
          site="East Campus"
          building="Building A"
        />
      );
      
      const badges = screen.getAllByTestId('location-badge');
      
      // First level (site) should use default variant
      expect(badges[0].className).toContain('bg-purple-500/20');
      
      // Subsequent levels should use minimal variant
      expect(badges[1].className).toContain('bg-transparent');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty location string', () => {
      render(<LocationTag location="" />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('');
    });

    it('should handle very long location names', () => {
      const longLocation = 'This is a very long location name that might overflow';
      render(<LocationTag location={longLocation} />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toHaveTextContent(longLocation);
    });

    it('should handle special characters in location names', () => {
      const specialLocation = 'Building A-1 (North Wing) & Annexe';
      render(<LocationTag location={specialLocation} />);
      
      const badge = screen.getByTestId('location-badge');
      expect(badge).toHaveTextContent(specialLocation);
    });

    it('should work with all combinations of props', () => {
      const types = ['site', 'building', 'zone', 'room'] as const;
      const variants = ['default', 'outline', 'minimal'] as const;
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      
      types.forEach(type => {
        variants.forEach(variant => {
          sizes.forEach(size => {
            const { rerender } = render(
              <LocationTag 
                location="Test Location"
                type={type}
                variant={variant}
                size={size}
                showIcon={true}
              />
            );
            
            const badge = screen.getByTestId('location-badge');
            expect(badge).toBeInTheDocument();
            expect(badge).toHaveTextContent('Test Location');
            
            rerender(<div />);
          });
        });
      });
    });
  });

  describe('Snapshot tests', () => {
    it('should match snapshot for default variant', () => {
      const { container } = render(<LocationTag location="Building A" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for site with icon', () => {
      const { container } = render(<LocationTag location="East Campus" type="site" showIcon />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot for hierarchical location', () => {
      const { container } = render(
        <HierarchicalLocation
          site="East Campus"
          building="Building A"
          zone="Zone 3"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
