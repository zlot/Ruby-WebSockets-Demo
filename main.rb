require 'em-websocket'

EM.run {
  EM::WebSocket.run(:host => "0.0.0.0", :port => 8080) do |socket|
    
    #Multiuser 
    @sockets = []
    
    socket.onopen { |handshake|
      @sockets << socket # append socket to array
      
      puts "WebSocket connection open"

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

      # Publish message to the client
      socket.send "Hello Client, you are connected to handshake.path: #{handshake.path}"
    }

    socket.onmessage { |data|
      @sockets.each do |s|
        s.send "Pong: #{data}"
      end
      
      #puts "Recieved message: #{msg}"
      #socket.send "Pong: #{msg}"
    }

    socket.onclose { 
      puts "Connection closed"
      puts "@sockets length: #{@sockets.length}"
    }
  end
}

