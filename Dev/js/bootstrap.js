steal( 
    '../../css/bootstrap.css',
    '../../css/jquery-ui-1.9.2.custom.min.css',
    '../../css/frog_login.css',
    'lib/jQuery.js'
).then(
    'lib/jquery-ui-1.9.2.custom.min.js',
    'frog_login/core.js'
).then(
    'frog_login/bind.js',
    'frog_login/dev.js',
    'frog_login/upgrade.js'
).then(function() {
    frog_login.init();
})