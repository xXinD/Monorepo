module.exports = {
    apps: [
        {
            name: 'myapp',
            script: 'dist/app.js',
            instances: '4',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            log_type: 'json',
            log_file: './logs/app.log',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            },
            "max_memory_restart": "700M",
            "ignore_watch": [
                "node_modules",
                "logs",
                "static",
                "core.*",
                "../database.sqlite",
                "database.sqlite-journal",
                "../database.sqlite-journal"
            ],
        }
    ]
};

