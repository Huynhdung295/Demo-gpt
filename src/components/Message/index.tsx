import { KeyboardEventHandler } from 'react'
import { MessageProps, MessDivProps } from './types'
import styled from 'styled-components'

const MessDiv = styled.div`
  ${({ isActive }: MessDivProps) => (isActive ? 'background-color: #f0f0f0;' : '')}
`
export const Message = (props: MessageProps) => {
  const { type, text, isActive, onClick } = props
  const send = () => {
    onClick && onClick(text)
  }
  const enter: KeyboardEventHandler<HTMLDivElement> = (e) => {
    e.key === 'Enter' && onClick && onClick(text)
  }
  const view = (
    <MessDiv role='button' tabIndex={0} onClick={send} onKeyDown={enter} isActive={isActive}>
      {type === 'prompt' ? <span> ⭐️ </span> : <span> 🤖 </span>}
      {text}
    </MessDiv>
  )
  return view
}
