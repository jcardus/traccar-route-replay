export const state = {
  session: null,
  devices: [],
  timestamps: [],
  path: []
}
export const getters = {
  session: state => state.session,
  devices: state => state.devices,
  path: state => state.path,
  timestamps: state => state.timestamps
}
export const actions = {
  async getDevices ({ commit }, userId) {
    commit('SET_DEVICES', await this.$axios.$get('devices' + (userId ? `?userId=${userId}` : '')))
  },
  async getUserData ({ commit, dispatch }) {
    await dispatch('getDevices')
    commit('SET_SESSION', await this.$axios.$get('session'))
    commit('SET_DEVICES', await this.$axios.$get('devices'))
  },
  async getPath ({ commit, dispatch, state }) {
    const from = new Date(new Date().getTime() - 1000 * 60 * 60 * 24).toISOString()
    const to = new Date(new Date().getTime() + 1000 * 60 * 60 * 24).toISOString()
    await dispatch('getUserData')
    const device = state.devices[2]
    const route = await this.$axios.$get(`/reports/route?deviceId=${device.id}&from=${from}&to=${to}&type=route&type=trips`)
    const path = route.map(p => [p.longitude, p.latitude])
    const timestamps = route.map(p => new Date(p.fixTime).getTime())
    commit('SET_PATH', path)
    commit('SET_TIMESTAMPS', timestamps)
  }
}
export const mutations = {
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
  }
}
