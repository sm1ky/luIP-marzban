# luIP-marzban (EN & Fixed)

User connection limits for a proxy based on Xray. Panel [Marzban](https://github.com/Gozargah/Marzban)

Community where you can ask for help - [Telegram chat](https://t.me/gozargah_marzban) 

To use luIP-marzban on nodes, you will need this [repository](https://github.com/sm1ky/luIP-marzban-node)

## Attention
Before configuring the script, remember that you need to set up at least ssh (ufw allow ssh) access before enabling ufw (ufw enable), otherwise, you'll have to go through VNC :)

And don't forget to allow the port specified in .env (By default, 3000)

Instructions: 

Main: [UFW Main Panel](https://docs.marzban.ru/advanced/ufw_main_panel/)

Node: [UFW Node](https://docs.marzban.ru/advanced/ufw_node/)

## Instructions

- [Mechanism](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#mechanism)
- [Features](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#features)
- [Requirements](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#installation)
  - [Install Node.js](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#install-nodejs)
  - [Install ufw / dsniff / gawk / csvtool](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#installation-other-dependencies)
- [Install luIP-marzban](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#installation-luip-marzban)
- [Environment](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#luip-marzbanenv-file)
- [users.json](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#usersjson)
- [Permission](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#permission-to-use-ipbansh--ipunbansh--restore_banned_ipssh--unbanallsh)
- [Run the project](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#run-the-project)
- [Stop the project](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#stop-luip-with-kill-process)
- [Check banned IP](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#checking-blocked-ips)
- [Unblock a specific IP](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#unblock-ip)
- [Unblock all IPs](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#unblock-all-ips)
- [Uninstall project](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#uninstall)
- [API Reference](https://github.com/sm1ky/luIP-marzban/blob/main/README-EN.md#api-reference)
- [FAQ](https://github.com/sm1ky/luIP-marzban/tree/main#faq)
- [Donate](https://github.com/sm1ky/luIP-marzban/tree/main#donate)

## Mechanism

The luIP-marzban project was created and developed based on node.js and uses the marzban API.

luIP stores connected and authorized users in the sqlite database. Saving and updating users occur through a WebSocket, where traffic is intercepted by luIP-marzban, and data, including IP addresses, is obtained from there.

Users are updated via WebSocket and on a schedule based on the `FETCH_INTERVAL_LOGS_WS` variable located in `.env`.

Every x minutes, a check is performed based on the `CHECK_INACTIVE_USERS_DURATION` variable: if the last update of the connected IP was y minutes ago, based on the `CHECK_INACTIVE_USERS_DURATION` variable, the user's IP address will be removed from the connected list. And this feature is provided to leave free space and allow other clients to connect.

IPs are blocked through [ufw](https://help.ubuntu.com/community/UFW), then incoming traffic to this IP is blocked for the time specified in the `BAN_TIME` variable.

Blocked IP addresses are automatically saved in the `blocked_ips.csv` file, then every x minutes, based on the value of the `CHECK_IPS_FOR_UNBAN_USERS` variable, the `ipunban.sh` file is executed and checks: if the saved IP addresses were in jail for y minutes or more, they will be released from the ban.

<p align="center" width="100%">
    <img width="80%" src="https://github.com/mmdzov/luIP-marzban/blob/7b92fabdad4ab1e7ea818fd988b9875c866b8eaa/luIP-marzban.jpg" />
</p>

## Features

- Automatic logs
- Interaction with the Telegram bot
- API
- Identification of specific users
- Import/Export backup of users
- IP blocking
- Support for [Marzban Node](https://github.com/Gozargah/Marzban-node)

## Installation

If you do not have Node.js installed on your server, install it using nvm.

#### Install Node.js
```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
  source ~/.bashrc
  nvm install --lts
```

#### Installation other dependencies

```bash
  sudo apt-get update
  sudo apt-get install -y ufw
  sudo apt-get install -y dsniff
  sudo apt-get install -y gawk
  sudo apt-get install -y csvtool
  npm install pm2 -g
```


#### Installation luIP-marzban
```bash
  git clone https://github.com/sm1ky/luIP-marzban.git
  cd luIP-marzban
  cp .env.example .env
  npm install
```

## luIP-marzban/.env file
```bash
  # Open the project folder, then execute the following command
  nano .env
```


#### Address configuration
| Parameter | Description                |
| :-------- | :------------------------- |
| `ADDRESS` | Your domain or sub domain. e.g: example.com or sub.example.com |
| `PORT_ADDRESS` | Your domain port. e.g: 443 |
| `SSL` | Did you get domain SSL? e.g: true or false |


#### Marzban configuration

| Parameter | Description                |
| :-------- | :------------------------- |
| `P_USER` | Enter the username of Marzban panel e.g: admin |
| `P_PASS` | Enter the password of Marzban panel e.g: admin |

#### App configuration

| Parameter | Description                |
| :-------- | :------------------------- |
| `MAX_ALLOW_USERS` | The maximum number of users that can connect to a proxy. e.g: 1 |
| `BAN_TIME` | The length of time an IP is in jail based on minutes. e.g: 5 |

#### Advance configuration

| Parameter | Description                |
| :-------- | :------------------------- |
| `FETCH_INTERVAL_LOGS_WS` | Based on this, websocket logs are checked every x seconds to track traffic. e.g: 1 |
| `CHECK_INACTIVE_USERS_DURATION` | It is checked every x minutes, users whose last update was x minutes ago or more are disabled. e.g: 5 |
| `CHECK_IPS_FOR_UNBAN_USERS` | Every x minutes it checks all ips, if they are in prison for more than the time specified in `BAN_TIME`, they will be unbanned. e.g: 1 |
| `SSH_PORT` | Enter your ssh port in this section. 22 is set by default |
| `TESTSCRIPTS` | If you want to test the blocking system without actually blocking the user, set it to true. By default, it is set to false. |

#### Telegram bot configuration

| Parameter | Description                |
| :-------- | :------------------------- |
| `TG_ENABLE` | If you want to use Telegram bot for logs, set this value to `true` |
| `TG_TOKEN` | The bot token you received from @botfather |
| `TG_ADMIN` | Your user ID that you received from @userinfobot |

## users.json 
You can set specific users in the users.json file

- Priority is always with this file

In the example below, email1 is the proxy name and 2 represents the maximum number of users that can be connected.

#### luIP-marzban/users.json
```json
  [
    ["admin", 2],
    ["user", 10]
  ]
```

## Permission to use ipban.sh && ipunban.sh && restore_banned_ips.sh && unbanall.sh
In order for the file to work, permission must be obtained to use it
```bash
  # Open the project folder, then execute the follow command
  chmod +x ./ipban.sh
  chmod +x ./ipunban.sh
  chmod +x ./restore_banned_ips.sh
  chmod +x ./unbanall.sh
```


## Run the project
After configuring the project, run it
```bash
  # Open the project folder, then execute the follow command
  npm start

```

## Stop luIP with kill process
You can run the command below, but whenever you want, you can go to the project path [ `cd /luIP-marzban` ] and type `npm start`, luIP will run again.
```bash
pm2 kill
pm2 flush # Delete logs
```

## Checking blocked IPs
```bash
sudo ufw status numbered | awk '/DENY/ {gsub(/[\[\]]/, ""); for(i=1; i<=NF; i++) { if ($i == "DENY") printf "%s | %s | %s %s | %s\n", $1, $(i-1), $i, $(i+1), $(i+2) }}'
```

## Unblock IP
NUM - obtained from the command above, it is the first one.
```bash
sudo ufw delete NUM 
```

## Unblock all IPs
```bash
bash ./unbanall.sh
```

## Uninstall
```bash
pm2 kill
sudo rm -rf /luIP-marzban
```


## API Reference

We get to know the following environment variables that are located in the .env file by default.

##### When you use the api, the data will be stored in a file called `users.csv`, and this file has a higher priority in reading than `MAX_ALLOW_USERS` and `users.json`, just as `users.json` has a higher priority than `MAX_ALLOW_USERS`.


| Parameter | Description                |
| :-------- | :------------------------- |
| `API_ENABLE` | If you want to use api, set the value of this variable equal to `true` |
| `API_SECRET` | Short secret for access_token. The encryption type of access_tokens is AES, and only the expiration date of the token is included in the access_token. secret is a password to encrypt and decrypt access_token with AES encryption type. |
| `API_PATH` | Displays api path by default /api |
| `API_LOGIN` | Enter a desired username and password in the username:password format so that you can be identified to receive the token |
| `API_EXPIRE_TOKEN_AT` | Each access_token you receive has an expiration date. You can set it here |
| `API_PORT` | Choose a port for your api address. Also make sure it is not occupied. By default 4000 |

Your default api address: https://example.com:4000/api

#### Get access_token

```http
  POST /api/token
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required**. Your `API_LOGIN` username |
| `password` | `string` | **Required**. Your `API_LOGIN` password |


#### Note: In all the following apis, send the value of api_key: YOUR_ACCESS_TOKEN as header. (Fill YOUR_ACCESS_TOKEN with the value you received from /api/token)

#### Add user

```http
  POST /api/add
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Required**. The name of your target config. For example test |
| `limit`      | `number` | **Required**. What is the maximum limit? |

#### Update user

```http
  POST /api/update
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Required**. The name of your target config. For example test |
| `limit`      | `number` | **Required**. What is the maximum limit? |

#### Delete user

```http
  GET /api/delete/<email>
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Required**. The name of your target config. For example test |

#### Clear luIP database  (users.json)

```http
  GET /api/clear
```


## FAQ

#### If there are changes in marzban-node, should I restart luIP?

Yes, to apply the changes, it is necessary to restart luIP through the following command

```bash
# first Open the project dir with follow command
cd /luIP-marzban

# then run follow command
pm2 kill
npm start
```

## Donate
If you like it and it works for you, you can donate to support, develop and improve luIP-marzban. We wish the best for you

1. Tron: `TSrhAJEYqYHzuGYjsUqC46mmCx7Jp27dvX`
2. Tinkoff (RU BANK): `2200700951484392`
3. Write to me on [Telegram](https://t.me/sm1ky), and I will provide you with the necessary details.

## Author of the Original Script and Repository
Author: [mmdzdov](https://github.com/mmdzov)
Repository: [luIP-marzban](https://github.com/mmdzov/luIP-marzban)

