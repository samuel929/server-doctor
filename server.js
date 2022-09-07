const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const userRoute=require('./routes/user');
const adminRoute = require('./routes/admin');
const doctorRoute =require('./routes/doctors')
require('dotenv').config()
const app=express();

app.use(cors())
app.use(express.json())
app.use('/api/user',userRoute)
app.use("/api/admin", adminRoute);
app.use("/api/doctor",doctorRoute)
mongoose.connect(process.env.MONGO)
.then(()=>{
    console.log("mongodb is running")
})
.catch((err)=>{
    console.log("failed to connects")
})

const port=process.env.PORT || 8800;

if (process.env.NODE_ENV === "production") {
    app.use("/", express.static("../client/build"));
  
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
    });
  }
app.listen(port,()=>console.log("listning on port 8800"))


