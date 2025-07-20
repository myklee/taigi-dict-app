import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import NotFound from '../NotFound.vue'

// Mock router
const mockRouter = {
  go: vi.fn(),
  push: vi.fn()
}

const mockRoute = {
  fullPath: '/invalid-route?param=value'
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => mockRouter,
    useRoute: () => mockRoute
  }
})

describe('NotFound Component', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    wrapper = mount(NotFound, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
            props: ['to']
          }
        },
        mocks: {
          $route: mockRoute
        }
      }
    })
  })

  describe('Component Rendering', () => {
    it('should render the 404 error message', () => {
      expect(wrapper.find('.error-title').text()).toBe('404 - Page Not Found')
      expect(wrapper.find('.error-message').text()).toContain("The page you're looking for doesn't exist")
    })

    it('should render navigation buttons', () => {
      const buttons = wrapper.findAll('.btn')
      expect(buttons).toHaveLength(2)
      
      const dictionaryLink = wrapper.find('a') // router-link stub
      expect(dictionaryLink.exists()).toBe(true)
      
      const backButton = wrapper.find('.btn-secondary')
      expect(backButton.text()).toBe('Go Back')
    })

    it('should render error details toggle button', () => {
      const toggleButton = wrapper.find('.toggle-details')
      expect(toggleButton.exists()).toBe(true)
      expect(toggleButton.text()).toBe('Show Details')
    })
  })

  describe('Error Details', () => {
    it('should initially hide error details', () => {
      const errorDetails = wrapper.find('.error-details')
      expect(errorDetails.exists()).toBe(false)
    })

    it('should show error details when toggle is clicked', async () => {
      const toggleButton = wrapper.find('.toggle-details')
      await toggleButton.trigger('click')
      
      const errorDetails = wrapper.find('.error-details')
      expect(errorDetails.exists()).toBe(true)
      expect(toggleButton.text()).toBe('Hide Details')
    })

    it('should display the requested path in error details', async () => {
      const toggleButton = wrapper.find('.toggle-details')
      await toggleButton.trigger('click')
      
      const errorPath = wrapper.find('.error-path')
      expect(errorPath.text()).toContain('/invalid-route?param=value')
    })

    it('should display the error time in error details', async () => {
      const toggleButton = wrapper.find('.toggle-details')
      await toggleButton.trigger('click')
      
      const errorTime = wrapper.find('.error-time')
      expect(errorTime.text()).toContain('Time:')
    })

    it('should toggle error details visibility', async () => {
      const toggleButton = wrapper.find('.toggle-details')
      
      // Show details
      await toggleButton.trigger('click')
      expect(wrapper.find('.error-details').exists()).toBe(true)
      expect(toggleButton.text()).toBe('Hide Details')
      
      // Hide details
      await toggleButton.trigger('click')
      expect(wrapper.find('.error-details').exists()).toBe(false)
      expect(toggleButton.text()).toBe('Show Details')
    })
  })

  describe('Navigation Functionality', () => {
    it('should call router.go(-1) when go back button is clicked and history exists', async () => {
      // Mock window.history.length to simulate browser history
      Object.defineProperty(window, 'history', {
        value: { length: 5 },
        writable: true
      })
      
      const backButton = wrapper.find('.btn-secondary')
      await backButton.trigger('click')
      
      expect(mockRouter.go).toHaveBeenCalledWith(-1)
    })

    it('should navigate to home when go back button is clicked and no history exists', async () => {
      // Mock window.history.length to simulate no browser history
      Object.defineProperty(window, 'history', {
        value: { length: 1 },
        writable: true
      })
      
      const backButton = wrapper.find('.btn-secondary')
      await backButton.trigger('click')
      
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })
  })

  describe('Component Lifecycle', () => {
    it('should set error time on mount', () => {
      expect(wrapper.vm.errorTime).toBeTruthy()
      expect(typeof wrapper.vm.errorTime).toBe('string')
    })

    it('should initialize showDetails as false', () => {
      expect(wrapper.vm.showDetails).toBe(false)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive CSS classes', () => {
      expect(wrapper.find('.not-found-container').exists()).toBe(true)
      expect(wrapper.find('.not-found-content').exists()).toBe(true)
      expect(wrapper.find('.error-actions').exists()).toBe(true)
    })

    it('should render error icon', () => {
      const errorIcon = wrapper.find('.error-icon svg')
      expect(errorIcon.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const heading = wrapper.find('h1')
      expect(heading.exists()).toBe(true)
      expect(heading.classes()).toContain('error-title')
    })

    it('should have focusable interactive elements', () => {
      const buttons = wrapper.findAll('button')
      const links = wrapper.findAll('a')
      
      expect(buttons.length + links.length).toBeGreaterThan(0)
    })
  })
})

describe('NotFound Component Integration', () => {
  let router
  let wrapper

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/404', name: 'not-found', component: NotFound }
      ]
    })

    await router.push('/404')

    wrapper = mount(NotFound, {
      global: {
        plugins: [router]
      }
    })
  })

  it('should integrate properly with Vue Router', () => {
    expect(wrapper.vm.$route.name).toBe('not-found')
  })

  it('should have access to router instance', () => {
    expect(wrapper.vm.$router).toBeDefined()
  })
})