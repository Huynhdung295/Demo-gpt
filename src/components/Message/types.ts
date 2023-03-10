export interface MessageProps {
  type: 'prompt' | 'response'
  text: string
  isActive: boolean
  onClick?(text: string): void
}
export interface MessDivProps {
  isActive: boolean
}
