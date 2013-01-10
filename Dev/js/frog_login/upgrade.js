frog_login.push({
    
    upgrade_1092: function() { console.log('Upgrade to 0.9.2 successful'); },
    upgrade_1093: function() { console.log('Upgrade to 0.9.3 successful'); },
    upgrade_1094: function() { console.log('Upgrade to 0.9.4 successful'); },
    upgrade_1095: function() { console.log('Upgrade to 0.9.5 successful'); },
    upgrade_1096: function() {
        this.data.importUsers = [
            'admin1',
            'admin2',
            'staff1',
            'staff2',
            'student1',
            'student2',
            'frogsuper'
        ];
        this.save();
        console.log('Upgrade to 0.9.6 successful');
    }
    
});