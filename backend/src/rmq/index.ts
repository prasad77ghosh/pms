import amqp, { ChannelModel } from "amqplib";
import { rabbit_mq_url } from "../config";

let conn: ChannelModel | null = null;


export async function getRmqConn(): Promise<ChannelModel> {
  if (conn) return conn;

  const url = rabbit_mq_url || "amqp://localhost";
  try {
    conn = await amqp.connect(url);

    console.log("🐇 RabbitMQ connected:", url);

    conn.on("error", (err) => {
      console.error("❌ RabbitMQ error:", err.message);
      conn = null;
    });

    conn.on("close", () => {
      console.warn("⚠️ RabbitMQ connection closed");
      conn = null;
    });

    return conn;
  } catch (err: any) {
    console.error("❌ RabbitMQ connect failed:", err.message);
    throw err;
  }
}



export async function isRabbitConnected(): Promise<boolean> {
  try {
    const connection = await getRmqConn();
    const channel = await connection.createChannel();
    await channel.close();
    return true;
  } catch {
    return false;
  }
}
