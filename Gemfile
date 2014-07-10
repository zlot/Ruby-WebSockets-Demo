source 'https://rubygems.org'

gem 'sinatra'
gem 'sinatra-websocket'

# error using latest em-websocket with sinatra-websocket '[23074:ERROR] 2013-02-13 16:18:46 :: uninitialized constant EventMachine::WebSocket::HandlerFactory'
# fix is to use a version prior to 0.3.8, as per issue found here (unrelated git project): https://github.com/postrank-labs/goliath/issues/228 
gem 'em-websocket', '0.3.7'

