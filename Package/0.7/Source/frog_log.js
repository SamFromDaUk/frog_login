/**
 *  Author  : Sam Warren
 *  Name    : Frog Login
 *  Version : dev
 **/

$(function() { frog_log.init(); });

var frog_log = {
    
    defaultLogins: [
        {user: 'admin1'  , pass:'admin1pass'},
        {user: 'admin2'  , pass:'admin2pass'},
        {user: 'staff1'  , pass:'staff1pass'},
        {user: 'staff2'  , pass:'staff2pass'},
        {user: 'student1', pass:'student1pass'},
        {user: 'student2', pass:'student2pass'}
    ],
    logoutUrl : '/app/os/logout',
    mode: 'dev',
    
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
        this.tpl = $('#tpl .login_inline')[0].outerHTML;
        this.form = $('form');
        
        this.attachStoredSites();
        this.renderFromStorage();
        this.bind();
        this.updateButtons();
        
        if ( this.mode === 'dev' ) { this.dev(); }
    },

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
        var self = this;
        
        $('div.frog_log').on('click', 'button, a, span', function(ev) {
            ev.preventDefault();
            var user = $(this).siblings('input.user').val(),
                pass = $(this).siblings('input.pass').val(),
                $this = $(this),
                action = 'action.' + $(this).attr('data-action');
            
            if ( !$(this).attr('data-action') || $(this).attr('data-action') === '' ) { return; }
            
            self[ action ]( $this, ev, user, pass );
            self.save( self.form );
            self.updateButtons();
        });
        
        $('body').on('keyup', 'input', function(ev) {
            if ( $(this).hasClass('url') ) {
                self.updateActiveSiteUrl( $(this).val() );
            }
            self.save( self.form );
            self.updateButtons();
        });
        
        $('body').on('click', '.sites li', function(ev) {
            var $this = $(this),
                index = $this.attr('data-index');
                
            if ( $this.hasClass('active') ) { return; }
            
            self.data.active = parseInt(index, 10);
            self.render();
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

        if ($form.find('input.url') === '') { login_error = true; }
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

    },

    /**
     *  Message
     *
     *  Logs a message to the console
     *
     *  @param message string
     *  @return null
     *
     **/
    message: function(message) {
        if (this.mode === 'dev') { console.log(message); }
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
    clearLogins: function(showBlankLogin) {
        $('.login_inline').remove();
        
        if (showBlankLogin) {
            var $tpl = $(this.tpl),
                type = (this.data.password) ? 'password' : 'text';
            
            $tpl.children('input.pass').prop('type', type);
            
            $('button.new_login').parent().before( $tpl );
        }
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
        
        if ( $form ) {
            this.data.urls[this.data.active] = this.formElementToObject( $form );
        }
        
        window.localStorage.setItem(
            'frog_log',
            JSON.stringify(this.data)
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
        var storage = window.localStorage.getItem('frog_log');
        
        if ( typeof storage === 'string' && storage.length > 1 ) {
            return JSON.parse(storage);
        }
        else {
            return this.createDataStructure();
        }
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
    renderFromStorage: function() {
        var type = (this.data.password) ? 'password' : 'text',
            i = 0;
        
        if (!this.data.password) {
            $('.hide_passwords input').prop('checked', false);
        }
        
        if (this.data === null) {
            return this.tpl;
        } else {
                    
            this.form.children('input.url').val( this.data.urls[this.data.active].url );
            
            for ( i; i < this.data.urls[this.data.active].login.length; i++ ) {
                var temp = $(this.tpl);
                temp.children('input.user').val(this.data.urls[this.data.active].login[i].user);
                temp.children('input.pass')
                    .val(this.data.urls[this.data.active].login[i].pass)
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
            
        this.form.children('input.url').val( this.data.urls[this.data.active].url );
            
        for ( i; i < this.defaultLogins.length; i++ ) {
            var temp = $(this.tpl);
            
            temp.children('input.user')
                .val(this.defaultLogins[i].user);
            temp.children('input.pass')
                .val(this.defaultLogins[i].pass)
                .prop('type', type);
                
            $('button.new_login').parent().before( temp );
        }
    },

    /**
     *  Create Data Structure
     *
     *  Creates the blank data structure for the extension
     *
     *  @param null
     *  @return object
     *
     **/
    createDataStructure: function() {
        var structure = {
            'active': 0,
            'urls': [
                {url: '', login:[]}
            ],
            'password': true
        };
        return structure;
    },

    /**
     *  Attach Stored Sites
     *
     *  Renders the stored sites to the page
     *
     *  @param null
     *  @return null
     *
     **/
    attachStoredSites: function() {
    
        if ( this.data.urls.length < 1 ) {
            this.hideStoredSites();
            return;
        }

        var tpl = $('#tpl ul.site_tpl').html();
        
        for ( var i = 0; i < this.data.urls.length; i++ ) {
            var $tpl = $(tpl);
            $tpl.append( this.data.urls[i].url );
            $tpl.attr('data-index', i);
            
            if (i === this.data.active) {
                $tpl.addClass('active');
            }
            
            $('ul.sites').append( $tpl );
        }
    
    },

    /**
     *  Show Stored Sites
     *
     *  Shows the sites sidebar
     *
     *  @param null
     *  @return null
     *
     **/
    showStoredSites: function() {
        $('ul.sites').show();
        $('div.frog_log').css('width', '600px');
    },

    /**
     *  Hide Stored Sites
     *
     *  Hides the sites sidebar
     *
     *  @param null
     *  @return null
     *
     **/
    hideStoredSites: function() {
        $('ul.sites').hide();
        
        //HACK. For some reason chrome does not update css properly when setting to 400px
        //$('div.frog_log').css('width', '400px');
        
        $('div.frog_log').css('width', '399px');
        $('div.frog_log').animate({width: '400px'});
    },

    /**
     *  Remove Stored Sites
     *
     *  Empties sites from the dom
     *
     *  @param null
     *  @return null
     *
     **/
    removeStoredSites: function() {
        $('ul.sites').empty();
    },

    /**
     *  Render
     *
     *  Renders sites and active logins to the page
     *
     *  @param null
     *  @return null
     *
     **/
    render: function() {
        this.removeStoredSites();
        this.attachStoredSites();
        this.clearLogins();
        this.renderFromStorage();
        this.updateButtons();
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
    },
    
    /**
     *  Update Active Site Url
     *
     *  Updates the active site in the sidebar when the url is updated in the input
     *
     *  @param url string
     *  @return null
     *
     **/
    updateActiveSiteUrl: function( url ) {
        var $active = $('ul.sites li.active'),
            span = $active.children('span')[0].outerHTML;
            
        $active.empty().append(url + span);
    },
    
    'action.login': function( $this, ev, user, pass ) {
        this.login( this.form.children('input.url').val() , user, pass );
    },
    
    'action.new': function( $this, ev, user, pass ) {
        $('button.new_login').parent().before( this.tpl );
    },
    
    'action.delete': function( $this, ev, user, pass ) {
        $this.parent().remove();
    },
    
    'action.defaults': function( $this, ev, user, pass ) {
        this.clearLogins();
        this.renderDefaultLogins();
    },
    
    'action.import': function() {
        $('.import_area').toggle();
    },
    
    'action.import.delete': function() {
        $('.import_area').children('textarea').val('');
    },
    
    'action.import.logins': function($this) {
        var importStr = $this.siblings('textarea').val().replace(/ /g,'').replace(/\n/g,''),
            loginStr = importStr.split('Created'),
            finalLogins = [],
            i = 0;
            
        for ( i; i < loginStr.length; i++ ) {
            var splitString = loginStr[i].split('=')[1];
            
            if ( typeof splitString !== 'undefined' && splitString.length > 3 ) {
                loginStr[i] = splitString;

                var user = loginStr[i].split('/')[0],
                    pass = loginStr[i].split('/')[1];

                if ( user && user.length > 0 && pass && pass.length > 0 ) {
                    finalLogins.push({
                        user: user,
                        pass: pass
                    });
                }
            }
        }
        
        if ( finalLogins.length < 1 ) {
            alert('No logins detected');
            return;
        }
        
        this.data.urls[this.data.active].login = finalLogins;
        
        this.save();
        this.render();
    },
    
    'action.clear': function() {
        this.clearLogins(true);
        this.updateButtons();
    },
    
    'action.passwords': function() {
        
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
    
    'action.add.url': function() {
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
    
    'action.new.site': function() {
        
        this.data.urls.push(
            {url:'', login:[{user:'', pass:''}]}
        );
        
        this.data.active = this.data.urls.length -1;
        
        this.render();
        
    },
    
    'action.remove.site': function($this, ev) {
        var index = $this.parent().attr('data-index');
        
        if ( this.data.urls.length < 2 ) {
            return;
        }
        
        this.data.urls.splice(index, 1);
    
        if ( !this.data.urls[this.data.active] ) {
            this.data.active--;
        }
    
        this.render();
    }
};