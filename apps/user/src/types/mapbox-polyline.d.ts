declare module '@mapbox/polyline' {
  const polyline: {
    decode(encoded: string, precision?: number): [number, number][]
    encode(coordinates: Array<[number, number]>, precision?: number): string
  }

  export default polyline
}
