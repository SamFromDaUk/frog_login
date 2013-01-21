frog_login.push({
    
    socket: {
        init: function() {
            this.connection = new WebSocket(this.address, 'echo');
            
            if (!this.connection) { 
                this.message('Unable to connect to web socket'); 
            }
        },
        
        send: function(message) {
            var self = this;
            
            if (!this.connection) { 
                return; 
            }

            if (this.connection.readyState !== 1) {
                setTimeout(function () {
                    self.send(message);
                }, 10);
                return;
            }

            this.connection.send(message);
        }
    } 
    
});