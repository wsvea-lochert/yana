let quitting = false

export const appState = {
  get isQuitting(): boolean {
    return quitting
  },
  setQuitting(value: boolean): void {
    quitting = value
  }
}
