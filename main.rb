require 'em-websocket'
require 'json'
require 'socket'

# class Client
  # attr_accessor :websocket
  # attr_accessor :name
# 
  # def initialize(websocket_arg)
    # @websocket = websocket_arg
  # end
# end



EM.run {
  
  #Multiusers
  @clients = []
  
  @players = {
    "player1" => false,
    "player2" => false,
  }
  
  @host = "0.0.0.0" # serve to all on network
  @port = 8080
  @ipaddress = IPSocket.getaddress(Socket.gethostname)
  puts "WebSocket server running on #{@ipaddress}, port #{@port}"  

  EM::WebSocket.run(:host => @host, :port => @port) do |socket|
    
    socket.onopen do |handshake|
      @clients << socket # append socket to array
      
      puts "WebSocket connection open. Clients connected: #{@clients.length}"

      # Access properties on the EM::WebSocket::Handshake object, e.g.
      # path, query_string, origin, headers

    end

    socket.onmessage do |jsonObj|
      
      hash = JSON.parse jsonObj
      
      if hash["event"] == "registerPlayer"
      
        registration_full = true
        
        # check player array. If there is a false, set this as player
        @players.each do |key, value|
          if value == false
            # we can register this player. set & return
            @players[key] = socket
            
            # this is a bit dodgy, as when the 2nd player registers,
            # this is actually true. but for the logic below to work, we say
            # false for now. REFACTOR LATER.
            registration_full = false
            
            json_string = {
              "event" => "registerPlayer",
              "data"  => {
                "player" => "#{key}"
              }
            }.to_json
            
            # note: on client end, check for player value
            socket.send json_string
            break
          end
        end
        
        # puts @players
        
        if registration_full
          json_string = {
            "event" => "registrationFailed"
          }.to_json
          
          socket.send json_string
        end
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

