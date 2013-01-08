/**
 *  Author  : Sam Warren
 *  Name    : Frog Login
 *  Version : 0.9.2
 **/

$(function() { frog_login.init(); });

var frog_login = {
    
    version: '0.9.2',
    logoutUrl : '/app/os/logout',
    defaultLogins: [
        {user: 'admin1'  , pass:'admin1pass'},
        {user: 'admin2'  , pass:'admin2pass'},
        {user: 'staff1'  , pass:'staff1pass'},
        {user: 'staff2'  , pass:'staff2pass'},
        {user: 'student1', pass:'student1pass'},
        {user: 'student2', pass:'student2pass'}
    ],
    
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
        this.loginTpl = $('#tpl .login_inline')[0].outerHTML;
        this.siteTpl = $('#tpl ul.site_tpl li')[0].outerHTML;
        this.form = $('form');
        this.url = $('.url');
        this.dev_mode = (typeof this.data.dev_mode !== 'undefined') ? this.data.dev_mode : false;
        
        if ( this.version !== this.data.version ) {
            this.upgrade();
        }
        
        this.renderFromStorage();
        this.attachStoredSites();
        this.bind();
        this.updateButtons();
        this.fixHeight();
        
        if ( this.dev_mode ) { this.dev(); }
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
                chrome.tabs.executeScript(tabId, {code: "var frog_login = {user:'"+ user +"',pass:'"+ pass +"'};"}, function(){
                    chrome.tabs.executeScript(tabId, {file: "js/login.js"});
                });
            }
        });
    },

    /**
     *  Clean Url
     *
     *  Returns a cleaned url with a protocol and site
     *
     *  @param url string
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
                $el.find('.btn-primary').attr('disabled', 'disabled');
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
        if (this.dev_mode) { console.log(message); }
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
            var $tpl = $(this.loginTpl),
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
        
        formData.url = this.url.val();
        
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
     *  Render From Storage
     *
     *  Renders the form from localStorage
     *
     *  @param null
     *  @return null
     *
     **/
    renderFromStorage: function() {
        var type = (this.data.password) ? 'password' : 'text',
            i = 0;
        
        if (!this.data.password) {
            $('.hide_passwords input').prop('checked', false);
        }
        
        if (this.data !== null) {
            
            
            if (this.data.active >= this.data.urls.length) {
                this.data.active = 0;
                this.save();
            }

            this.url.val( this.data.urls[this.data.active].url );
            
            for ( i; i < this.data.urls[this.data.active].login.length; i++ ) {
                var temp = $(this.loginTpl);
                temp.children('input.user').val(this.data.urls[this.data.active].login[i].user);
                temp.children('input.pass')
                    .val(this.data.urls[this.data.active].login[i].pass)
                    .prop('type', type);
                $('.app_options').before( temp );
            }
            
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
            'password': true,
            'dev_mode': false,
            'urls': [
                {url: '', login:[
                    {user:'', pass:''}
                ]}
            ]
        };
        return structure;
    },

    /**
     *  Attach Stored Sites
     *
     *  Renders the stored sites to the page
     *
     *  @param null
     *  @return boolean
     *
     **/
    attachStoredSites: function() {
        if ( this.data.urls.length < 1 ) {
            this.hideStoredSites();
            return false;
        }
        
        for ( var i = 0; i < this.data.urls.length; i++ ) {
            var $tpl = $(this.siteTpl);
            $tpl.append( this.data.urls[i].url );
            $tpl.attr('title', this.data.urls[i].url );
            $tpl.attr('data-index', i);
            
            if (i === this.data.active) {
                $tpl.addClass('active');
            }
            
            $('ul.sites').append( $tpl );
        }
        return true;
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
        $('div.frog_log').css('width', '650px');
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

    /**
     *  Import To Url
     *
     *  Takes a string and attempts to find a url. Pushes this url into the dom
     *
     *  @param string string
     *  @return null
     *
     **/
    importToUrl: function( string ) {
        var result = string.split(' ');
        
        for ( var i = 0; i < result.length; i++ ) {
            if ( result[i].match(/.*\.co\.uk/i) ) {
                this.data.urls[this.data.active].url = result[i];
                this.updateUrl(result[i]);
                this.save();
                this.render();
                return;
            }
        }
    },

    /**
     *  Update Url
     *
     *  Takes a string and puts this string in to the url of the active site and sites list
     *
     *  @param url string
     *  @return null
     *
     **/
    updateUrl: function( url ) {
        this.url.val( url );
        this.updateActiveSiteUrl( url );
    },

    /**
     *  Import To Logins
     *
     *  Imports a string and attempts to parse it into the active site logins
     *
     *  @param string string
     *  @return boolean
     *
     **/
    importToLogins: function( string ) {
        var loginStr = string.split('Created'),
            finalLogins = [],
            activeLogins = this.data.urls[this.data.active].login,
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
            return false;
        }
        
        if ( activeLogins.length > 0 && activeLogins.length < 2 && activeLogins[0].user === '' && activeLogins[0].pass === '' ) {
            activeLogins.splice(0,1);
        }
        
        this.data.urls[this.data.active].login.pushArray(finalLogins);
        
        this.save();
        this.render();
        return true;
    },

    /**
     *  Sort Sites
     *
     *  Rebuilds the stored urls according the the order passed in.
     *
     *  @param order array
     *  @return null
     *
     **/
    sortSites: function( order ) {
        var storage = this.data.urls.slice();
            i = 0;
        
        this.data.urls = [];
        
        for( i; i < order.length; i++ ) {
            var index = order[i];
            
            this.data.urls.push( storage[index] );
            this.save();
        }
    },

    /**
     *  Sortable
     *
     *  Initiates jquery ui sortable on the sites element
     *
     *  @param null
     *  @return null
     *
     **/
    sortable: function() {
        var self = this;
        $('.sites').sortable({
            stop: function() {
                var order = [];
                
                $(this).children().each(function(index, el) {
                    order.push( parseInt($(el).attr('data-index'), 10) );
                });
                
                self.data.active = $(this).children('.active').index();
                self.sortSites( order );
            }
        });
    },
    
    /**
     *  Fix Height
     *
     *  Used to fix a chrome extension bug where there is margin outside the html tag.
     *
     *  @param null
     *  @return null
     *
     **/
    fixHeight: function() {
        $('html')
            .css('height', 0)
            .animate({
                'height': '150'
            }, 100);
    },
    
    /**
     *  Upgrade
     *
     *  Runs upgrades between versions
     *  Converts version numbers like 0.9.1 to 1091 for use in loops
     *
     *  @param null
     *  @return null
     *
     **/
    upgrade: function() {
        
        var i = 0;
        
        if (!this.version ) {
            window.localStorage.setItem( 'frog_log', '' );
            alert('Your version of Frog Login was < 0.9.1. Please reload the extension to proceed.');
            return;
        }
        
        if ( !this.data.version ) {
            this.data.version = '0.9.1';
        }
        
        var oldVersionTemp = this.data.version.split('.'),
            newVersionTemp = this.version.split('.'),
            oldVersion = '1',
            newVersion = '1';
        
        for ( i = 0; i < oldVersionTemp.length; i++ ) { oldVersion += oldVersionTemp[i]; }
        for ( i = 0; i < newVersionTemp.length; i++ ) { newVersion += newVersionTemp[i]; }

        this.data.version = this.version;
        
        //this.save();
     
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
};

//Prototype methods
Array.prototype.pushArray = function(arr) {
    this.push.apply(this, arr);
};