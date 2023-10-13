export const state = {
  session: null,
  devices: []
}
export const getters = {
  session: state => state.session,
  devices: state => state.devices
}
export const actions = {
  async getDevices ({ commit }, userId) {
    commit('SET_DEVICES', await this.$axios.$get('devices' + (userId ? `?userId=${userId}` : '')))
  },
  async getUserData ({ commit, dispatch }) {
    await dispatch('getDevices')
    commit('SET_SESSION', await this.$axios.$get('session'))
    commit('SET_DEVICES', await this.$axios.$get('devices'))
  }
}
export const mutations = {
  SET_SESSION (state, session) {
    state.session = session
  },
  SET_DEVICES (state, devices) {
    state.devices = devices
  }
}
