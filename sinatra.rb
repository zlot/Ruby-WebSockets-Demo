#!/usr/bin/env ruby
  
# $: << File.expand_path('../../lib/', __FILE__)
require 'rubygems' 
require 'bundler/setup'
require 'sinatra'
require 'sinatra-websocket'
require 'json'


configure do 
  set :server, 'thin'
  set :environment, 'production'
end


#Multiusers
set :sockets, []

players = {
  "player1" => false,
  "player2" => false,
}
  
  
ipaddress = IPSocket.getaddress(Socket.gethostname)
puts "WebSocket server running on #{ipaddress}"


get '/' do
  if !request.websocket?
    erb :cargame
  else
    request.websocket do |ws|
      
      ws.onopen do |handshake|
        # Access properties on the EM::WebSocket::Handshake object, e.g.
        # path, query_string, origin, headers
        
        settings.sockets << ws  # append socket to array
        
        puts "WebSocket connection open. Clients connected: #{settings.sockets.length}"
        puts settings.sockets
      end
      
      
      ws.onmessage do |jsonObj|

       hash = JSON.parse jsonObj
        
        if hash["event"] == "registerPlayer"
        
          registration_full = true
          
          # check player array. If there is a false, set this as player
          players.each do |key, value|
            if value == false
              # we can register this player. set & return
              players[key] = ws
              
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
              ws.send json_string
              break
            end
          end
          
          # puts @players
          
          if registration_full
            json_string = {
              "event" => "registrationFailed"
            }.to_json
            
            ws.send json_string
          end
        end
  
        
        # @clients.each do |s|
          # s.send jsonObj
        # end


      end
      
      ws.onclose do
        puts "Connection closed"
        ws.send "{'message':'I closed you'}"
        settings.sockets.delete ws
        puts "clients now connected: #{settings.sockets.length}"        
      end
      
    end
  end
end


x = 0

get '/pb' do
  # wipe players array
  players = {
    "player1" => false,
    "player2" => false,
  }
end


