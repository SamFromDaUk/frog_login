frog_login.push({

    /**
     *  Bind
     *
     *  Binds all events to the required elements
     *
     *  @param null
     *  @return null
     *
     **/
    bind: function() {
        var self = this,
            keys = [],
            i = 0;
        
        for(var key in this){
            keys.push(key);
        }
        
        for ( i; i < keys.length; i++ ) {
            
            if ( keys[i].match(/[ ]/) ) {
                
                var delegateFunc = keys[i].split(' '),
                    event = delegateFunc[ delegateFunc.length-1 ].replace('|', ', '),
                    selector = '',
                    keyName = keys[i];
                
                for (var x = 0; x < delegateFunc.length-1; x++) {
                    if (selector !== '') {
                        selector += ' ';
                    }
                    selector += delegateFunc[x];
                }
                    
                (function(keyName) {
                    $('body').on( event, selector, function(ev) {
                        ev.preventDefault();
                        self[ keyName ]( ev, ev.target );
                    });
                })(keyName);
            }
        }
        
        this.sortable();
        
    },

    'button[data-action="login"] click': function(ev, el) {
        var $this = $(el),
            user = $this.siblings('input.user').val(),
            pass = $this.siblings('input.pass').val();
            
        this.login( this.url.val() , user, pass );
    },
    
    'button[data-action="new"] click': function(ev, el) {
        $('button.new_login').parent().before( this.loginTpl );
        this.save( this.form );
        this.updateButtons();
    },
    
    'button[data-action="delete"] click': function(ev, el) {
        $(el).closest('.login_inline').remove();
        this.save( this.form );
        this.updateButtons();
    },
    
    'button[data-action="defaults"] click': function(ev, el) {
        this.clearLogins();
        this.data.urls[this.data.active].login = this.defaultLogins;
        this.save();
        this.render();
    },
    
    'button[data-action="import"] click': function(ev, el) {
        $('.import_area').toggle();
    },

    'button[data-action="import.delete"] click': function(ev, el) {
        $('.import_area').children('textarea').val('');
    },

    'button[data-action="import.logins"] click': function(ev, el) {
        var $this = $(el),
            importStr = $this.siblings('textarea').val().replace(/ /g,'').replace(/\n/g,'');
        
        this.importToUrl( $this.siblings('textarea').val().replace(/\n/g,' ') );
        
        if ( this.importToLogins(importStr) ) {
            $this.siblings('textarea').val('');
            $('.import_area').hide();
        }
        this.save( this.form );
        this.updateButtons();
    },

    'button[data-action="clear"] click': function(ev, el) {
        this.clearLogins(true);
        this.save( this.form );
        this.updateButtons();
    },
    
    'button[data-action="passwords"] click': function(ev, el) {
        var $passwords = $('.hide_passwords').children('input');
        
        if ( $passwords.is(':checked') ) {
            $passwords.prop('checked', false);
            this.data.password = false;
        } else {
            $passwords.prop('checked', true);
            this.data.password = true;
        }
        
        this.clearLogins();
        this.renderFromStorage();
    },

    'button[data-action="add.url"] click': function(ev, el) {
        var self = this;
        
        chrome.tabs.getSelected(null, function(tab) {
            self.data.urls[self.data.active].url = tab.url;
            self.clearLogins();
            self.renderFromStorage();
            self.updateButtons();
            self.save( self.form );
            self.updateActiveSiteUrl( tab.url );
        });
    },
    
    'button[data-action="new.site"] click': function(ev, el) {
        this.data.urls.push(
            {url:'', login:[{user:'', pass:''}]}
        );
        
        this.data.active = this.data.urls.length -1;
        
        this.render();
        this.updateButtons();
        this.save( this.form );
    },
    
    'span[data-action="remove.site"] click': function(ev, el) {
        ev.stopPropagation();
        
        var index = $(el).parent().attr('data-index');
        
        if ( this.data.urls.length < 2 ) {
            return;
        }
        
        this.data.urls.splice(index, 1);
    
        if ( !this.data.urls[this.data.active] ) {
            this.data.active--;
        }

        this.save();
        this.render();
    },
    
    'input keyup': function(ev, el) {
        if ( $(el).hasClass('url') ) {
            this.updateActiveSiteUrl( $(el).val() );
        }
        this.save( this.form );
        this.updateButtons();
        
    },
    
    'ul.sites li click': function(ev, el) {
        var $this = $(el);

        if ( $this.hasClass('active') ) { return; }

        this.data.active = parseInt($this.index(), 10);
        this.save();
        this.render();
    }
    
});