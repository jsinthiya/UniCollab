const fs = require('fs');

async function generateDockerComposeFile(config) {
  const dockerComposeContent = `
version: '3'

services:
  code-server:
    image: lscr.io/linuxserver/code-server:latest
    container_name: ${config.CONTAINER_NAME || 'code-server'}
    environment:
      - PUID=${config.PUID || 1000}
      - PGID=${config.PGID || 1000}
      - TZ=${config.TZ || 'Etc/UTC'}
      - HASHED_PASSWORD=${config.HASHED_PASSWORD || ''} #optional
      - SUDO_PASSWORD=${config.SUDO_PASSWORD || 'password'} #optional
      - SUDO_PASSWORD_HASH=${config.SUDO_PASSWORD_HASH || ''} #optional
      - PROXY_DOMAIN=${config.PROXY_DOMAIN || 'localhost'} #optional
      - DEFAULT_WORKSPACE=${config.DEFAULT_WORKSPACE || '/home/project'} #optional
    volumes:
      - ${config.CONFIG_PATH || '/path/to/appdata/config'}:/config
      - D:/project/${config.PROJECTS_PATH || 'D:\\Projects'}:/home/project  # Use double backslashes for Windows paths
    ports:
      - ${config.PORT || '8443'}:8443
    restart: unless-stopped
`;

  const filePath = config.FILE_PATH || 'docker-compose.yml';

  fs.writeFile(filePath, dockerComposeContent, (err) => {
    if (err) {
      console.error('Error writing Docker Compose file:', err);
    } else {
      console.log('Docker Compose file created successfully!');
    }
  });
}

// Example usage:
// const config = {
//   PUID: 1001,
//   PGID: 1001,
//   TZ: 'America/New_York',
//   PASSWORD: 'mysecretpassword',
//   CONFIG_PATH: '/path/to/appdata/custom-config',
//   PROJECTS_PATH: 'D:\\CustomProjects',
//   PORT: '8080',
//   FILE_PATH: 'custom-docker-compose.yml',
// };

module.exports = {generateDockerComposeFile};