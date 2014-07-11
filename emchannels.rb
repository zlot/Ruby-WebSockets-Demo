require 'em-websocket'
require 'sinatra'


module Example
  
  # create @em_channel instance var
  def self.em_channel
    @em_channel ||= EM::Channel.new
  end
  
  EventMachine.run do
    
    class App < Sinatra::Base
      
      
      get '/' do
        erb :cargame
      end
      
      get '/test' do
        Example.em_channel.push "Test request hit endpoint"
        status 200
      end
    end

    EventMachine::WebSocket.start :host => '0.0.0.0', :port => 8080 do |socket|
      
      socket.onopen do
        sid = Example.em_channel.subscribe do |msg|
          socket.send msg
        end
        
        Example.em_channel.push "Subscriber ID #{sid} connected!"
        
        socket.onmessage do |msg|
          Example.em_channel.push "Subscriber <#{sid}> sent message: #{msg}"
        end
      
        socket.onclose do
         Example.em_channel.unsubscribe(sid)
        end
        
      end
      
    end
    
    App.run!
    
  end
end


