$(function() { options.init(); });

var options = {
    
    data: {},
    
    init: function() {
        this.data = this.loadOptions();
        this.bind();
        
        if (!this.data) {
            return;
        }
        
        if ( this.data.mode ) {
            $('.app_mode').val(this.data.mode);
        }
        if ( typeof this.data.active !== 'undefined' ) {
            $('.app_active').val(this.data.active);
        }
        if ( typeof this.data.password !== 'undefined' ) {
            $('.app_passwords').val(this.data.password.toString());
        }
    },
    
    bind: function() {
        var self = this;
        
        $('.options .btn-primary').click(function() {
            $('.options').find('input').each(function() {
                
                var value;
                switch ( $(this).attr('data-type') ) {
                    case 'text' :
                        value = $(this).val();
                        break;
                    case 'number':
                        value = parseInt($(this).val(), 10);
                        break;
                    case 'boolean':
                        value = ($(this).val() === 'true') ? true : false;
                        break;
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