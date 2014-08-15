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
 
  @player_queue = Array.new()
  
  @game_is_playing = false
  
  def self.register_player(socket)
    
    if @game_is_playing
      
      # if we're here, then the game is full
      @player_queue << socket;
      puts "player queue #{@player_queue.length}"
      
      json_string = {
        "event" => "registrationFailed"
      }.to_json
      
      socket.send json_string
      
      return
    end
    
    
    @players.each do |key, value|
      if value == false
        @players[key] = socket
        puts "player #{@players[key]} in the game"
        
        json_string = {
          "event" => "registerPlayer",
          "data"  => {
            "player" => key
          }
        }.to_json
        
        # note: on client end, check for player value
        socket.send json_string
        break
      end
      
    end
    
    puts "@players[player1]: #{@players["player1"]}"
    puts "@players[player2]: #{@players["player2"]}"
    puts "@game_is_playing: #{@game_is_playing}"
    
    if !@game_is_playing && @players["player1"] != false && @players["player2"] != false 
      CarGameServer.begin_game
    end
              
  end
  
  
  def self.begin_game
    puts 'WE ARE COMMENCING A GAME'
    # we have a full game. Commence game!
    json_string = {
      "event" => "gameStart"
    }.to_json
    
    @players["player1"].send json_string
    @players["player2"].send json_string
    
    @game_is_playing = true
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
    
    CarGameServer.begin_game
  end
  
  
  
  
  def self.remove_player(socket)
    @players.each do |key, value|
      if @players[key] == socket
        @players[key] = false
        break
      end
    end
    
    # remove from queue
    did_it_remove = @player_queue.delete(socket)
    puts "I removed: #{did_it_remove}"
    
  end
  

  def self.reset_players(json_string)
    
    @players.each do |key, value|
      if @players[key] != false
        @players[key].send json_string
      end
    end
    
    @game_is_playing = false
    
    @players = {
      "player1" => false,
      "player2" => false
    }
    
    
    puts "@player_queue.length: #{@player_queue.length}"
    # if there are two people in the queue, the game will start again
    if @player_queue.length >= 2
      # lets play, put both players in.
      CarGameServer.register_players(@player_queue.shift, @player_queue.shift)
    end
    if @player_queue.length == 1
      # register this guy
      CarGameServer.register_player(@player_queue.shift)
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
            CarGameServer.register_player(socket)
          end
        end
        
        socket.onclose do 
          puts "Closed a connection"
          
          #remove from @players & remove from queue
          CarGameServer.remove_player(socket)
          
          
          #socket.send "{'message':'I closed you'}"
          
          CarGameServer.em_channel.unsubscribe(sid)
          puts "client disconnected: #{sid}"
          
        end
        
      end
  
    end
  
    # Run our sinatra server
    App.run! :port => 3000
    
  end

end

