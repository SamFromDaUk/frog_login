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
        if ( typeof this.data.importUsers !== 'undefined') {
            var insertText = '';
            for (var i = 0; i < this.data.importUsers.length; i++) {
                if (i > 0) { insertText += '\n'; }
                insertText += this.data.importUsers[i];
            }
            $('.app_import_logins').val(insertText);
        }
    },
    
    bind: function() {
        var self = this;
        
        $('.options .btn-primary').click(function() {
            $('.options').find('input, textarea').each(function() {
                
                var value,
                    $this = $(this);
                    
                switch ( $this.attr('data-type') ) {
                    case 'text' : value = $this.val();
                        break;
                    case 'number': value = parseInt($this.val(), 10);
                        break;
                    case 'boolean':
                        value = $this.is(':checked');
                        break;
                    case 'textarea':
                        value = [];
                        textVal = $this.val().split('\n');

                        for (var i = 0; i < textVal.length; i++) {
                            if ( $.trim(textVal[i]).length > 1 ) {
                                value.push( $.trim(textVal[i]) );
                            }
                        }
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