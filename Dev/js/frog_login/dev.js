frog_login.push({


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

        $('.clear_all_data').click(function() {
            window.localStorage.setItem(
                'frog_log',
                ''
            );
            alert('cleared localStorage');
        });

        $('.log_temp').click(function() {
            console.log(self.data);
            alert('Temp data stored on console');
        });
        
        $('.log_stored').click(function() {
            console.log( JSON.parse(window.localStorage.getItem('frog_log')) );
            alert('Stored data shown on console');
        });
        
        $('.insert_json').click(function() {
            var area = $('<textarea class="insert"></textarea>'),
                close = $('<button class="btn btn-mini btn-danger insert">Close</button>'),
                insert = $('<button class="btn btn-mini btn-success insert">Insert</button>');
                
            insert.click(function(ev) {
                var string = $(this).siblings('textarea').val(),
                    tested;
                
                try {
                    tested = JSON.parse(string);
                    self.data = tested;
                    self.save();
                    self.render();
                    alert('save successful');
                } catch(Exception) {
                    alert('unable to parse json');
                }
            });
            
            close.click(function() {
                $(this).siblings('.insert').remove().end().remove();
            });
                
            $('div.dev_bar').append(area, insert, close);
        });
        
        $('.data_as_string').click(function() {
            var area = $('<textarea class="string"></textarea>'),
                close = $('<button class="btn btn-mini btn-danger string">Close</button>');
            
            area.val( JSON.stringify(self.data) );

            close.click(function() {
                $(this).siblings('.string').remove().end().remove();
            });
            
            $('div.dev_bar').append(area, close);
        });
    }
    
})