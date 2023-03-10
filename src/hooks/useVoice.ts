/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { isMobile, isSafari } from 'react-device-detect'
import { SettingProps } from '../pages/Home/type'

interface VoiceMappings {
  [group: string]: SpeechSynthesisVoice[]
}
interface VoiceProps extends SettingProps {
  defaultSettingsRef: React.MutableRefObject<{
    voiceURI: string
    voiceSpeed: number
  }>
}

export const useVoice = (props: VoiceProps) => {
  const { settings, setSettings, defaultSettingsRef } = props
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const availableVoices = useMemo(() => {
    const englishTypes = new Map()
    englishTypes.set('en-AU', 'English (Australia)')
    englishTypes.set('en-CA', 'English (Canada)')
    englishTypes.set('en-GB', 'English (United Kingdom)')
    englishTypes.set('en-IE', 'English (Ireland)')
    englishTypes.set('en-IN', 'English (India)')
    englishTypes.set('en-NZ', 'English (New Zealand)')
    englishTypes.set('en-US', 'English (United State)')
    englishTypes.set('en-ZA', 'English (South Africa)')
    englishTypes.set('en', 'English')
    // Vietnamese
    englishTypes.set('vi-VN', 'Vietnamese (Vietnam)')
    englishTypes.set('vi', 'Vietnamese')
    
    const localEnglishVoices = voices.filter((voice) => voice.localService)
    
    const result: VoiceMappings = {}
    for (const voice of localEnglishVoices) {
      const label = englishTypes.get(voice.lang)
      if (typeof label !== 'string') {
        continue
      }
      if (!result[label]) {
        result[label] = []
      }
      result[label].push(voice)
    }
    return result
  }, [voices])
  const selectedVoice = useMemo(() => {
    return voices.find((voice) => voice.voiceURI === settings.voiceURI)
  }, [voices, settings.voiceURI])
  const speak = useCallback(
    (text: string) => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      utterance.rate = settings.voiceSpeed
      window.speechSynthesis.speak(utterance)
    },
    [selectedVoice, settings.voiceSpeed]
  )

  useEffect(() => {
    const updateVoiceSettings = () => {
      const newVoices = window.speechSynthesis.getVoices()
      const defaultVoice = newVoices.find((voice) => voice.default && voice.lang)
      setVoices(newVoices)
      setSettings((oldSettings) => {
        if (oldSettings.voiceURI) {
          return oldSettings
        }
        return {
          ...oldSettings,
          voiceURI: defaultVoice ? defaultVoice.voiceURI : ''
        }
      })
      if (defaultVoice) {
        defaultSettingsRef.current.voiceURI = defaultVoice.voiceURI
      }
    }
    if (isSafari || isMobile) {
      const interval = setInterval(() => {
        const newVoices = window.speechSynthesis.getVoices()
        if (newVoices.length > 0) {
          clearInterval(interval)
          updateVoiceSettings()
        }
      }, 100)
      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(interval), 10_000)

      return () => clearInterval(interval)
    }

    window.speechSynthesis.addEventListener('voiceschanged', updateVoiceSettings)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoiceSettings)
    }
  }, [])

  return {
    availableVoices,
    speak,
    selectedVoice
  }
}
