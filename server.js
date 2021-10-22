const path = require("path");
const express = require("express");
const formatMessage = require("./utils/messages");
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require("./utils/users");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "TechCord Bot";

//Run when client connects
io.on("connection", socket => {
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcome current user
        socket.emit("message", formatMessage(botName, "ようこそTechCordへ!"));

        //Broadcast when a user connects
        socket.broadcast
        .to(user.room)
        .emit(
            "message", 
            formatMessage(botName, `${user.username} が参加しました。`)
        );

        //Send users and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    //Runs when client disconnects
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                "message", 
                formatMessage(botName, `${user.username} が退出しました。`)
            );

            //Send users and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => console.log(`Server running on port ${PORT}`));