var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var messageHistory = []
var onlineUsers = {}
var randomNames = [
    'Sharee',
    'Karma',
    'Ardell',
    'Angel',
    'Pamelia',
    'Bell',
    'Nenita',
    'Leonida',
    'Rosetta',
    'Kyoko',
    'Peggy',
    'Nickie',
    'Emory',
    'Julene',
    'Ashlea',
    'Ermelinda',
    'Marisol',
    'Dennise',
    'Jamar',
    'Percy',
    'Jacquie',
    'Marylee',
    'Gwendolyn',
    'Carma',
    'Grisel',
    'Margarette',
    'Lashaunda',
    'Kerri',
    'Cami',
    'Berna',
    'Jeannine',
    'Deann',
    'Jadwiga',
    'Amberly',
    'Federico',
    'Sina',
    'Jamaal',
    'Brock',
    'Samatha',
    'Maryanne',
    'Janel',
    'Demetrice',
    'German',
    'Kristi',
    'Minerva',
    'Manuela',
    'Madeline',
    'Grace',
    'Edmund',
    'Julius'
];


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(client){
    client.emit("init", "");

    client.on('init', function(nickname) {
        let newNickname = nickname;
        let currentNames = [];
        let sorry = false;
        for (let id in onlineUsers) {
            currentNames.push(onlineUsers[id].nickname);
        }
        if(currentNames.includes(newNickname)) {
            sorry = true;
        }
        if(newNickname === null || currentNames.includes(newNickname)) {
            newNickname = randomNames[Math.floor(Math.random() * randomNames.length)]
        }
        client.emit('your nickname', newNickname);
        for(let id in onlineUsers) {
            client.emit('online user', onlineUsers[id].nickname)
        }
        onlineUsers[client.id] = {
            socket: client,
            nickname: newNickname,
            color: null
        }
        io.emit('online user', onlineUsers[client.id].nickname)
        messageHistory.forEach(function(msg){
            client.emit('message', msg);
        });
        let welcomeMsg = {
            message: 'Welcome \'' + onlineUsers[client.id].nickname + '\'!',
            timestamp: new Date(),
            nickname: "Server"
        };

        if(sorry) {
            welcomeMsg.message = 'Welcome \'' + onlineUsers[client.id].nickname + '\'!' + " Sorry your old name was taken :("
        }
        messageHistory.push(welcomeMsg);
        if(messageHistory.length > 200) {
            messageHistory.shift();
        }
        io.emit('message', welcomeMsg);
    });
    client.on('setColor', function(color) {
        onlineUsers[client.id].color = color;
        let changed = {
            message: "'" + onlineUsers[client.id].nickname + "' changed color to '" + color + "'",
            timestamp: new Date(),
            nickname: "Server"
        }
        io.emit('message', changed);
        messageHistory.push(changed);
        if(messageHistory.length > 200) {
            messageHistory.shift();
        }
    })
    client.on('initColor', function(color) {
        onlineUsers[client.id].color = color;
    })
    client.on('message', function(msg){
        if(msg.startsWith('/nick ')) {
            let oldNickname = onlineUsers[client.id].nickname
            let changedNickname = msg.substring(6, msg.length).trim();
            let currentNames = [];
            for (let id in onlineUsers) {
                currentNames.push(onlineUsers[id].nickname);
            }
            if(currentNames.includes(changedNickname)) {
                let disallowMsg = {
                    message: "'" + onlineUsers[client.id].nickname + "', someone is already called '" + changedNickname + "'",
                    timestamp: new Date(),
                    nickname: "Server"
                };
                messageHistory.push(disallowMsg);
                if(messageHistory.length > 200) {
                    messageHistory.shift();
                }
                io.emit('message', disallowMsg);
            } else if(changedNickname === 'Server') {
                let disallowMsg = {
                    message: "'" + onlineUsers[client.id].nickname + "' you are not allowed to be called Server",
                    timestamp: new Date(),
                    nickname: "Server"
                };
                messageHistory.push(disallowMsg);
                if(messageHistory.length > 200) {
                    messageHistory.shift();
                }
                io.emit('message', disallowMsg);
            } else {
                client.emit('your nickname', changedNickname);
                let changed = {
                    message: "'" + oldNickname + "' is now '" + changedNickname + "'",
                    timestamp: new Date(),
                    nickname: "Server"
                }
                io.emit('message', changed);
                messageHistory.push(changed);
                if(messageHistory.length > 200) {
                    messageHistory.shift();
                }
                onlineUsers[client.id].nickname = changedNickname
                io.emit("disconnect", "garbage");
                for(var id in onlineUsers) {
                    io.emit('online user', onlineUsers[id].nickname)
                }
                client.emit('your nickname', changedNickname);
            }
        } else {
            let newMsg = {
                message: msg,
                timestamp: new Date(),
                nickname: onlineUsers[client.id].nickname,
                color: onlineUsers[client.id].color
            }
            messageHistory.push(newMsg);
            if(messageHistory.length > 200) {
                messageHistory.shift();
            }
            io.emit('message', newMsg);
        }
    });
    client.on('disconnect', function(){
        let disconnectMsg = {
            message: "'" + onlineUsers[client.id].nickname + "' has disconnected'",
            timestamp: new Date(),
            nickname: "Server"
        };
        io.emit('message', disconnectMsg);
        messageHistory.push(disconnectMsg);
        if(messageHistory.length > 200) {
            messageHistory.shift();
        }
        delete onlineUsers[client.id];
        io.emit("disconnect", "garbage");
        for(var id in onlineUsers) {
            io.emit('online user', onlineUsers[id].nickname)
        }
    });
    client.on('quietnickname', function(){
        let oldNickname = onlineUsers[client.id].nickname
        let changedNickname = msg.substring(6, msg.length)
        client.emit('your nickname', changedNickname);
        onlineUsers[client.id].nickname = changedNickname
        io.emit("disconnect", "garbage");
        for(var id in onlineUsers) {
            io.emit('online user', onlineUsers[id].nickname)
        }
        client.emit('your nickname', changedNickname);
    });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
