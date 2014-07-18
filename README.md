Car Game in Coolux's Pandora's Box, controlled via an interface served by Sinatra & WebSockets
----------------------------------------------------------------------------------------------

## Instructions

- Run `Car Game.wdp` in Widget Designer. Make sure the Pandora's Box Master Connection
is pointing correctly to the IP Address of the Media Manager computer.
- Test it by clicking the Push me buttons.
- Start the Web Server (in Widget Designer).
- Make sure the `url` option in ajax call of `SetData()` and `GetData()` in `WD_Standard.js` is set to the correct IPAddress of Widget Designer. 
- '$ ruby sinatra_em.rb' to begin an EventMachine, integrated with a Sinatra web server 
on port 3000 and a WebSocket server on port 8080
- Visit `ipaddress:3000` from an iPhone to join the game!
- To reset the game, for now, restart the Web Sockets server.


