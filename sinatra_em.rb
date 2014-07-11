require 'bundler/setup'
require 'json'
require 'thin'
require 'sinatra/base'
require 'em-websocket'


module CarGameServer


  #create @em_channel instance var
  def self.em_channel
    @em_channel ||= EM::Channel.new
  end

  @players = {
    "player1" => false,
    "player2" => false,
  }
  
  
  def self.register_player(socket)
    @players.each do |key, value|
      if value == false
        @players[key] = socket
        puts "player #{@players[key]} in the game"
        return key
      end
    end
    # if we've gotten here, then the game is full
    return false
  end
  

  def self.reset_players
    @players = {
      "player1" => false,
      "player2" => false,      
    }
  end


  EM.run do
    
    # Sinatra
    # -------------------------------------------
    class App < Sinatra::Base
      
      get '/' do
        erb :cargame
      end
      
      get '/test' do
        # wipe players array
        CarGameServer.reset_players
        
        # pass gameOver event to all connected clients
        json_string = {
          "event" => "gameOver"
        }.to_json
        
        CarGameServer.em_channel.push json_string
        status 200
      end
      
    end
  
    
    # WebSockets
    # -------------------------------------------
    @host = "0.0.0.0" # serve to all on network
    @port = 8080
    @ipaddress = IPSocket.getaddress(Socket.gethostname)
    puts "WebSocket server running on #{@ipaddress}, port #{@port}"  

    EM::WebSocket.run(:host => @host, :port => @port) do |socket|
      
      socket.onopen do |handshake|
        
        # subscribe the connected socket to em_channel
        # This is how we can pass socket messages to subscribed channels
        sid = CarGameServer.em_channel.subscribe do |msg|
          socket.send msg
        end
        
        socket.onmessage do |jsonObj|
        
          
          hash = JSON.parse jsonObj
          
          if hash["event"] == "registerPlayer"
          
            # check player array. If there is a false, set this as player
            registered = CarGameServer.register_player(socket)
            
            if registered == false
              json_string = {
                "event" => "registrationFailed"
              }.to_json
              
              socket.send json_string 
            else 
              
              # todo: check if register_player actually succeeded
              json_string = {
                "event" => "registerPlayer",
                "data"  => {
                  "player" => registered
                }
              }.to_json
              
              # note: on client end, check for player value
              socket.send json_string
            end
            
            

            
            
            
            # if registration_full

            # end
          end
          
          
          
        end
        
        
        socket.onclose do 
          puts "Closed a connection"
          socket.send "{'message':'I closed you'}"
          
          CarGameServer.em_channel.unsubscribe(sid)
          puts "client disconnected: #{sid}"
          
        end
        
      end
  

    end
  
  
  
    # Run our sinatra server
    App.run! :port => 3000
    
  end


end

