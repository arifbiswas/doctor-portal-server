const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000 ;

const app = express();

// middle wre 
app.use(cors());
app.use(express.json());





const uri =process.env.DB_URI;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try {
        const appointmentOptionCollection = client.db("doctorsPortal").collection("appointmentTimes")
        const bookingsCollection = client.db("doctorsPortal").collection("bookings")

        app.get("/appointmentTimes", async(req, res)=>{
            const date = req.query.date;
            const query = {}
            const cursor = appointmentOptionCollection.find(query);
            const options = await cursor.toArray();
        const bookingQuery = {appointmentDate : date};
            const alreadyBooked =await bookingsCollection.find(bookingQuery).toArray(); 
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment_name === option.name)
                const bookedSlots = optionBooked.map(booked => booked.slot)
                const reamingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = reamingSlots;
            })
            res.send(options);
        })
        app.post("/bookings" , async(req , res) =>{
            const bookings = req.body;
            const query = {
                appointmentDate : bookings.appointmentDate,
                email : bookings.email,
                treatment_name : bookings.treatment_name
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length){
                const message = `You already have a booking on ${bookings.appointmentDate}`
                return res.send({acknowledged : false , message})
            }
            const result = await bookingsCollection.insertOne(bookings);
            res.send(result);
        })

    } catch (error) {
        console.error(error);
    }

}
run().catch(e =>console.error(e))





app.get("/", (req , res )=>{
    res.send("Doctor Portal server is running");
})

app.listen(port ,()=>{
    console.log("Server is Running Port" , port);
})