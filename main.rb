require 'em-websocket'
require 'json'

EM.run {
  
  #Multiusers
  @clients = []
  
  player1 = false
  player2 = false
  
  
  EM::WebSocket.run(:host => "0.0.0.0", :port => 8080) do |socket|
    
    socket.onopen do |handshake|
      @clients << socket # append socket to array
      
      puts "WebSocket connection open. Clients connected: #{@clients.length}"

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

    end

    socket.onmessage do |jsonObj|
      
      hash = JSON.parse jsonObj
      
      if hash['data']['player1'] == true
        player1 = true
        puts "player1: #{player1}"
        
        json_string = { 
          "event" => "registerPlayer",
          "data" => {
            "player1" => true
          },
         }.to_json
        
        puts json_string
        
        socket.send json_string
      end
      
      
      # @clients.each do |s|
        # s.send jsonObj
      # end
      
    end

    socket.onclose do 
      puts "Connection closed"
      socket.send "{'message':'I closed you'}"
      @clients.delete socket
      puts "clients now connected: #{@clients.length}"
    end
  end
}

