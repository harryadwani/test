const express = require("express")
const app = express()
let http = require("http").Server(app)
const port = process.env.PORT || 3000
let io = require("socket.io")(http)

app.use(express.static("public"))

var connected_users = []

http.listen(port, () => {
  console.log("Listening on Port:",port)
  console.log("http://localhost:3000")
})

io.on("connection", (socket) => {

    console.log("-----CLIENT CONNECTED: " + socket.id)
    connected_users.push(socket.id)
    // console.log(connected_users.length)

    socket.on("request_call", () => {
        console.log("-----REQUESTING: "+ socket.id)
        socket.broadcast.emit("request_call", socket.id)
    })

    socket.on("response_call", (id) => {
        console.log(socket.id +" -----RESPONSING----- " + id) 
        socket.to(id).emit("response_call", socket.id)
    })
    
    socket .on("offer", (id, offer) => {
        console.log(socket.id +" -----OFFERING----- " + id) 
        socket.to(id).emit("offer", socket.id, offer)
    })

    socket.on("answer", (id, answer) => {
        console.log(socket.id +" -----ANSWERING----- " + id) 
        socket.to(id).emit("answer", socket.id, answer)
    })

    socket.on("ice", (id, ice) => {
        console.log(socket.id +" -----ICING----- " + id) 
        socket.to(id).emit("ice", socket.id, ice)
    })

    socket.on("disconnect", () => {
        console.log("-----CLIENT DISCONNECTED: " + socket.id)
        io.emit("delete", socket.id)
        var index = connected_users.indexOf(socket.id)
        if(index > -1){
            connected_users.splice(index, 1)
        }
        // console.log(connected_users.length)
    })

    // socket.on("mute", () => {
    //     console.log("-----MUTING: "+ socket.id)
    //     socket.to(socket.id).emit("mute", socket.id)
    // })

    // socket.on("unmute", () => {
    //     console.log("-----UNMUTING: "+ socket.id)
    //     socket.to(socket.id).emit("unmute", socket.id)
    // })
})