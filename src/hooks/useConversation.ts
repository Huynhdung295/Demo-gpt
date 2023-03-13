/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { IS_LOCAL_SETUP_REQUIRED } from '../pages/Home/index'
import { SettingProps } from '../pages/Home/type'
import usePrevious from './usePrevious'

interface Message {
  type: 'prompt' | 'response'
  text: string
}
interface CreateChatGPTMessageResponse {
  answer: string
  messageId: string
}
interface ConversationProps extends SettingProps {
  speak: (text: string) => void
}
const initialMessages: Message[] = [{ type: 'response', text: 'One two three four five' }]

export const useConversation = (props: ConversationProps) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(IS_LOCAL_SETUP_REQUIRED)
  const { speak, settings } = props
  const {
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    transcript,
    listening: isListening,
    finalTranscript
  } = useSpeechRecognition()

  const prevFinalTranscript = usePrevious(finalTranscript)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const conversationRef = useRef({ currentMessageId: '' })
  const abortRef = useRef<AbortController | null>(null)
  const bottomDivRef = useRef<HTMLDivElement>(null)

  const recognizeSpeech = () => {
    if (isListening) {
      SpeechRecognition.stopListening()
    } else {
      window.speechSynthesis.cancel()
      SpeechRecognition.startListening()
    }
  }
  const resetConversation = () => {
    setIsProcessing(false)
    setMessages(initialMessages)
    conversationRef.current = { currentMessageId: '' }

    window.speechSynthesis.cancel()
    SpeechRecognition.abortListening()
    abortRef.current?.abort()
  }
  useEffect(() => {
    if (isListening) {
      bottomDivRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isListening])

  useEffect(() => {
    bottomDivRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])
  useEffect(() => {
    if (prevFinalTranscript || !finalTranscript) {
      return
    }

    setMessages((oldMessages) => [...oldMessages, { type: 'prompt', text: finalTranscript }])
    setIsProcessing(true)

    abortRef.current = new AbortController()
    // const host = IS_LOCAL_SETUP_REQUIRED
    //   ? `${settings.host}:${settings.port}`
    const host = 'https://gpt-server-lyart.vercel.app'
    fetch(`${host}/chatgpt/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: finalTranscript,
        parentMessageId: conversationRef.current.currentMessageId || undefined
      }),
      signal: abortRef.current.signal
    })
      .then((res) => res.json())
      .then((res: CreateChatGPTMessageResponse) => {
        conversationRef.current.currentMessageId = res.messageId
        setMessages((oldMessages) => [...oldMessages, { type: 'response', text: res.answer }])
        speak(res.answer)
      })
      .catch((err: unknown) => {
        console.warn(err)
        let response: string
        if (err instanceof TypeError && IS_LOCAL_SETUP_REQUIRED) {
          response = 'Local server needs to be set up first. Click on the Settings button to see how.'
          setIsTooltipVisible(true)
        } else {
          response = 'Failed to get the response, please try again.'
        }
        setMessages((oldMessages) => [...oldMessages, { type: 'response', text: response }])
        speak(response)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [prevFinalTranscript, finalTranscript, settings, speak])
  return {
    messages,
    isListening,
    bottomDivRef,
    transcript,
    isProcessing,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    recognizeSpeech,
    resetConversation,
    isTooltipVisible,
    setIsTooltipVisible
  }
}
