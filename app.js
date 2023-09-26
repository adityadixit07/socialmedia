import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { dbConnect } from "./config/dbConnect.js";
import { postRouter } from "./routes/postRoutes/postRoute.js";
import { userRouter } from "./routes/userRoutes/userRoute.js";

dotenv.config({
  path: "./config/config.env",
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: "*", credentials: true }));

// database connection
dbConnect();

// using routes
// for post

  
app.use("/api/v1", postRouter);
// for user
app.use("/api/v1", userRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
app.get('/',(req,res)=>{
  res.send(`Aditya Media Server is live now......You can access it freely!`)
}
)
