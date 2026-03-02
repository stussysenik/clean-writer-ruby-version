// ActionCable consumer for real-time document sync across tabs
import { createConsumer } from '@rails/actioncable'

const consumer = createConsumer()

interface DocumentUpdate {
  content?: string
  word_count?: number
  sender?: string
}

type UpdateCallback = (data: DocumentUpdate) => void

let subscription: ReturnType<typeof consumer.subscriptions.create> | null = null
let clientId = `tab_${Math.random().toString(36).slice(2, 10)}`

export function subscribeToDocument(sessionToken: string, onUpdate: UpdateCallback) {
  // Unsubscribe from any existing subscription
  if (subscription) {
    subscription.unsubscribe()
  }

  subscription = consumer.subscriptions.create(
    { channel: 'DocumentChannel', session_token: sessionToken },
    {
      received(data: unknown) {
        const update = data as DocumentUpdate
        // Ignore updates from this tab
        if (update.sender === clientId) return
        onUpdate(update)
      },
    }
  )

  return subscription
}

export function broadcastDocumentUpdate(data: Partial<DocumentUpdate>) {
  if (subscription) {
    subscription.send({ ...data, sender: clientId })
  }
}

export function unsubscribeFromDocument() {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }
}

export function disconnect() {
  consumer.disconnect()
}
