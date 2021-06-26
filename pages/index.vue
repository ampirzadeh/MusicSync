<template>
  <v-row style="height: 100%">
    <v-col
      v-if="!thumbnailURL"
      style="height: 100%"
      cols="12"
      class="d-flex"
      @click="upload"
    >
      <div class="ma-auto text-center">
        <v-icon title="Upload file" color="primary" x-large>
          file_upload
        </v-icon>
        <v-subheader v-text="lastFile" />
      </div>
    </v-col>

    <v-col v-else cols="10" sm="6" lg="5" class="ma-auto">
      <v-card elevation="0">
        <v-img :src="thumbnailURL" />

        <v-card-title v-text="trackName" />

        <audio v-show="false" ref="audioPlayer" :src="audioURL" />

        <v-card-actions>
          <v-row>
            <v-col class="text-center">
              <v-btn icon color="primary" class="pa-6" @click="rewind">
                <v-icon>fast_rewind</v-icon>
              </v-btn>
            </v-col>
            <v-col class="text-center">
              <v-btn icon color="primary" class="pa-6" @click="playPause">
                <v-icon v-text="isPlaying ? 'pause' : 'play_arrow'" />
              </v-btn>
            </v-col>
            <v-col class="text-center">
              <v-btn icon color="primary" class="pa-6" @click="forward">
                <v-icon>fast_forward</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
        <v-progress-linear :value="audioProgress" class="my-0" height="3" />
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Vue, Component, Watch, namespace } from 'nuxt-property-decorator'
import * as musicMetadata from 'music-metadata-browser'

const LocalStorage = namespace('LocalStorage')

@Component
export default class Index extends Vue {
  thumbnailURL = ''
  audioURL = ''
  audioProgress = 0
  isPlaying = false
  trackName = ''
  lastFile = ''
  cancelFunc!: () => void

  @LocalStorage.State
  tracksData!: Record<string, number>

  @LocalStorage.Mutation
  public SaveProgress!: (data: { trackTime: number; trackName: string }) => void

  mounted() {
    this.$axios
      .$get<string>('/lastFile')
      .then((lastFile) => (this.lastFile = lastFile))
  }

  upload() {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'audio/*'
    fileInput.click()

    fileInput.addEventListener('change', () => {
      const file = fileInput.files ? fileInput.files[0] : null
      const fileURL = URL.createObjectURL(file)

      this.audioURL = fileURL
      musicMetadata.fetchFromUrl(fileURL).then((metadata) => {
        if (metadata.common.picture?.length)
          this.thumbnailURL = URL.createObjectURL(
            new Blob([metadata.common.picture[0].data.buffer], {
              type: metadata.common.picture[0].format,
            })
          )
        else this.thumbnailURL = require('../assets/default-image.jpg')
        this.trackName = metadata.common.title || 'No Name'

        this.$axios
          .$get<number>('/progress', {
            params: {
              trackName: this.trackName,
            },
          })
          .then((trackTime) => {
            const audioPlayer = this.$refs.audioPlayer as HTMLAudioElement
            const maxTrackTime = Math.max(
              +this.tracksData[this.trackName],
              trackTime
            )

            audioPlayer.currentTime = maxTrackTime
            this.isPlaying = true
            setInterval(this.trackProgress, 5000)
          })
      })

      fileInput.remove()
    })
  }

  playPause() {
    this.isPlaying = !this.isPlaying
  }

  trackProgress() {
    const audioPlayer = this.$refs.audioPlayer as HTMLAudioElement
    this.audioProgress = (audioPlayer.currentTime / audioPlayer.duration) * 100
    this.saveProgress()
  }

  forward() {
    const audioPlayer = this.$refs.audioPlayer as HTMLAudioElement
    audioPlayer.currentTime += 15
    this.saveProgress()
  }

  rewind() {
    const audioPlayer = this.$refs.audioPlayer as HTMLAudioElement
    audioPlayer.currentTime -= 15
    this.saveProgress()
  }

  @Watch('isPlaying')
  handlePlayPause(value: boolean) {
    const audioPlayer = this.$refs.audioPlayer as HTMLAudioElement
    if (value) audioPlayer.play()
    else audioPlayer.pause()
  }

  saveProgress() {
    if (this.$nuxt.isOnline)
      if (this.cancelFunc && typeof this.cancelFunc === 'function')
        this.cancelFunc()

    const audioPlayer = this.$refs.audioPlayer as HTMLAudioElement
    const data = {
      trackName: this.trackName,
      trackTime: audioPlayer.currentTime,
    }
    this.SaveProgress(data)

    if (this.$nuxt.isOnline)
      this.$axios
        .$post('/progress', data, {
          cancelToken: new this.$axios.CancelToken((c) => {
            this.cancelFunc = c
          }),
        })
        .catch(this.saveProgress)
  }
}
</script>
