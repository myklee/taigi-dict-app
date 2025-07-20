// Route definitions for the Taigi dictionary application
// All components are lazy-loaded with specific chunk names for optimal bundle splitting

export const routes = [
  // Public routes - accessible to all users
  {
    path: '/',
    name: 'dictionary',
    component: () => import(/* webpackChunkName: "dictionary" */ '@/views/DictionarySearch.vue'),
    meta: {
      title: 'Taigi Dictionary'
    }
  },
  {
    path: '/search/:query?',
    name: 'search',
    component: () => import(/* webpackChunkName: "dictionary" */ '@/views/DictionarySearch.vue'),
    props: true,
    meta: {
      title: 'Search Results'
    }
  },
  {
    path: '/word/:id',
    name: 'word-detail',
    component: () => import(/* webpackChunkName: "word-detail" */ '@/views/WordDetail.vue'),
    props: true,
    meta: {
      title: 'Word Detail'
    }
  },
  {
    path: '/random',
    name: 'random-word',
    component: () => import(/* webpackChunkName: "random-word" */ '@/views/RandomWord.vue'),
    meta: {
      title: 'Random Word'
    }
  },
  {
    path: '/comparison',
    name: 'comparison',
    component: () => import(/* webpackChunkName: "comparison" */ '@/views/ComparisonTable.vue'),
    meta: {
      title: 'Dictionary Comparison'
    }
  },

  // Protected routes - require authentication
  {
    path: '/profile',
    name: 'profile',
    component: () => import(/* webpackChunkName: "user-profile" */ '@/views/UserProfile.vue'),
    meta: {
      requiresAuth: true,
      title: 'User Profile'
    }
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import(/* webpackChunkName: "user-favorites" */ '@/views/Favorites.vue'),
    meta: {
      requiresAuth: true,
      title: 'Favorites'
    }
  },
  {
    path: '/history',
    name: 'search-history',
    component: () => import(/* webpackChunkName: "user-history" */ '@/views/SearchHistory.vue'),
    meta: {
      requiresAuth: true,
      title: 'Search History'
    }
  },
  {
    path: '/edit-word/:id?',
    name: 'edit-word',
    component: () => import(/* webpackChunkName: "edit-word" */ '@/views/EditWord.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Edit Word'
    }
  },
  {
    path: '/edit-word-mknoll/:id?',
    name: 'edit-word-mknoll',
    component: () => import(/* webpackChunkName: "edit-word-mknoll" */ '@/views/EditWordMknoll.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Edit Word (Mknoll)'
    }
  },

  // Admin routes - require admin role
  {
    path: '/admin',
    name: 'admin',
    component: () => import(/* webpackChunkName: "admin-dashboard" */ '@/components/AdminDashboard.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Admin Dashboard'
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import(/* webpackChunkName: "admin-dashboard" */ '@/components/AdminDashboard.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'Admin Dashboard'
        }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import(/* webpackChunkName: "admin-users" */ '@/components/UserManagementPanel.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'User Management'
        }
      },
      {
        path: 'moderation',
        name: 'admin-moderation',
        component: () => import(/* webpackChunkName: "admin-moderation" */ '@/components/CommunityModerationPanel.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'Content Moderation'
        }
      },
      {
        path: 'community',
        name: 'admin-community',
        component: () => import(/* webpackChunkName: "admin-community" */ '@/components/CommunitySubmissionManager.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: 'Community Management'
        }
      }
    ]
  },

  // Error handling routes
  {
    path: '/404',
    name: 'not-found',
    component: () => import(/* webpackChunkName: "error-pages" */ '@/views/NotFound.vue'),
    meta: {
      title: 'Page Not Found'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'catch-all',
    redirect: '/404'
  }
]