require("dotenv").config();
const express=require("express");
const cors=require("cors");
const path=require("path");
const connectDB=require("./config/db");

const app=express();

//middleware to handle cors

app.use(
  cors({
    origin:process.env.CLIENT_URL || "*",
    methods:["GET", "POST", "PUT", "DELETE"],
    allowedHeaders:["Content-type","Authorization"],

  })
);

app.use(express.json());
connectDB();

const PORT=process.env.PORT || 5000;
app.listen(PORT,()=> console.log(`Server running on port ${PORT}`));