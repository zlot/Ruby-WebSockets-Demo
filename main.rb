require 'em-websocket'

EM.run {
  
  #Multiusers
  @clients = []
  
  EM::WebSocket.run(:host => "0.0.0.0", :port => 8080) do |socket|
    
    socket.onopen do |handshake|
      @clients << socket # append socket to array
      
      puts "WebSocket connection open. Clients connected: #{@clients.length}"

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

    end

    socket.onmessage do |data|
      @clients.each do |s|
        puts data
        s.send data
      end
      
    end

    socket.onclose do 
      puts "Connection closed"
      socket.send "{'message':'I closed you'}"
      @clients.delete socket
      puts "clients now connected: #{@clients.length}"
    end
  end
}

