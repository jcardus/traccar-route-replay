import { prettify } from '@/utils'
const route = require('./route.json')
describe('route processing', () => {
  test('prettifies', () => {
    expect(prettify(route).length).toBe(406)
  })
})
