/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Fragment, useRef, useState } from 'react'
import { useVoice } from '../../hooks/useVoice'
import { useConversation } from '../../hooks/useConversation'
import * as Storage from '../../storage'
import { Message } from '../../components/Message'
import * as Dialog from '@radix-ui/react-dialog';
import { isMobile, isDesktop } from 'react-device-detect'
import styled from 'styled-components'

const IS_LOCAL_SETUP_REQUIRED = false
const BackgroundWaterMark = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-color: #333;
  opacity: 0.5;
`
const DialogStyle = styled(Dialog.Content)`
position: relative;
z-index: 99;
background: #fff;
padding: 10px 20px 40px;
margin: 20px;
`
const savedData = Storage.load()
const Home = () => {
  const defaultSettingsRef = useRef({
    host: 'http://localhost',
    port: 8000,
    voiceURI: '',
    voiceSpeed: 1
  })
  const [settings, setSettings] = useState({
    host: (savedData?.host as string) ?? defaultSettingsRef.current.host,
    port: (savedData?.port as number) ?? defaultSettingsRef.current.port,
    voiceURI: (savedData?.voiceURI as string) ?? defaultSettingsRef.current.voiceURI,
    voiceSpeed: (savedData?.voiceSpeed as number) ?? defaultSettingsRef.current.voiceSpeed
  })
  const { availableVoices, speak, selectedVoice } = useVoice({
    settings,
    setSettings,
    defaultSettingsRef
  })
  const {
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
  } = useConversation({
    settings,
    speak,
    setSettings
  })
  const [isModalVisible, setIsModalVisible] = useState(false)

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsModalVisible(isOpen)
    Storage.save(settings)
  }

  const resetSetting = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: defaultSettingsRef.current[setting]
    })
  }
  const viewConversationMess = (
    <div>
      {messages.map(({ type, text }, index) => {
        const isLastPrompt = type === 'prompt' && index === messages.length - 1;
        const isLastResponse = type === 'response' && index === messages.length - 1;
        const isPenultimatePrompt = type === 'prompt' && index === messages.length - 2;
        const isActive = !isListening && (isLastPrompt || isLastResponse || isPenultimatePrompt);
        return <Message key={text} type={type} text={text} isActive={isActive} onClick={speak} />
      })}
      {isListening && <Message type='prompt' text={transcript} isActive />}
      <div ref={bottomDivRef} />
    </div>
  );
  const viewAlertMicrophone = (
    <div>
      {!isMicrophoneAvailable && (
        <div>
          <div>👾</div>
          <div>Không cho xài mic mà đòi xài tính năng à... ! Bật quyền lên đi</div>
        </div>
      )}
    </div>
  );
  const viewUI = (
    <div>
      <button
        type='button'
        onClick={recognizeSpeech}
        disabled={isProcessing}
        aria-label={isListening ? 'Listening' : isProcessing ? 'Processing' : 'Start speaking'}
      >
        {isListening ? (
          <div>
            <div>Turn off Mic</div>
          </div>
        ) : isProcessing ? (
          <div>
            <div>Loading...</div>
          </div>
        ) : (
          <div>Turn on Mic</div>
        )}
      </button>
      <div>
        <button onClick={() => setIsModalVisible(true)}>
          <div>Setting</div>
        </button>
        <button onClick={resetConversation}>
          <div>Reset Conversation</div>
        </button>
      </div>
    </div>
  );
  if (!browserSupportsSpeechRecognition) {
    return (
      <div>
        Browser này không có hỗ trợ đâu! Kiếm cái khác đi
      </div>
    );
  }
  const uiDialogSetting = (
    <Dialog.Root open={isModalVisible} onOpenChange={handleModalOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <DialogStyle
        >
          <Dialog.Title>
            Settings
          </Dialog.Title>

          <main>

            <div>
              {IS_LOCAL_SETUP_REQUIRED && isDesktop && (
                <div >
                  <h3>Server</h3>

                  <fieldset >
                    <label htmlFor="host">Host</label>
                    <div>
                      <input
                        id="host"
                        value={settings.host}
                        onChange={(e) => {
                          setSettings({ ...settings, host: e.target.value });
                        }}
                      />
                      <button
                        onClick={() => resetSetting('host')}
                      >
                        Reset
                      </button>
                    </div>
                  </fieldset>
                  <fieldset>
                    <label htmlFor="port">Port</label>
                    <div>
                      <input
                        id="port"
                        type="number"
                        value={settings.port}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            port: Number(e.target.value),
                          });
                        }}
                      />
                      <button
                        onClick={() => resetSetting('port')}
                      >
                        Reset
                      </button>
                    </div>
                  </fieldset>
                </div>
              )}

              <div>
                <h3>Voice</h3>
                {/* Setting Voice */}
                <fieldset>
                  <label htmlFor="voice-name">Chọn nhân vật bạn muốn</label>
                  <div>
                    <select value={settings.voiceURI} onChange={(e) => {
                      setSettings({
                        ...settings,
                        voiceURI: e.target.value,
                      });
                    }}>
                      <option value="" disabled>Select Voice</option>
                      {Object.entries(availableVoices).map(([group, voicesInGroup], index) => (
                        <optgroup label={group} key={group}>
                          {voicesInGroup.map((voice) => (
                            <option value={voice.voiceURI} key={voice.voiceURI}>
                              {voice.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <button
                      onClick={() => resetSetting('voiceURI')}
                    >
                      Reset
                    </button>
                  </div>
                </fieldset>
                {/* Setting Speed Voice */}
                <fieldset>
                  <label htmlFor="voice-speed">Speed</label>
                  <input
                    type="range"
                    id="voice-speed"
                    value={settings.voiceSpeed}
                    onChange={(event) => {
                      setSettings({ ...settings, voiceSpeed: +event.target.value });
                    }}
                    max="2"
                    min="0.5"
                    step="0.1"
                    aria-label="Voice speed"
                  />
                  <div>{`${settings.voiceSpeed.toFixed(2)}x`}</div>
                  <button onClick={() => resetSetting('voiceSpeed')}>Reset</button>
                </fieldset>

                <button
                  onClick={() => speak('One two three four five')}
                >
                  <span>Try speaking</span>
                </button>
              </div>
            </div>
          </main>
        </DialogStyle>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return (
    <>
      <p>Click dô text để nghe voice</p>
      {isModalVisible && <BackgroundWaterMark />}
      {viewAlertMicrophone}
      {viewConversationMess}
      {viewUI}
      {uiDialogSetting}
    </>
  )
}
export { Home, IS_LOCAL_SETUP_REQUIRED }
