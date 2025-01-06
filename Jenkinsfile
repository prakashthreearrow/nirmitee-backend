pipeline {
    agent any
    tools {
        nodejs '20.16.0'  // Ensure this matches your configured Node.js tool in Jenkins
    }
    stages {
        stage('print versions') {
            steps {
                sh 'npm version'
            }
        }
        stage('Install') { 
            steps {
                sh 'npm install'
            }
        }
        stage('Start with PM2') {
            steps {
                sh 'pm2 start "npm run prod" --name nimitee || pm2 restart nimitee'
            }
        }
    }
}
