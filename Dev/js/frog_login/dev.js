frog_login.push({

    'a.clear_all_data click': function(ev, el) {
        window.localStorage.setItem(
            'frog_log',
            ''
        );
        alert('cleared localStorage');
    },
    
    'a.log_temp click': function(ev, el) {
        console.log(this.data);
        alert('Temp data stored on console');
    },
    
    'a.log_stored click': function(ev, el) {
        console.log( JSON.parse(window.localStorage.getItem('frog_log')) );
        alert('Stored data shown on console');
    },
    
    'a.insert_json click': function(ev, el) {
        var area = $('<textarea class="insert"></textarea>'),
            close = $('<button class="btn btn-mini btn-danger insert">Close</button>'),
            insert = $('<button class="btn btn-mini btn-success insert">Insert</button>'),
            self = this;
            
        insert.click(function(ev) {
            var string = $(this).siblings('textarea').val(),
                tested;
            
            console.log(string);
            
            try {
                tested = JSON.parse(string);
            } catch(Exception) {
                alert('unable to parse json');
                return;
            }
            
            self.data = tested;
            self.save();
            self.render();
            alert('save successful');
        });
        
        close.click(function() {
            $(this).siblings('.insert').remove().end().remove();
        });
            
        $('div.dev_bar').append(area, insert, close);
    },
    
    'a.data_as_string click': function() {
        var area = $('<textarea class="string"></textarea>'),
            close = $('<button class="btn btn-mini btn-danger string">Close</button>');
        
        area.val( JSON.stringify(this.data) );

        close.click(function() {
            $(this).siblings('.string').remove().end().remove();
        });
        
        $('div.dev_bar').append(area, close);
    },

    /**
     *  Development
     *
     *  Any development functions events etc can go in here. This only gets called if this.mode === dev
     *
     *  @param null
     *  @return null
     *
     **/
    dev: function() {
        var self = this;

        $('div.dev_bar').show();
    }
    
});