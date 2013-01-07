/**
 *  Author  : Sam Warren
 *  Name    : Frog Login
 *  Version : 0.3
 **/

var frog_log = (typeof frog_log === 'object') ? frog_log : {};

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
        this.data = this.load();
        this.tpl = $('#tpl').html();
        this.form = $('form');
        this.url = $('input.url');

        this.data = (this.data) ? this.data : {};

        if (!this.data.password) {
            this.data.password = $('.hide_passwords input').prop('checked');
        }
        
        this.render( this.renderDefaultLogins() );
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
        $('.hide_passwords input').prop('checked', this.data.password);
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
        
        $('body').on('click', 'button, a', function(ev) {
            ev.preventDefault();
            
            var url = self.form.children('input.url').val(),
                user = $(this).siblings('input.user').val(),
                pass = $(this).siblings('input.pass').val(),
                $this = $(this),
                
                $passwords = $('.hide_passwords').children('input'),
                $import = $('.import_area'),
                $newLogin = $('button.new_login'),
                $form = $('form');
            
            switch( $(this).attr('data-action') ) {
                case 'new':
                    $newLogin.parent().before( self.tpl );
                    break;
                    
                case 'delete':
                    $this.parent().remove();
                    break;
                    
                case 'defaults':
                    self.clearLogins();
                    self.render( self.renderDefaultLogins() );
                    break;
                    
                case 'login':
                    self.login(url, user, pass);
                    break;
                    
                case 'import':
                    $import.toggle();
                    break;
                    
                case 'import.delete':
                    $import.children('textarea').val('');
                    break;
                
                case 'import.logins':
                    self.message('TODO');
                    break;
                    
                case 'clear':
                    self.clearLogins();
                    $newLogin.parent().before( self.tpl );
                    self.updateButtons();
                    break;
                    
                case 'passwords':
                    if ( $passwords.is(':checked') ) {
                        $passwords.prop('checked', false);
                        self.data.password = false;
                    } else {
                        $passwords.prop('checked', true);
                        self.data.password = true;
                    }
                    self.clearLogins();
                    self.renderDefaultLogins();
                    break;
                    
                case 'add.url':
                    chrome.tabs.getSelected(null, function(tab) {
                        self.data.form.url = tab.url;
                        self.clearLogins();
                        self.generateFromStorage();
                        self.updateButtons();
                        self.save( $form );
                    });
                    break;
            }
            $newLogin.trigger('update');
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
        var self = this,
            siteUrl = this.cleanUrl(url);
        
        $.ajax({
            url: siteUrl + self.logoutUrl,
            success: function(data) {}
        });
    
        chrome.tabs.getSelected(null, function(tab) {
            tabId = tab.id;
            chrome.tabs.update(tabId, {url: siteUrl });
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
     *  Clean Url
     *
     *  Returns a cleaned url with a protocol and site
     *
     *  @param null
     *  @return string
     *
     **/
    cleanUrl: function(url) {
        var protocol = url.split('//')[0],
            site = url.split('//')[1];
        
        if ( protocol !== 'http:' && protocol !== 'https:' ) {
            site = protocol;
            protocol = 'http:';
        }
        
        if ( site.split('/')[0] ) {
            site = site.split('/')[0];
        }
        
        return protocol + site;
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

        if (self.url.val() === '') { login_error = true; }
        if ( $('form div.login_inline').length < 2 ) { delete_error = true; }
        
        if (login_error) {
            $primary.attr('disabled', 'disabled');
            $save.attr('disabled', 'disabled');
        } else {
            $primary.removeAttr('disabled');
            $save.removeAttr('disabled');
        }
        
        if (delete_error) {
            $danger.attr('disabled', 'disabled');
        } else {
            $danger.removeAttr('disabled');
        }
                
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
            });
        });
        
        console.log(formData);
        
        return formData;
        
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
        window.localStorage.setItem(
            'frog_log',
            JSON.stringify({
                form: this.formElementToObject($form),
                password: this.data.password
            })
        );
        this.data = JSON.parse(window.localStorage.getItem('frog_log'));
    },

    /**
     *  Load
     *
     *  Returns the form object from localStorage
     *
     *  @param null
     *  @return object
     *
     **/
    load: function() {
        return JSON.parse(window.localStorage.getItem('frog_log'));
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
    generateFromStorage: function() {
        var type = (this.data.password) ? 'password' : 'text',
            i = 0;
        
        if (this.data === null) {
            return this.tpl;
        } else {
            this.form.children('input.url').val( this.data.form.url );
            
            for ( i; i < this.data.form.login.length; i++ ) {
                var temp = $(this.tpl);
                temp.children('input.user').val(this.data.form.login[i].user);
                temp.children('input.pass')
                    .val(this.data.form.login[i].pass)
                    .prop('type', type);
                $('button.new_login').parent().before( temp );
            }
            
        }
    },

    /**
     *  Render Default Logins
     *
     *  Renders the default logins to the dom
     *
     *  @param null
     *  @return null
     *
     **/
    renderDefaultLogins: function() {
        var type = (this.data.password) ? 'password' : 'text',
            i = 0;
            
        for ( i; i < this.defaultLogins.length; i++ ) {
            var temp = $(this.tpl);
            temp.children('input.user').val(this.defaultLogins[i].user);
            temp.children('input.pass')
                .val(this.defaultLogins[i].pass)
                .prop('type', type);
            $('button.new_login').parent().before( temp );
        }
    }
};