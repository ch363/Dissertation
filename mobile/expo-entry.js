// Global polyfills must load before anything else
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// Ensure theme tokens are initialized before any screen/layout uses theme (avoids Hermes "Property 'theme' doesn't exist")
import './src/services/theme/tokens';

import 'expo-router/entry';
