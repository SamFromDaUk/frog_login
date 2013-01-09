$(function() { options.init(); });

var options = {
    
    data: {},
    
    init: function() {
        this.data = this.loadOptions();
        this.bind();
        
        if (!this.data) {
            return;
        }
        
        if ( typeof this.data.mode !== 'undefined'  ) {
            if ( this.data.dev_mode ) $('.app_dev_mode').prop('checked', true);
        }
        if ( typeof this.data.active !== 'undefined' ) {
            $('.app_active').val(this.data.active);
        }
        if ( typeof this.data.password !== 'undefined' ) {
            if ( this.data.password ) $('.app_passwords').prop('checked', true);
        }
    },
    
    bind: function() {
        var self = this;
        
        $('.options .btn-primary').click(function() {
            $('.options').find('input').each(function() {
                
                var value,
                    $this = $(this);
                    
                switch ( $this.attr('data-type') ) {
                    case 'text' : value = $this.val();
                        break;
                    case 'number': value = parseInt($this.val(), 10);
                        break;
                    case 'boolean':
                        value = $this.is(':checked');
                }
                                
                self.data[ $(this).attr('data-name') ] = value;
            });
            self.saveOptions();
        });
    },
    
    loadOptions: function() {
        var data;
        try {
            data = JSON.parse( window.localStorage.getItem('frog_log') );
        } catch(Exception) {
            return {
                'active': 0,
                'password': true,
                'mode': 'production',
                'urls': [
                    {url: '', login:[
                        {user:'', pass:''}
                    ]}
                ]
            };
        }
        return data;
    },
    
    saveOptions: function() {
        window.localStorage.setItem('frog_log', JSON.stringify(this.data));
        window.close();
    }
};