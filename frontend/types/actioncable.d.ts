declare module '@rails/actioncable' {
  export function createConsumer(url?: string): Cable

  interface Cable {
    subscriptions: Subscriptions
    connect(): void
    disconnect(): void
  }

  interface Subscriptions {
    create(
      channel: string | { channel: string; [key: string]: unknown },
      mixin?: {
        connected?: () => void
        disconnected?: () => void
        received?: (data: unknown) => void
        [key: string]: unknown
      }
    ): Subscription
  }

  interface Subscription {
    perform(action: string, data?: Record<string, unknown>): void
    send(data: Record<string, unknown>): void
    unsubscribe(): void
  }
}
