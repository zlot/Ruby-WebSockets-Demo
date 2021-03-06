/* Ismael Celis 2010
 Simplified WebSocket events dispatcher (no channels, no users)

 var socket = new FancyWebSocket();

 // bind to server events
 socket.bind('some_event', function(data){
 alert(data.name + ' says: ' + data.message)
 });

 // broadcast events to all connected users
 socket.send( 'some_event', {name: 'ismael', message : 'Hello world'} );
 */

var WebSocketWithDispatcher = function(url) {
  var conn = new WebSocket(url);

  var callbacks = {};

  this.bind = function(event_name, callback) {
    callbacks[event_name] = callbacks[event_name] || [];
    callbacks[event_name].push(callback);
    return this; // chainable
  };

  this.send = function(event_name, event_data) {
    var payload = JSON.stringify({
      'event' : event_name,
      'data' : event_data
    });
    conn.send(payload); // send JSON string to socket server 
    return this;
  };
  

  // dispatch to the right handlers
  conn.onmessage = function(evt) {
    console.log(evt.data);
    var json = JSON.parse(evt.data);
    dispatch(json.event, json.data);
  };

  conn.onclose = function() {
    dispatch('message', {
      'message':'I have closed a connection'
    });
  };
  conn.onopen = function() {
    dispatch('open', null);
  };
  
  var dispatch = function(event_name, objData) {
    var chain = callbacks[event_name];
    if ( typeof chain == 'undefined')
      return; // no callbacks for this event
      
    for (var i = 0; i < chain.length; i++) {
      chain[i](objData);
    };
  };
}; 