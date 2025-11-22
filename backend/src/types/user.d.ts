export 
interface User {
  _id: Schema.Types.ObjectId;
  name:string
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt:Date;
}