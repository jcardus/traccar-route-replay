export default {
  router: {
    base: '/traccar-route-replay/'
  },
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  env: {
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    MAPTILER_KEY: process.env.MAPTILER_KEY,
    COUNTRY: process.env.COUNTRY,
    MAPILLARY_ACCESS_TOKEN: process.env.MAPILLARY_ACCESS_TOKEN,
    DEBUG_BOXES: process.env.DEBUG_BOXES
  },

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Route Replay ' + process.env.npm_package_version,
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    // 'maplibre-gl/dist/maplibre-gl.css',
    'mapbox-gl/dist/mapbox-gl.css',
    '@assets/main.css',
    'mapboxgl-timeline/dist/style.css',
    'vue-loading-overlay/dist/vue-loading.css'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/i18n'
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: process.env.BASE_URL || '/api',
    credentials: true
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  }
}
