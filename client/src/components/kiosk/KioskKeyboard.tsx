import { useCallback, useEffect, useRef, useState } from "react"
import KeyboardReact from "react-simple-keyboard"
import { useKiosk } from "#/components/kiosk/KioskProvider"

import "react-simple-keyboard/build/css/index.css"
import "./kiosk.css"

const DEFAULT_LAYOUT = {
  default: [
    "^ 1 2 3 4 5 6 7 8 9 0 \u00DF \u00B4 {bksp}",
    "{tab} q w e r t z u i o p \u00FC +",
    "{lock} a s d f g h j k l \u00F6 \u00E4 # {enter}",
    "{shift} < y x c v b n m , . - {shift}",
    "{numeric} @ {space} .",
  ],
  shift: [
    "^ 1 2 3 4 5 6 7 8 9 0 \u00DF \u00B4 {bksp}",
    "{tab} Q W E R T Z U I O P \u00DC +",
    "{lock} A S D F G H J K L \u00D6 \u00C4 # {enter}",
    "{shift} < Y X C V B N M , . - {shift}",
    "{numeric} @ {space} .",
  ],
  numeric: ["7 8 9", "4 5 6", "1 2 3", "{abc} 0 {bksp}"],
}

const DISPLAY = {
  "{bksp}": "\u232B",
  "{enter}": "\u23CE",
  "{shift}": "\u21E7",
  "{lock}": "\u21E7\u21E7",
  "{tab}": "\u21E5",
  "{space}": " ",
  "{numeric}": "123",
  "{abc}": "ABC",
}

export default function KioskKeyboard() {
  const { isKeyboardOpen } = useKiosk()
  const [layoutName, setLayoutName] = useState("default")
  const [capsLock, setCapsLock] = useState(false)
  const shiftPendingRef = useRef(false)
  const keyboardHeightRef = useRef(0)

  const getActiveInput = useCallback(():
    | HTMLInputElement
    | HTMLTextAreaElement
    | null => {
    const el = document.activeElement
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return el
    }
    return null
  }, [])

  const insertAtCursor = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement, text: string) => {
      const start = el.selectionStart ?? el.value.length
      const end = el.selectionEnd ?? start
      el.value = el.value.slice(0, start) + text + el.value.slice(end)
      const newPos = start + text.length
      el.selectionStart = newPos
      el.selectionEnd = newPos
      el.dispatchEvent(new Event("input", { bubbles: true }))
    },
    [],
  )

  const handleKeyPress = useCallback(
    (button: string) => {
      const el = getActiveInput()
      if (!el) return

      if (button === "{bksp}") {
        const start = el.selectionStart ?? el.value.length
        const end = el.selectionEnd ?? start
        if (start !== end) {
          el.value = el.value.slice(0, start) + el.value.slice(end)
          el.selectionStart = start
          el.selectionEnd = start
        } else if (start > 0) {
          el.value = el.value.slice(0, start - 1) + el.value.slice(start)
          el.selectionStart = start - 1
          el.selectionEnd = start - 1
        }
        el.dispatchEvent(new Event("input", { bubbles: true }))
      } else if (button === "{enter}") {
        const form = el.closest("form")
        if (form) {
          form.requestSubmit()
        } else {
          insertAtCursor(el, "\n")
        }
      } else if (button === "{space}") {
        insertAtCursor(el, " ")
      } else if (button === "{tab}") {
        insertAtCursor(el, "\t")
      } else if (
        button === "{shift}" ||
        button === "{shiftleft}" ||
        button === "{shiftright}"
      ) {
        shiftPendingRef.current = !shiftPendingRef.current
        if (shiftPendingRef.current) {
          setLayoutName("shift")
        } else {
          setLayoutName(capsLock ? "shift" : "default")
        }
      } else if (button === "{lock}") {
        const next = !capsLock
        setCapsLock(next)
        shiftPendingRef.current = false
        setLayoutName(next ? "shift" : "default")
      } else if (button === "{numeric}") {
        setLayoutName("numeric")
      } else if (button === "{abc}") {
        setLayoutName(capsLock ? "shift" : "default")
      } else {
        insertAtCursor(el, button)

        if (shiftPendingRef.current) {
          shiftPendingRef.current = false
          setLayoutName(capsLock ? "shift" : "default")
        }
      }
    },
    [getActiveInput, insertAtCursor, capsLock],
  )

  const measureHeight = useCallback(() => {
    const el = document.querySelector("[data-kiosk-keyboard]")
    if (el) {
      const height = el.getBoundingClientRect().height
      if (height > 0) {
        keyboardHeightRef.current = height
        document.documentElement.style.setProperty(
          "--kiosk-keyboard-height",
          `${height}px`,
        )
      }
    }
  }, [])

  useEffect(() => {
    if (isKeyboardOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(measureHeight)
      })
    } else {
      document.documentElement.style.setProperty(
        "--kiosk-keyboard-height",
        "0px",
      )
      keyboardHeightRef.current = 0
    }
  }, [isKeyboardOpen, measureHeight])

  if (!isKeyboardOpen) return null

  return (
    <div
      data-kiosk-keyboard=""
      className="sticky bottom-0 z-50 w-full shrink-0 border-t bg-background"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest(".hg-button")) {
          e.preventDefault()
        }
      }}
    >
      <KeyboardReact
        layout={DEFAULT_LAYOUT}
        layoutName={layoutName}
        display={DISPLAY}
        onKeyPress={handleKeyPress}
        preventMouseDownDefault={true}
        stopMouseDownPropagation={true}
        useMouseEvents={false}
        autoUseTouchEvents={true}
      />
    </div>
  )
}
