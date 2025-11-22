import { Channel, ChannelModel, Connection, ConsumeMessage } from "amqplib";
import path from "path";
import { getRmqConn } from "../rmq/index";
import { WorkerPool } from "../workers/worker-pool";
import { workerPool } from "../workers/workerpool";

export interface ChunkJobPayload {
  jobId: string;
  chunkIndex: number;
  chunkFile: string;
  createdBy: string;
}

export async function startRmqConsumer(): Promise<void> {
  let channel: Channel | undefined;

  try {
    const conn: ChannelModel = await getRmqConn();
    channel = await conn.createChannel();

    const QUEUE = "bulk_chunks";

    await channel.assertQueue(QUEUE, { durable: true });
    channel.prefetch(5);

    console.log("RabbitMQ Consumer started...");

    channel.consume(
      QUEUE,
      (msg: ConsumeMessage | null) => {
        if (!msg) return;

        let payload: ChunkJobPayload;

        try {
          payload = JSON.parse(msg.content.toString());
        } catch (err) {
          console.error("Invalid RMQ message:", err);
          channel?.ack(msg);
          return;
        }

        const { jobId, chunkIndex, chunkFile, createdBy } = payload;

        workerPool.addJob({
          jobId,
          chunkIndex,
          chunkFile,
          createdBy,
          persistence: "rmq",
        });

        channel?.ack(msg);
      },
      { noAck: false }
    );
  } catch (error) {
    console.error("Error starting RMQ Consumer:", error);
  }
}
