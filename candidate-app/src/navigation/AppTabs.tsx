/**
 * AppTabs — the authenticated application shell.
 *
 * A bottom-tab navigator that is only ever mounted by {@link RootNavigator}
 * while the session is `authenticated`. Because the entire tab tree lives
 * behind that status check, none of these screens is reachable from an
 * unauthenticated session.
 *
 * Tabs:
 *   - `CatalogTab`   → a native-stack so the catalog can push the game detail
 *                      and the video player while keeping them inside the tab
 *                      (Catalog → GameDetail → VideoPlayer).
 *   - `FavoritesTab` → the user's favorited games.
 *   - `WishlistTab`  → the user's wishlisted games.
 *   - `HistoryTab`   → previously watched videos.
 *   - `ProfileTab`   → account view / edit / logout.
 *
 * The param lists below are kept coherent with the route params each screen
 * actually reads:
 *   - GameDetailScreen reads `route.params.slugOrId`.
 *   - VideoPlayerScreen reads `route.params.videoId` (falling back to `id`).
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CatalogScreen from '@/screens/catalog/CatalogScreen';
import GameDetailScreen from '@/screens/catalog/GameDetailScreen';
import VideoPlayerScreen from '@/screens/video/VideoPlayerScreen';
import FavoritesScreen from '@/screens/favorites/FavoritesScreen';
import WishlistScreen from '@/screens/favorites/WishlistScreen';
import WatchHistoryScreen from '@/screens/history/WatchHistoryScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

/**
 * Routes inside the Catalog native-stack. Detail and player are pushed onto
 * this stack so they remain within the Catalog tab.
 */
export type CatalogStackParamList = {
  /** Catalog list — no params. */
  Catalog: undefined;
  /** Game detail — fetched by slug or UUID. */
  GameDetail: { slugOrId: string };
  /** Video player — gated playback for a single video id. */
  VideoPlayer: { videoId: string };
};

/** The bottom-tab routes that make up the authenticated app shell. */
export type AppTabsParamList = {
  CatalogTab: undefined;
  FavoritesTab: undefined;
  WishlistTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};

const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();

/** Catalog → GameDetail → VideoPlayer, so detail and player are reachable. */
function CatalogNavigator(): React.ReactElement {
  return (
    <CatalogStack.Navigator initialRouteName="Catalog">
      <CatalogStack.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ title: 'Games' }}
      />
      <CatalogStack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={{ title: 'Details' }}
      />
      <CatalogStack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ title: 'Watch' }}
      />
    </CatalogStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs(): React.ReactElement {
  return (
    <Tab.Navigator initialRouteName="CatalogTab">
      <Tab.Screen
        name="CatalogTab"
        component={CatalogNavigator}
        options={{ title: 'Catalog', headerShown: false }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{ title: 'Wishlist' }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={WatchHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default AppTabs;
