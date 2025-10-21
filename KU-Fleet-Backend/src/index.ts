import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import busRoutes from "./routes/busRoutes"
import driverRoutes from "./routes/driverRoutes";
import express from 'express'
const PORT = 3000
const app = express()

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);

app.listen(PORT,()=>{
    console.log('app has been started at port',PORT)
})
