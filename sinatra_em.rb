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
    "player2" => false
  }
 
  @player_queue = Queue.new()
  
  # add players to queue
  
  # game is over? take the next 2 players from the queue
  
  # player disconnected? Then take them out of the queue.
  
  def self.register_player(socket)
    @players.each do |key, value|
      if value == false
        @players[key] = socket
        puts "player #{@players[key]} in the game"
        if key == "player2"
          # we have a full game. Commence game!
          json_string = {
            "event" => "gameStart"
          }.to_json
          
          @players["player1"].send json_string
          @players["player2"].send json_string
        end
        
        return key
      end
    end
    # if we've gotten here, then the game is full
    @player_queue << socket;
    puts "player queue #{@player_queue.length}"
    return false
  end
  
  # only to be used by self.reset_players().
  def self.register_players(socket1, socket2)
    @players["player1"] = socket1
    @players["player2"] = socket2
    
    
    json_string = {
      "event" => "registerPlayer",
      "data"  => {
        "player" => "player1"
      }
    }.to_json
    @players["player1"].send json_string
    
    json_string = {
      "event" => "registerPlayer",
      "data"  => {
        "player" => "player2"
      }
    }.to_json
    @players["player2"].send json_string
    
    
    json_string = {
      "event" => "gameStart"
    }.to_json
    
    @players["player1"].send json_string
    @players["player2"].send json_string
  end
  
  
  
  
  def self.remove_player(socket)
    @players.each do |key, value|
      if @players[key] == socket
        @players[key] = false
        break
      end
    end
  end
  

  def self.reset_players(json_string)
    
    @players.each do |key, value|
      @players[key].send json_string
    end
    
    @players = {
      "player1" => false,
      "player2" => false
    }
    
    puts "@player_queue.length: #{@player_queue.length}"
    # if there are two people in the queue, the game will start again
    if @player_queue.length >= 2
      # lets play, put both players in.
      CarGameServer.register_players(@player_queue.pop, @player_queue.pop)
    end
    if @player_queue.length == 1
      # register this guy
      CarGameServer.register_player(@player_queue.pop)
    end
    
  end


  EM.run do
    
    # Sinatra
    # -------------------------------------------
    class App < Sinatra::Base
      
      configure do
        set :environment, 'production'
      end
      
      get '/' do
        erb :cargame
      end
      
      # either one or the other will be sent via WD when game is over.
      get '/player1wins' do
        # tell clients
        json_string = {
          "event" => "gameOver",
          "data" => {
            "winner" => "player1"
          }
        }.to_json
        
        puts "The winner is player 1!"
        
        # reset game
        CarGameServer.reset_players(json_string)
      end

      get '/player2wins' do
        # tell clients
        json_string = {
          "event" => "gameOver",
          "data" => {
            "winner" => "player2"
          }
        }.to_json
        
        puts "The winner is player 2!"
        
        # reset game
        CarGameServer.reset_players(json_string)
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
          end
        end
        
        socket.onclose do 
          puts "Closed a connection"
          
          CarGameServer.remove_player(socket)
          
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

