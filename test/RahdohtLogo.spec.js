import { mount } from '@vue/test-utils'
import RahdohtLogo from '@/components/RahdohtLogo.vue'

describe('RahdohtLogo', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(RahdohtLogo)
    expect(wrapper.vm).toBeTruthy()
  })
})
