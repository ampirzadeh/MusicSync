import { Module, VuexModule, Mutation } from 'vuex-module-decorators'

@Module({
  name: 'LocalStorage',
  stateFactory: true,
  namespaced: true,
})
export default class LocalStorage extends VuexModule {
  tracksData: Record<string, number> = JSON.parse(
    localStorage.getItem('tracksData') || '{}'
  )

  @Mutation
  public SaveProgress(data: { trackTime: number; trackName: string }) {
    this.tracksData[data.trackName] = data.trackTime

    localStorage.setItem('tracksData', JSON.stringify(this.tracksData))
  }
}
