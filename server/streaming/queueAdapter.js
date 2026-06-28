/**
 * Streaming abstraction.
 *
 * Goal: keep StreamProcessor and publishers decoupled from the underlying MQ.
 */

export class QueueAdapter {
  /**
   * Publish a message to a topic.
   * @param {{topic: string, partitionKey?: string, message: any}} args
   */
  async publish({ topic, partitionKey, message }) {
    throw new Error('QueueAdapter.publish not implemented');
  }

  /**
   * Subscribe to a topic.
   * @param {{topic: string, onMessage: Function, partitionKeyResolver?: Function}} args
   */
  subscribe({ topic, onMessage, partitionKeyResolver = null }) {
    throw new Error('QueueAdapter.subscribe not implemented');
  }
}
