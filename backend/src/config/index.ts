import "dotenv/config";
export const port = Number(process.env.PORT);
export const db_url = String(process.env.DATABASE_URL);
export const  rabbit_mq_url = String(process.env.RABBITMQ_URL)
export const persistance = process.env.PERSISTENCE