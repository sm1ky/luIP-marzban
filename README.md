# luIP-marzban (RU & Fixed)
Лимитные подключения пользователей для прокси на базе Xray. Панель [Marzban](https://github.com/Gozargah/Marzban)

Сообщество где можно попросить помощи - [Telegram чат](https://t.me/gozargah_marzban) 

Для использования luIP-marzban на нодах вам потребуется данный [репозиторий](https://github.com/sm1ky/luIP-marzban-node)

## Инструкции

- [Механизм](https://github.com/sm1ky/luIP-marzban/tree/main#mechanism)
- [Функции](https://github.com/sm1ky/luIP-marzban/tree/main#features)
- [Требования](https://github.com/sm1ky/luIP-marzban/tree/main#installation)
  - [Установка node.js](https://github.com/sm1ky/luIP-marzban/tree/main#install-nodejs)
  - [Установка ufw / dsniff / gawk / csvtool](https://github.com/sm1ky/luIP-marzban/tree/main#install-other-requirements)
- [Установка luIP-marzban](https://github.com/sm1ky/luIP-marzban/tree/main#install-luip-marzban)
- [Окружение](https://github.com/sm1ky/luIP-marzban/tree/main#luip-marzbanenv-file)
- [users.json](https://github.com/sm1ky/luIP-marzban/tree/main#usersjson)
- [Разрешение](https://github.com/sm1ky/luIP-marzban/tree/main#permission-to-use-ipbansh--ipunbansh)
- [Запуск проекта](https://github.com/sm1ky/luIP-marzban/tree/main#run-the-project)
- [API Reference](https://github.com/sm1ky/luIP-marzban/tree/main#run-the-project)
- [FAQ](https://github.com/sm1ky/luIP-marzban/tree/main#faq)
- [Пожертвовать](https://github.com/sm1ky/luIP-marzban/tree/main#donate)


## Механизм

Проект luIP-marzban был создан и разработан на основе node.js и использует API marzban.

luIP хранит подключенных и авторизованных пользователей в базе данных sqlite. Сохранение и обновление пользователей происходит через веб-сокет, где трафик перехватывается luIP-marzban, и данные, включая IP-адреса, получаются оттуда.

Пользователи обновляются через веб-сокет и по расписанию на основе переменной `FETCH_INTERVAL_LOGS_WS`, расположенной в `.env`.

Каждые x минут выполняется проверка на основе переменной `CHECK_INACTIVE_USERS_DURATION`: если последнее обновление подключенного IP было y минут назад, основываясь на переменной `CHECK_INACTIVE_USERS_DURATION`, IP-адрес пользователя будет удален из списка подключенных. И эта возможность предоставляется для того, чтобы оставалось свободное место, и другим клиентам разрешено подключаться.

IP блокируются через [ufw](https://help.ubuntu.ru/wiki/руководство_по_ubuntu_server/безопасность/firewall#ufw_-_простой_firewall), затем входящий трафик на этот IP блокируется на время, указанное в переменной `BAN_TIME`.

Заблокированные IP-адреса автоматически сохраняются в файле `blocked_ips.csv`, затем каждые x минут, основываясь на значении переменной `CHECK_IPS_FOR_UNBAN_USERS`, выполняется файл `ipunban.sh` и проверяет: если сохраненные IP-адреса были в тюрьме y минут или более, они будут выпущены из бана

<p align="center" width="100%">
    <img width="80%" src="https://github.com/mmdzov/luIP-marzban/blob/7b92fabdad4ab1e7ea818fd988b9875c866b8eaa/luIP-marzban.jpg" />
</p>

## Функции

- Автоматические журналы (логи)
- Работа с Telegram ботом 
- API
- Определение конкретных пользователей
- Импорт/Экспорт резевной копии пользователей
- Блокировка по IP 
- Поддержка [Marzban Node](https://github.com/Gozargah/Marzban-node)

## Внимание
Прежде чем настраивать скрипт, помните что нужно настроить хотя-бы ssh (ufw allow ssh)

доступ перед включением ufw (ufw enable) иначе придется лезть через VNC :)

И не забудье разрешить порт указанный в .env (По стандарту 3000)

Инсирукции по настройке UFW:

Main: https://docs.marzban.ru/advanced/ufw_main_panel/

Node: https://docs.marzban.ru/advanced/ufw_node/

## Установка

Если у вас нет установленного node.js на вашем сервере, установите его с помощью nvm

#### Установка Node.js
```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
  source ~/.bashrc
  nvm install --lts
```


#### Установка других зависимостей

```bash
  sudo apt-get update
  sudo apt-get install -y ufw
  sudo apt-get install -y dsniff
  sudo apt-get install -y gawk
  sudo apt-get install -y csvtool
  npm install pm2 -g
```


#### Установка luIP-marzban
```bash
  git clone https://github.com/sm1ky/luIP-marzban.git
  cd luIP-marzban
  cp .env.example .env
  npm install
```

## Файл .env для luIP-marzban
```bash
  # Откройте папку проекта, затем выполните следующую команду
  nano .env или vim .nano
```


#### Конфигурация адреса Marzban
| Parameter | Description                |
| :-------- | :------------------------- |
| `ADDRESS` | Ваш домен или поддомен. Например: example.com или sub.example.com (Поддерживает IP) |
| `PORT_ADDRESS` | Порт вашего домена. Например: 443 |
| `SSL` | Есть ли SSL на домене? Например: true или false |


#### Конфигурация Marzban 

| Parameter | Description                |
| :-------- | :------------------------- |
| `P_USER` | Введите имя пользователя панели Marzban, например: admin |
| `P_PASS` | Введите пароль панели Marzban, например: admin |

#### Конфигурация luIP-marzban

| Parameter | Description                |
| :-------- | :------------------------- |
| `MAX_ALLOW_USERS` | Максимальное количество пользователей, которые могут подключиться к прокси, например: 1 |
| `BAN_TIME` | Продолжительность времени, в течение которой IP находится в бане в минутах, например: 5 |

#### Расширенная конфигурация

| Parameter | Description                |
| :-------- | :------------------------- |
| `FETCH_INTERVAL_LOGS_WS` | На его основе каждые x секунд проверяются журналы веб-сокета для отслеживания трафика, например: 1 |
| `CHECK_INACTIVE_USERS_DURATION` | Каждые x минут проверяются пользователи, последнее обновление которых было x минут назад или ранее, например: 5 |
| `CHECK_IPS_FOR_UNBAN_USERS` | Каждые x минут проверяются все IP-адреса, если они находятся в бане больше времени, указанного в BAN_TIME, они будут разблокированы, например: 1 |
| `SSH_PORT` | Введите свой порт ssh в этом разделе. 22 установлен по умолчанию |

#### Конфигурация Telegram бота

| Parameter | Description                |
| :-------- | :------------------------- |
| `TG_ENABLE` | Если вы хотите использовать бота Telegram для логов, установите этому значению `true` |
| `TG_TOKEN` | Токен бота, который вы получили от @botfather |
| `TG_ADMIN` | Ваш идентификатор пользователя, который вы получили от @userinfobot |

## users.json 
Вы можете установить конкретных пользователей в файле users.json

- Приоритет всегда у этого файла

В приведенном ниже примере admin - это имя прокси, и 2 представляет максимальное количество пользователей, которые могут быть подключены.

#### luIP-marzban/users.json
```json
  [
    ["admin", 2],
    ["user", 10]
  ]
```

## Разрешение на использование ipban.sh && ipunban.sh && restore_banned_ips.sh && unbanall.sh
Для того чтобы файлы работали, необходимо дать разрешение на их использование.
```bash
  # Откройте папку проекта, затем выполните следующую команду
  chmod +x ./ipban.sh
  chmod +x ./ipunban.sh
  chmod +x ./restore_banned_ips.sh
  chmod +x ./unbanall.sh
```


## Запуск проекта
После настройки проекта запустите его
```bash
  # Откройте папку проекта, затем выполните следующую команду
  npm start

```

## Остановка luIP

Вы можете выполнить команду ниже, но когда угодно вы можете перейти в путь проекта [ `cd /luIP-marzban` ] и ввести `npm start`, luIP снова запустится.

```bash
pm2 kill
pm2 flush # Удаляет логи
```

## Проверка заблокированных IP-адресов

```bash
sudo ufw status numbered | awk '/DENY/ {print $4}'
```

## Разблокировать все IP-адреса
```bash
bash ./unbanall.sh
```

## Удаление
```bash
pm2 kill
sudo rm -rf /luIP-marzban
```


## API Reference

Мы узнаем следующие переменные среды, которые расположены в файле .env по умолчанию.

##### При использовании api данные будут сохранены в файле с именем users.csv, и этот файл имеет более высокий приоритет при чтении, чем MAX_ALLOW_USERS и users.json, так же как users.json имеет более высокий приоритет, чем MAX_ALLOW_USERS.


| Параметр | Описание                |
| :-------- | :------------------------- |
| `API_ENABLE` | Если вы хотите использовать API, установите значение этой переменной равным `true` |
| `API_SECRET` | Краткий секрет для access_token. Тип шифрования access_token - AES, и в access_token включается только срок действия токена. secret - это пароль для шифрования и дешифрования access_token с использованием AES. |
| `API_PATH` | Отображает путь api по умолчанию /api |
| `API_LOGIN` | Введите желаемое имя пользователя и пароль в формате username:password, чтобы вы могли авторизоваться для получения токена |
| `API_EXPIRE_TOKEN_AT` | У каждого полученного access_token есть срок действия. Вы можете установить его здесь |
| `API_PORT` | Выберите порт для вашего api-адреса. Также убедитесь, что он не занят. По умолчанию 3000 |

Your default api address: https://example.com:4000/api

#### Получение access_token

```http
  POST /api/token
```

| Параметр | Тип     | Описание                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Обязательно**. Ваше имя пользователя `API_LOGIN` |
| `password` | `string` | **Обязательно**. Ваш пароль `API_LOGIN` |


#### Примечание: Во всех следующих API отправляйте значение api_key: YOUR_ACCESS_TOKEN в заголовке. (Замените YOUR_ACCESS_TOKEN на значение, которое вы получили из /api/token)

#### Добавить пользователя

```http
  POST /api/add
```

| Параметр | Тип     | Описание                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Обязательно**. Имя пользователя. Например: admin |
| `limit`      | `number` | **Обязательно**. Сколько одновременно подключений может быть? |

#### Обновить пользователя

```http
  POST /api/update
```

| Параметр | Тип     | Описание                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Обязательно**. Имя пользователя. Например: admin |
| `limit`      | `number` | **Обязательно**. Сколько одновременно подключений может быть? |

#### Удалить пользователя

```http
  GET /api/delete/<email>
```

| Параметр | Тип     | Описание                       |
| :-------- | :------- | :-------------------------------- |
| `email`      | `string` | **Обязательно**. Имя пользователя. Например: admin |

#### Clear luIP database

```http
  GET /api/clear
```



## Часто задаваемые вопросы

#### Если есть изменения в marzban-node, нужно ли перезапускать luIP?

Да, чтобы применить изменения, необходимо перезапустить luIP с помощью следующей команды

```bash
# Сначала откройте папку проекта с помощью следующей команды
cd /luIP-marzban

# Затем выполните следующуюкоманду
pm2 kill
npm start
```

## Пожертвовать
Если вам нравится и это работает для вас, вы можете сделать пожертвование на поддержку, разработку и улучшение luIP-marzban для русскоговорящих людей. Желаем вам всего наилучшего

1. Tron: `TSrhAJEYqYHzuGYjsUqC46mmCx7Jp27dvX`
2. Тинькофф: `2200700951484392`

## Автор оригинального скрипта и его репозиторий
Автор: [mmdzdov](https://github.com/mmdzov)
Репозиторий: [luIP-marzban](https://github.com/mmdzov/luIP-marzban)
