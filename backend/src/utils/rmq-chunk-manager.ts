import { ChannelModel, Channel } from "amqplib";
import { getRmqConn } from "../rmq";

export async function publishChunks(jobId: string, chunkFiles: string[], createdBy?:string): Promise<void> {
  let channel: Channel | undefined;

  try {
    const conn: ChannelModel = await getRmqConn();
    channel = await conn.createChannel();

    await channel.assertQueue("bulk_chunks", { durable: true });

    for (const [index, file] of chunkFiles.entries()) {
      const payload = { jobId, chunkIndex: index + 1, chunkFile: file, createdBy };
      channel.sendToQueue("bulk_chunks", Buffer.from(JSON.stringify(payload)), { persistent: true });
    }
  } catch (error) {
    console.error("Error publishing RabbitMQ chunk jobs:", error);
    throw error;
  } finally {
    if (channel) await channel.close();
  }
}
