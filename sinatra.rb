#!/usr/bin/env ruby
  
$: << File.expand_path('../../lib/', __FILE__)
require 'rubygems' 
require 'bundler/setup'
require 'sinatra'
require 'sinatra-websocket'
require 'json'


set :sockets, []

configure do 
  set :server, 'thin'
  set :environment, 'production'
end


get '/' do
  if !request.websocket?
    erb :cargame
  else
    request.websocket do |ws|
      ws.onopen do
        
        # Access properties on the EM::WebSocket::Handshake object, e.g.
        # path, query_string, origin, headers
        json_string = {
              "event" => "registerPlayer"
            }.to_json
        
        ws.send json_string
        
        settings.sockets << ws  # append socket to array
        puts "WebSocket connection open. Clients connected: #{settings.sockets.length}"
      end
      ws.onmessage do |msg|
        EM.next_tick { settings.sockets.each{|s| s.send(msg) } }
      end
      ws.onclose do
        warn("websocket closed")
        settings.sockets.delete(ws)
      end
    end
  end
end


x = 0

get '/pb' do
  x+=1
  puts x
end


__END__
@@ index
<html>
  <body>
     <h1>Simple Echo & Chat Server</h1>
     <form id="form">
       <input type="text" id="input" value="send a message"></input>
     </form>
     <div id="msgs"></div>
     
  </body>

  <script type="text/javascript">
    window.onload = function(){
      (function(){
        var show = function(el){
          return function(msg){ el.innerHTML = msg + '<br />' + el.innerHTML; }
        }(document.getElementById('msgs'));
        var ws       = new WebSocket('ws://' + window.location.host + window.location.pathname);
        ws.onopen    = function()  { show('websocket opened'); };
        ws.onclose   = function()  { show('websocket closed'); }
        ws.onmessage = function(m) { show('websocket message: ' +  m.data); };

        var sender = function(f){
          var input     = document.getElementById('input');
          input.onclick = function(){ input.value = "" };
          f.onsubmit    = function(){
            ws.send(input.value);
            input.value = "send a message";
            return false;
          }
        }(document.getElementById('form'));
      })();
    }
  </script>
</html>
