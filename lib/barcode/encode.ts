import JsBarcode from "jsbarcode"

export const labelModuleMm = 0.25
export const labelQuietModules = 10
export const labelMaxCopies = 40
export const labelWidths = [90, 180] as const
export type LabelWidth = (typeof labelWidths)[number]

type Encoding = { data: string; text?: string }
type EncodingTarget = { encodings?: Encoding[] }

// JsBarcode encodes into an object; no DOM, canvas, image interpolation or
// untrusted HTML is needed. Only the encoded bits become SVG rectangles.
export function encodeBarcode(value: string) {
  if (!/^[\x20-\x7e]{1,128}$/.test(value)) throw new Error("Barcode harus berupa teks ASCII cetak (1–128 karakter).")
  const output: EncodingTarget = {}
  JsBarcode(output, value, { format: "CODE128", displayValue: false, width: 1, margin: 0 })
  const bits = output.encodings?.map((entry) => entry.data).join("") ?? ""
  if (!/^[01]+$/.test(bits)) throw new Error("Barcode tidak dapat dibuat.")
  return bits
}

export function barcodeWidthMm(bits: string) {
  return (bits.length + labelQuietModules * 2) * labelModuleMm
}

export function barcodeFits(bits: string, width: LabelWidth) {
  // 3 mm internal padding on either side and 10-module quiet zones.
  return barcodeWidthMm(bits) <= width - 6
}

export function barcodeRuns(bits: string) {
  const runs: { x: number; width: number }[] = []
  for (let index = 0; index < bits.length;) {
    if (bits[index] !== "1") { index++; continue }
    const start = index
    while (bits[index] === "1") index++
    runs.push({ x: start + labelQuietModules, width: index - start })
  }
  return runs
}

export function parseCopies(value: string) {
  if (!/^\d+$/.test(value)) return null
  const copies = Number(value)
  return Number.isInteger(copies) && copies >= 1 && copies <= labelMaxCopies ? copies : null
}
