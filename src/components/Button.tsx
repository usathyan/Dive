import "@/styles/components/_Button.scss"

interface Props{
  callback: () => void
  text: string
  color?: "white" | "green"
  size?: "fit" | "normal" | "full"
  padding?: "xxs" | "xs" | "s" | "n" | "l" | "xl" | "xxl"
  className?: string
  disabled?: boolean
}

export default function Button({
  callback,
  text,
  color = "white",
  size = "normal",
  padding = "n",
  className = "",
  disabled = false
}: Props){
  return (
    <button className={`custom-button ${className} ${color} ${size} padding-${padding} ${disabled ? "disabled" : ""}`} onClick={callback}>
      {text}
    </button>
  )
}