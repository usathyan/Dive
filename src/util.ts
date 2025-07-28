export function safeBase64Encode(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))))
  } catch (e) {
    console.error("Encoding error:", e)
    return ""
  }
}

export function safeBase64Decode(str: string): string {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(str),
      c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""))
  } catch (e) {
    console.error("Decoding error:", e)
    return str
  }
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}