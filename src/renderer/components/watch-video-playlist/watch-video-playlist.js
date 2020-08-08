import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'

export default Vue.extend({
  name: 'WatchVideoPlaylist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-list-video': FtListVideo
  },
  props: {
    playlistId: {
      type: String,
      required: true
    },
    videoId: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      isLoading: false,
      shuffleEnabled: false,
      loopEnabled: false,
      channelName: '',
      channelId: '',
      channelThumbnail: '',
      playlistTitle: '',
      playlistItems: [],
      randomizedPlaylistItems: []
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    currentVideoIndex: function () {
      const index = this.playlistItems.findIndex((item) => {
        return item.id === this.videoId
      })

      return index + 1
    },

    playlistVideoCount: function () {
      return this.playlistItems.length
    }
  },
  mounted: function () {
    console.log('mount')
    if (!this.usingElectron) {
      console.log('wha')
      this.getPlaylistInformationInvidious()
    } else {
      switch (this.backendPreference) {
        case 'local':
          this.getPlaylistInformationLocal()
          break
        case 'invidious':
          this.getPlaylistInformationInvidious()
          break
      }
    }
  },
  methods: {
    goToPlaylist: function () {
      this.$router.push({ path: `/playlist/${this.playlistId}` })
    },

    goToChannel: function () {
      this.$router.push({ path: `/channel/${this.channelId}` })
    },

    toggleLoop: function () {
      if (this.loopEnabled) {
        this.loopEnabled = false
        this.showToast({
          message: this.$t('Loop is now disabled')
        })
      } else {
        this.loopEnabled = true
        this.showToast({
          message: this.$t('Loop is now enabled')
        })
      }
    },

    toggleShuffle: function () {
      if (this.shuffleEnabled) {
        this.shuffleEnabled = false
        this.showToast({
          message: this.$t('Shuffle is now disabled')
        })
      } else {
        this.shuffleEnabled = true
        this.showToast({
          message: this.$t('Shuffle is now enabled')
        })
        this.shufflePlaylistItems()
      }
    },

    playNextVideo: function () {
      const playlistInfo = {
        playlistId: this.playlistId
      }

      if (this.shuffleEnabled) {
        const videoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item.id === this.videoId
        })

        if (videoIndex === this.randomizedPlaylistItems.length - 1) {
          if (this.loopEnabled) {
            this.$router.push(
              {
                path: `/watch/${this.randomizedPlaylistItems[0]}`,
                query: playlistInfo
              }
            )
            this.showToast({
              message: this.$t('Playing Next Video')
            })
            this.shufflePlaylistItems()
          } else {
            this.showToast({
              message: this.$t('The playlist has ended.  Enable loop to continue playing')
            })
          }
        } else {
          this.$router.push(
            {
              path: `/watch/${this.randomizedPlaylistItems[videoIndex + 1]}`,
              query: playlistInfo
            }
          )
          this.showToast({
            message: this.$t('Playing Next Video')
          })
        }
      } else {
        const videoIndex = this.playlistItems.findIndex((item) => {
          return item.id === this.videoId
        })

        if (videoIndex === this.playlistItems.length - 1) {
          if (this.loopEnabled) {
            this.$router.push(
              {
                path: `/watch/${this.playlistItems[0].id}`,
                query: playlistInfo
              }
            )
            this.showToast({
              message: this.$t('Playing Next Video')
            })
          }
          this.showToast({
            message: this.$t('The playlist has ended.  Enable loop to continue playing')
          })
        } else {
          this.$router.push(
            {
              path: `/watch/${this.playlistItems[videoIndex + 1].id}`,
              query: playlistInfo
            }
          )
          this.showToast({
            message: this.$t('Playing Next Video')
          })
        }
      }
    },

    playPreviousVideo: function () {
      this.showToast({
        message: 'Playing previous video'
      })

      const playlistInfo = {
        playlistId: this.playlistId
      }

      if (this.shuffleEnabled) {
        const videoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item.id === this.videoId
        })

        if (videoIndex === 0) {
          this.$router.push(
            {
              path: `/watch/${this.randomizedPlaylistItems[this.randomizedPlaylistItems.length - 1]}`,
              query: playlistInfo
            }
          )
        } else {
          this.$router.push(
            {
              path: `/watch/${this.randomizedPlaylistItems[videoIndex - 1]}`,
              query: playlistInfo
            }
          )
        }
      } else {
        const videoIndex = this.playlistItems.findIndex((item) => {
          return item.id === this.videoId
        })

        if (videoIndex === 0) {
          this.$router.push(
            {
              path: `/watch/${this.playlistItems[this.randomizedPlaylistItems.length - 1].id}`,
              query: playlistInfo
            }
          )
        } else {
          this.$router.push(
            {
              path: `/watch/${this.playlistItems[videoIndex - 1].id}`,
              query: playlistInfo
            }
          )
        }
      }
    },

    getPlaylistInformationLocal: function () {
      this.isLoading = true

      console.log(this.playlistId)

      this.$store.dispatch('ytGetPlaylistInfo', this.playlistId).then((result) => {
        console.log('done')
        console.log(result)

        this.playlistTitle = result.title
        this.playlistItems = result.items
        this.videoCount = result.total_items
        this.channelName = result.author.name
        this.channelThumbnail = result.author.avatar
        this.channelId = result.author.id

        this.playlistItems = result.items
        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Local API Error (Click to copy):')
        this.showToast({
          message: `${errorMessage} ${err}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(err)
          }
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          this.showToast({
            message: this.$t('Falling back to Invidious API')
          })
          this.getPlaylistInformationInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistInformationInvidious: function () {
      this.isLoading = true

      const payload = {
        resource: 'playlists',
        id: this.playlistId,
        params: {
          page: this.playlistPage
        }
      }

      this.$store.dispatch('invidiousGetPlaylistInfo', payload).then((result) => {
        console.log('done')
        console.log(result)

        this.playlistTitle = result.title
        this.videoCount = result.videoCount
        this.channelName = result.author
        this.channelThumbnail = result.authorThumbnails[2].url
        this.channelId = result.authorId
        this.playlistItems = this.playlistItems.concat(result.videos)

        if (this.playlistItems.length < result.videoCount) {
          console.log('getting next page')
          this.playlistPage++
          this.getPlaylistInformationInvidious()
        } else {
          this.isLoading = false
        }
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy):')
        this.showToast({
          message: `${errorMessage} ${err}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(err)
          }
        })
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          console.log('Error getting data with Invidious, falling back to local backend')
          this.showToast({
            message: this.$t('Falling back to Local API')
          })
          this.getPlaylistInformationLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    shufflePlaylistItems: function () {
      // Prevents the array from affecting the original object
      const remainingItems = [].concat(this.playlistItems)
      const items = []

      items.push(this.videoId)

      this.playlistItems.forEach((item) => {
        const randomInt = Math.floor(Math.random() * remainingItems.length)

        if (remainingItems[randomInt].id !== this.videoId) {
          items.push(remainingItems[randomInt].id)
        }

        remainingItems.splice(randomInt, 1)
      })

      this.randomizedPlaylistItems = items
    },

    ...mapActions([
      'showToast'
    ])
  }
})
