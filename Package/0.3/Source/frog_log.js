/**
 *  Author  : Sam Warren
 *  Name    : Frog Login
 *  Version : 0.3
 **/

var frog_log = (typeof frog_log === 'object') ? frog_log : {}

$(function() { frog_log.init(); });

var frog_log = {
    
    defaultLogins: [
        {user: 'admin1', pass:'admin1pass'},
        {user: 'admin2', pass:'admin2pass'},
        {user: 'staff1', pass:'staff1pass'},
        {user: 'staff2', pass:'staff2pass'},
        {user: 'student1', pass:'student1pass'},
        {user: 'student2', pass:'student2pass'}
    ],
    queryString : '?delete=true',
    logoutUrl : '/app/os/logout',
    
    /**
     *  Initialise
     *
     *  Generates jQuery elements and retrieves data.
     *  Renders the extension and binds events
     *
     *  @param null
     *  @return null
     *
     **/
    init: function() {               
        this.data = JSON.parse( window.localStorage.getItem('frog_log') );
        this.tpl = $('#tpl').html();
        this.form = $('form');
        this.url = $('input.url');   
        
        this.render( this.generateFromStorage(true) );
        this.bind();
        this.updateButtons();
    },

    /**
     *  Render
     *
     *  Renders logins to the page
     *  Renders saved sites to the page
     *
     *  @param html string
     *  @return null
     *
     **/    
    render: function(html) {
        $('.new_login').parent().before( html );
    },

    /**
     *  Bind
     *
     *  Binds all events the the required elements
     *
     *  @param null
     *  @return null
     *
     **/     
    bind: function() {
        var self = this;
        
        $('body').on('click', 'button', function(ev) {
            ev.preventDefault();
            
            var url = self.form.children('input.url').val(),
                user = $(this).siblings('input.user').val(),
                pass = $(this).siblings('input.pass').val();
            
            switch( $(this).attr('data-action') ) {
                case 'new':
                    $('button.new_login').parent().before( self.tpl );
                    break;
                    
                case 'delete':
                    $(this).parent().remove();
                    break;
                    
                case 'defaults':
                    self.clearLogins();
                    self.render( self.generateFromStorage(false) );
                    break;
                    
                case 'login':
                    self.login(url, user, pass);                    
                    break;
                    
                case 'import':
                    $('.import_area').toggle();
                    break;
                    
                case 'import.delete':
                    $('.import_area textarea').val('');
                    break;    
                
                case 'import.logins':
                    self.message('TODO');
                    break;
                    
                case 'clear':
                    self.clearLogins();
                    $('button.new_login').parent().before( self.tpl );
                    self.updateButtons();
                    break;
            }
            $('button.new_login').trigger('update');
        });
        
        $('body').on('keyup', 'input', function(ev) {
            self.updateButtons();
        });
        
        $('button.new_login').bind('update', function(ev) {
            self.updateButtons();
        });
    },

    /**
     *  Login
     *
     *  Loads the url specified by the user and attempts to login using credentials provided
     *
     *  @param url string
     *  @param user string
     *  @param pass string
     *  @return null
     *
     **/        
    login: function(url, user, pass) {
        var self = this;
        $.ajax({
            url: url + self.logoutUrl,
            success: function(data) {}
        });                
    
        chrome.tabs.getSelected(null, function(tab) {
            tabId = tab.id;
            chrome.tabs.update(tabId, {url: url });
        });
        
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (changeInfo.status === 'complete') {
                chrome.tabs.executeScript(tabId, {code: "var frog_log = {user:'"+ user +"',pass:'"+ pass +"'};"}, function(){
                    chrome.tabs.executeScript(tabId, {file: "login.js"});
                });
            }
        });        
    },

    /**
     *  Update Buttons
     *
     *  Disables and renables buttons depending upon validation
     *
     *  @param null
     *  @return null
     *
     **/       
    updateButtons: function() {

        var self = this,
            login_error = false,
            delete_error = false,
            $primary = $('form .btn-primary'),
            $danger = $('form .btn-danger'),
            $form = $('form'),
            $save = $('.button-group .save'); 

        if (self.url.val() === '') { login_error = true; };
        if ( $('form div.login_inline').length < 2 ) { delete_error = true; }
        
        if (login_error) {
            $primary.attr('disabled', 'disabled')
            $save.attr('disabled', 'disabled')    
        } else {
            $primary.removeAttr('disabled');
            $save.removeAttr('disabled')   
        }
        
        (delete_error) ? $danger.attr('disabled', 'disabled') : $danger.removeAttr('disabled');
                
        $('form div.login_inline').each(function(index, el) {
            $el = $(el);
            if ( $el.children('.user').val() === '' || $el.children('.pass').val() === '' ) {
                $el.children('.btn-primary').attr('disabled', 'disabled');
            }      
        });
        
        this.save( $form );

    },

    /**
     *  Message
     *
     *  Alerts a message to the user
     *
     *  @param message string
     *  @return null
     *
     **/      
    message: function(message) {
        alert(message);
    },

    /**
     *  Clear Logins
     *
     *  Removes any logins from the dom
     *
     *  @param null
     *  @return null
     *
     **/    
    clearLogins: function() {
        $('.login_inline').remove();
    },

    /**
     *  Form element to Object
     *
     *  Takes the form as a jQuery element and return the form object
     *
     *  @param $form jQueryEl
     *  @return object
     *
     **/    
    formElementToObject: function($form) {
        var formData = {
            url: '',
            login: []
        };
        
        formData.url = $form.children('input.url').val();
        
        $form.children('.login_inline').each(function(index, el) {
            formData.login.push({
                'user': $(el).children('input.user').val(),
                'pass': $(el).children('input.pass').val() 
            })
        })
        
        return formData;
        
    },

    /**
     *  Convert Form To object
     *
     *  Takes a form string or jQueryEl and will try to return a form object
     *
     *  @param form mixed
     *  @return object
     *
     **/    
    convertFormToObject: function(form) {
        if (typeof form === 'string') {
            return JSON.parse(form);    
        } else {
            return this.formElementToObject(form);
        } 
    },

    /**
     *  Save
     *
     *  Saves the form to localStorage
     *
     *  @param $form jQueryEl
     *  @return null
     *
     **/    
    save: function( $form ) {
        
        if (!$form) {
            window.localStorage.setItem(
                'frog_log', 
                JSON.stringify(this.data)
            )
            return;          
        }
        
        window.localStorage.setItem(
            'frog_log', 
            JSON.stringify({
                form: this.formElementToObject($form)
            }) 
        )
        this.data = JSON.parse(window.localStorage.getItem('frog_log'));
    },

    /**
     *  Generate From Storage
     *
     *  Renders the form from localStorage
     *
     *  @param $form jQueryEl
     *  @return null
     *
     **/    
    generateFromStorage: function(isNormal) {        
        if (isNormal) {
            if (this.data === null) {
                return this.tpl;
            } else {
                this.form.children('input.url').val( this.data.form.url );
                
                for ( var i = 0; i < this.data.form.login.length; i++ ) {
                    var temp = $(this.tpl);
                    temp.children('input.user').val(this.data.form.login[i].user);
                    temp.children('input.pass').val(this.data.form.login[i].pass);
                    $('button.new_login').parent().before( temp );    
                }
                
            }            
        } else {
            for ( var i = 0; i < this.defaultLogins.length; i++ ) {
                var temp = $(this.tpl);
                temp.children('input.user').val(this.defaultLogins[i].user);
                temp.children('input.pass').val(this.defaultLogins[i].pass);
                $('button.new_login').parent().before( temp );    
            }            
        }
    }
}