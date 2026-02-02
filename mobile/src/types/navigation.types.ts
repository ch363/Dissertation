/**
 * Navigation Type Definitions
 *
 * Type-safe navigation props and route types for Expo Router
 */

/**
 * Base route structure
 */
export interface Route {
  key: string;
  name: string;
  state?: {
    index?: number;
    routes?: Route[];
  };
}

/**
 * Navigation state
 */
export interface NavigationState {
  index: number;
  routes: Route[];
}

/**
 * Route descriptor with options
 */
export interface RouteDescriptor {
  options?: {
    title?: string;
    tabBarLabel?: string;
    headerShown?: boolean;
    [key: string]: unknown;
  };
  render?: () => React.ReactElement;
}

/**
 * Navigation object methods
 */
export interface Navigation {
  emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
  navigate: (name: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
  setParams: (params: Record<string, unknown>) => void;
}

/**
 * Custom Tab Bar Props
 */
export interface CustomTabBarProps {
  state: NavigationState;
  descriptors: Record<string, RouteDescriptor>;
  navigation: Navigation;
}

/**
 * Tab icon names
 */
export type TabIconName = 'home' | 'book' | 'person' | 'settings';
