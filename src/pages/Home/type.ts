export interface SettingProps {
  settings: {
    voiceURI: string
    voiceSpeed: number
    host: string
    port: number
  }
  setSettings: React.Dispatch<
    React.SetStateAction<{
      voiceURI: string
      voiceSpeed: number
      host: string
      port: number
    }>
  >
}
