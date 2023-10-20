export const state = {
  session: null,
  devices: [],
  timestamps: [],
  path: [],
  headings: [],
  route: [],
  geofences: [],
  showTerrain: false
}
export const getters = {
  devices: state => state.devices,
  path: state => state.path,
  timestamps: state => state.timestamps,
  route: state => state.route,
  geofences: state => state.geofences,
  showTerrain: state => state.showTerrain
}
export const actions = {
  async getUserData ({ commit }) {
    commit('SET_DEVICES', await this.$axios.$get('devices'))
    commit('SET_SESSION', await this.$axios.$get('session'))
    commit('SET_SESSION', await this.$axios.$get('session'))
    commit('SET_GEOFENCES', await this.$axios.$get('/geofences'))
  },
  async getPath ({ commit, dispatch, state }) {
    const query = new URLSearchParams(window.location.search)
    const from = new Date(query.get('from') || new Date().getTime() - 1000 * 60 * 60 * 24).toISOString()
    const to = new Date(query.get('to') || new Date().getTime() + 1000 * 60 * 60 * 24).toISOString()
    await dispatch('getUserData')
    const device = state.devices.find(d => d.id === parseInt(query.get('deviceId'))) || state.devices[0]
    const route = await this.$axios.$get(`/reports/route?deviceId=${device.id}&from=${from}&to=${to}&type=route&type=trips`)
    commit('SET_ROUTE', route)
    commit('SET_PATH', route.map(p => [p.longitude, p.latitude]))
    commit('SET_TIMESTAMPS', route.map(p => new Date(p.fixTime).getTime()))
    this.loading = false
  }
}
export const mutations = {
  TOGGLE_TERRAIN (state) {
    state.showTerrain = !state.showTerrain
  },
  SET_SESSION (state, session) {
    state.session = session
  },
  SET_DEVICES (state, devices) {
    state.devices = devices
  },
  SET_TIMESTAMPS (state, timestamps) {
    state.timestamps = timestamps
  },
  SET_PATH (state, path) {
    state.path = path
  },
  SET_ROUTE (state, route) {
    state.route = route
  },
  SET_GEOFENCES (state, geofences) {
    state.geofences = geofences
  }
}
