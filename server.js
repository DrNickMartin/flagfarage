var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');

var server = http.createServer(handleRequest);
server.listen(process.env.PORT);

const {
  Pool
} = require('pg')

//'postgres://postgres:1234@localhost:5432/nicklocaldb'
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;

  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }

  // Ok what's our file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css'
  };

  // What is it?  Default to plain text
  var contentType = typeExt[ext] || 'text/plain';

  // User file system module
  fs.readFile(__dirname + pathname,
    // Callback function for reading
    function (err, data) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200, {
        'Content-Type': contentType
      });
      res.end(data);
    }
  );
}


// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(server);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  // We are given a websocket object in our function
  function (socket) {

    console.log("We have a new client: " + socket.id);

    // When this user emits, client side: socket.emit('otherevent',some data);
    socket.on('inc_count', function () {

      pool.connect((err, client, done) => {
        if (err) throw err
        client.query('UPDATE count SET counter=counter+1;', (err, res) => {
          done()
          if (err) {
            console.log(err.stack)
          }
        })
      })

      pool.connect((err, client, done) => {
        if (err) throw err
        client.query('SELECT counter FROM count;', (err, res) => {
          done()
          if (err) {
            console.log(err.stack)
          } else {
            io.sockets.emit('set_count', res.rows[0]["counter"]);
          }
        })
      })

    });

    socket.on('disconnect', function () {
      console.log("Client has disconnected");
    });
  }
);

pool.connect((err, client, done) => {
  if (err) throw err
  client.query('SELECT counter FROM count;', (err, res) => {
    done()
    if (err) {
      console.log(err.stack)
    } else {
      io.sockets.emit('set_count', res.rows[0]["counter"]);
    }
  })
})