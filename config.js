const WebSocket = require("ws");
const { User, Server, File, banIP } = require("./utils");
const { default: axios } = require("axios");
const { DBAdapter } = require("./db/Adapter");
const { join } = require("path");
const sqlite3 = require("sqlite3").verbose();
const DBSqlite3 = require("./db/DBSqlite3");
const crypto = require("crypto-js");
const socket = require("socket.io");
const nodeCron = require("node-cron");
const fs = require("fs");

class Ws {
  /**
   * @param {WebSocketConfigType} params
   */
  constructor(params) {
    let patch = params?.node ? `node/${params.node}` : "core";
    this.access_token = params.accessToken;
    this.params = params;

    const url = `${process.env.SSL === "true" ? "wss" : "ws"}://${
      params.url
    }/api/${patch}/logs?interval=${process.env.FETCH_INTERVAL_LOGS_WS}&token=${
      this.access_token
    }`;

    const db = new DBAdapter(params.DB);
    const ws = new WebSocket(url);

    nodeCron.schedule(`*/1 * * * *`, async () => {
      console.log("Schedule", ws.url, ws.isPaused);
    });

    const user = new User();
    const ipGuard = new IPGuard({
      banDB: new DBSqlite3(),
      socket: params.socket,
      api: params.api,
      db: db,
    });

    this.db = db;
    this.user = user;
    this.ws = ws;
    this.ipGuard = ipGuard;

    // retry to get token
    const retryGetToken = async (error, response) => {
      const token = await params.api.token();

      const _ws = new Ws({ ...params, accessToken: token });
      _ws.logs();

      console.log("Websocket response", ws.url);
    };

    ws.on("error", retryGetToken);
    ws.on("close", retryGetToken);
  }

  logs() {
    // Opened connections

    if (process.env?.NODE_ENV?.includes("development")) {
      this.ws.on("message", async (msg) => {
        const bufferToString = msg.toString();

        const data = await this.user.GetNewUserIP(bufferToString);

        //console.log("Data: ", data);
        //console.log(this.access_token);
      });

      return this;
    }

    this.ws.on("message", async (msg) => {
      const bufferToString = msg.toString();

      const data = await this.user.GetNewUserIP(bufferToString);

      if (data.length === 0) return;

      console.log(`Обновление ${new Date().toLocaleString('ru-RU')}: `, data);

      let num = data.length;
      while (num--) {
        const item = data[num];

        if (item.email.toLowerCase() === "api]") {
          console.log(`Notification: Received data for "api]" email. SKIP`);
        } else {
          //console.log(`Пользователь: ${item.email} | IP: ${item.ip} | Порт: ${item.port}`)
          await this.ipGuard.use(
            item.ip,
            () => this.db.read(item.email),
            () =>
              this.db.addIp(item.email, {
                ip: item.ip,
                port: item.port,
                date: new Date().toISOString().toString(),
              }),
            () => this.db.deleteLastIp(item.email),
          );
        }
      }
    });
    return this;
  }
}

class Api {
  /**
   * @description Marzban access_token
   */
  accessToken = "";

  /**
   * @description Default: Bearer
   */
  accessTokenType = "Bearer";

  accessTokenExpireAt = null;

  /**
   * @description Creates an instance to communicate with the marzban api
   * @returns {void}
   */
  create() {
    const url = new Server().CleanAddress(
      `${process.env.ADDRESS}:${process.env.PORT_ADDRESS}`,
    );

    this.axios = axios.create({
      baseURL: url,
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    this.axios.interceptors.response.use(
      (value) => value,
      async (error) => {
        if (
          error?.response?.data?.detail === "Could not validate credentials"
        ) {
          await this.token();
          console.log("New Token:", this.accessToken);
        }

        return error;
      },
    );
  }

  /**
   * @description It receives access_token from Marzban api
   * @returns {Promise}
   */
  async token() {
    // if (this.accessTokenExpireAt && Date.now() < +this.accessTokenExpireAt)
    //   return;

    try {
      const { data } = await this.axios.post("/admin/token", {
        username: process.env.P_USER,
        password: process.env.P_PASS,
      });

      this.accessToken = data.access_token;
      this.axios.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
      this.accessTokenType = data.token_type;
      this.accessTokenExpireAt = new Date() + 1000 * 60 * 60;

      return data.access_token;
    } catch (e) {
      console.error(e);
    }
  }

  async getNodes() {
    let nodes = [];

    try {
      const { data } = await this.axios.get("/nodes");

      if (!data) return nodes;

      nodes = data
        .filter((item) => item.status === "connected")
        .map((item) => item.id);
    } catch (e) {
      console.error(e);
    }

    return nodes;
  }

  /**
   * @param {string} email
   * @param {"disabled" | "active"} status
   */
  async changeUserProxyStatus(email, status) {
    try {
      const { data } = await this.axios.get(`/user/${email}`);

      const res = await this.axios.put(
        `/user/${email}`,
        {
          ...data,
          status,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (e) {
      console.error(e);
    }
  }
}

class Socket {
  connected = false;

  /**
   * @typedef {Object} SocketArgsType
   * @property {string} server
   * @property {string[]} corsOrigin
   * @property {import("socket.io").ServerOptions} options
   * @property {(socket: import("socket.io").Socket) => void} callback
   *
   * @param {SocketArgsType} args
   */
  constructor(args) {
    /**
     * @typedef {import("socket.io").Server} SocketServer
     *
     * @type {SocketServer}
     */
    // console.log("this.socket:", this.socket);
    // if (!(this.socket instanceof socket.Server)) {
    //     console.error("this.socket is not an instance of socket.Server");
    //     return;
    // }
    // const nsp = this.socket.of(process.env?.LISTEN_PATH);

    // nsp.use(this.Auth)
    //   .on("connection", (socket) => {
    //       this.connected = socket.connected;
    //       args.callback(socket);
    //   });
    this.socket = new socket.Server(args.server, {
      ...args.options,
    });
    // this.socket = new Socket(args.server, {
    //   query: {
    //     api_key: this.api_key,
    //   },
    //   retries: 60,
    // });
  
    // console.log("this.socket:", this.socket);
  
    // if (!(this.socket instanceof socket.Server)) {
    //   console.error("this.socket is not an instance of socket.Server");
    //   return;
    // }
  
    // const nsp = this.socket.of(process.env?.LISTEN_PATH);
  
    // nsp.use(this.Auth).on("connection", (socket) => {
    //   this.connected = socket.connected;
    //   args.callback(socket);
    // });

    this.socket
      .of(process.env?.LISTEN_PATH)
      .use(this.Auth)
      .on("connection", (socket) => {
        this.connected = socket.connected;

        args.callback(socket);
      });
  }

  Auth(socket, next) {
    // console.log(`REQUESTS`);
    // console.log('Received headers:', socket.handshake.headers);
    // console.log('Received handshake:', socket.handshake);
    const apiKey = socket.handshake.headers.api_key;

    if (!apiKey) {
        console.error('API Key is empty or undefined');
        return next(new Error('Authentication error'));
    }

    let decryptedKey;
    try {
        decryptedKey = crypto.AES.decrypt(
            apiKey,
            process.env.API_SECRET,
        ).toString(crypto.enc.Utf8);
    } catch (error) {
        console.error('Error during decryption:', error);
        return next(new Error('Authentication error'));
    }

    console.log('Decrypted Key:', decryptedKey);

    if (!decryptedKey) {
        console.error('Decrypted Key is empty or undefined');
        return next(new Error('Authentication error'));
    }

    try {
        const parseKey = JSON.parse(decryptedKey);

        if (Date.now() > +parseKey.expireAt)
            return next(new Error('Authentication error'));

        next();
    } catch (error) {
        console.error('Error parsing JSON:', error);
        return next(new Error('Authentication error'));
    }
  }

  /**
   * @typedef {Object} BanIPArgsType
   * @property {string} ip
   * @property {string} expireAt
   *
   * @param {BanIPArgsType} args
   *
   * @returns {void}
   */
  BanIP(args) {
    if (!this.connected) {
      console.log(`Failed send ban ip to node, socket not connected`)
      return;
    }

    this.socket.emit("user:ip:ban", JSON.stringify(args));
    console.log(`Sent ban IP to node`);
  }

  /**
   * @returns {void}
   */
  UnbanIP() {
    if (!this.connected) {
      console.log(`Failed send unban ip to node, socket not connected`)
      return;
    }

    this.socket.emit("user:ip:unban", JSON.stringify({}));
    console.log(`Sent unban IP to node`);
  }
}

class Connection {
  /**
   *
   * @deprecated
   */
  BanDB() {
    const dbPath = join(__dirname, "ban.sqlite");

    new File().ForceExistsFile(dbPath);

    return new sqlite3.Database(dbPath);
  }
}

/**
 * @description IP Guard
 */
class IPGuard {
  /**
   * @param {IpGuardType} params
   */
  constructor(params) {
    this.banDB = params.banDB;
    this.socket = params.socket;
    this.api = params.api;
    this.db = params.db;
  }

  /**
   *
   * @param {IPSDataType} record A user's record includes email, ips array
   * @param {function[]} callback Return function to allow ip usage
   *
   * @returns {void | Promise<Function>}
   */
  async use(ip, ...callback) {
    let data = null;

    try {
      data = await callback[0]();
    } catch (e) {}

    if (!data) return await callback[1]();

    const indexOfIp = data.ips.findIndex((item) => item.ip === `${ip}`);

    const users = new File().GetJsonFile(
      join(__dirname, "users.json"),
      JSON.stringify([])
    );
    
    let user = null;
    
    const userIndex = users.findIndex((item) => item[0] === data.email);
    
    if (userIndex !== -1) {
      user = users[userIndex];
    }
    
    const maxAllowConnection = user ? +user[1] : +process.env.MAX_ALLOW_USERS;

    const limited = data.ips.length > maxAllowConnection;
    
    if (indexOfIp !== -1 && limited) {
      return callback[2]();
    }

    console.log(`Пользователь: ${data.email} | IP: ${ip} | Подключено IP: ${(data.ips.length)} | Максимум IP: ${maxAllowConnection} `);

    if (data.ips.length >= maxAllowConnection && indexOfIp === -1) {
      if (process.env?.TARGET === "PROXY") {
        await this.deactiveUserProxy(data.email);

        return;
      }

      let file = new File()
        .GetCsvFile(join(__dirname, "blocked_ips.csv"))
        .toString();

      file = file.split("\r\n").map((item) => item.split(","));

      if (file.some((item) => item[0] === ip) === true) return;

      const blockedIpMessage = `<code>${ip}</code>`;

      data.ips.push({ ip: ip, date: new Date().toISOString() });


      const connectedIpsMessage = data.ips.map((item) => `<code>${item.ip}</code>`).join('\n');
      const connectedIpsMessagelog = data.ips.map((item) => `${item.ip}`).join('\n');
      const databaseInstance = new DBSqlite3();
      const ips = await databaseInstance.getUserIps(data.email);
      const connectedIpsMessageBase = ips.map((item) => `<code>${item.ip || item}</code>`).join('\n');
      //const connectedIpsMessageBase = ips.map((ip) => `<code>${ip}</code>`).join('\n');

      if (process.env?.TESTSCRIPT === "false") {
        this.socket.BanIP({
          ip,
          expireAt: process.env.BAN_TIME,
        });

        this.ban({ ip, email: data.email });

        console.log(`[NOT TEST] ${new Date().toLocaleString('ru-RU')}: Заблокирован IP: ${ip} у пользователя ${data.email}\n\nПодключенные IP:\n${connectedIpsMessagelog}`);

        if (process.env.TG_ENABLE === "true")
          globalThis.bot.api.sendMessage(
            process.env.TG_ADMIN,
            "[NOT TEST] Пользователь <code>" + data.email + "</code>: IP <code>" + ip + "</code> заблокирован.\nВремя: " + process.env.BAN_TIME + " минут(ы)\n\nПодключено: "+ (data.ips.length) +"\nМаксимум устройств: " + maxAllowConnection +"\n\nПодключенные IP [Logical]:\n"+ connectedIpsMessage +"\n\nПодключенные IP [DataBase]:\n"+ connectedIpsMessageBase +"",
            { parse_mode: "HTML" }
          );
      } else {
        console.log(`[TEST] ${new Date().toLocaleString('ru-RU')}: Заблокирован IP: ${ip} у пользователя ${data.email}`);

        if (process.env.TG_ENABLE === "true")
          globalThis.bot.api.sendMessage(
            process.env.TG_ADMIN,
            "[TEST] Пользователь <code>" + data.email + "</code>: IP <code>" + ip + "</code> заблокирован.\nВремя: " + process.env.BAN_TIME + " минут(ы)\n\nПодключено: "+ (data.ips.length) +"\nМаксимум устройств: " + maxAllowConnection +"\n\nПодключенные IP:\n"+ connectedIpsMessage +"\n\nПодключенные IP [DataBase]:\n"+ connectedIpsMessageBase +"",
            { parse_mode: "HTML" }
          );
      }
    

      return;
    }

    return await callback[1]();
  }

  /**
   * @param {BanIpConfigAddType} params
   */
  ban(params) {
    banIP(`${params.ip}`, params.email);
    // console.log("ban", params);
  }

  /**
   * @param {string} email
   */
  async deactiveUserProxy(email) {
    const path = join(__dirname, "deactives.json");

    const deactives = new File().GetJsonFile(path);

    console.log("Deactives:", deactives);
    if (deactives.some((item) => item.email === email) === true) return;

    console.log("should to disable");
    await this.api.changeUserProxyStatus(email, "disabled");
    console.log("successfully disabled");

    const fewMinutesLater = new Date(
      Date.now() + 1000 * 60 * process.env?.BAN_TIME,
    ).toISOString();

    deactives.push({
      email,
      activationAt: fewMinutesLater,
    });

    console.log(email, fewMinutesLater, deactives, path);

    fs.writeFileSync(path, JSON.stringify(deactives));

    this.db.deleteUser(email);

    if (process.env.TG_ENABLE === "true")
      globalThis.bot.api.sendMessage(
        process.env.TG_ADMIN,
        `${email} disabled successfully.
Duration: ${process.env.BAN_TIME} minutes
      `,
      );
  }

  /**
   * @param {string} email
   */
  async activeUsersProxy() {
    const path = join(__dirname, "deactives.json");

    const deactives = new File().GetJsonFile(path);

    const currentTime = new Date().getTime();

    let shouldActive = deactives.filter((item) => {
      const activeAt = new Date(item.activationAt);
      return currentTime > activeAt;
    });

    if (shouldActive.length === 0) return;

    for (let i in shouldActive) {
      const data = shouldActive[i];

      await this.api.changeUserProxyStatus(data.email, "active");
    }

    const _shouldActive = shouldActive.map((item) => item.email);

    const replaceData = deactives.filter(
      (item) => !_shouldActive.includes(item.email),
    );

    fs.writeFileSync(path, JSON.stringify(replaceData));

    if (process.env.TG_ENABLE === "true")
      globalThis.bot.api.sendMessage(
        process.env.TG_ADMIN,
        `${shouldActive
          .map((item) => item.email)
          .join(", ")} actived successfully.
      `,
      );
  }
}

/**
 * @deprecated
 */
class BanDBConfig {
  constructor() {
    this.db = new Connection().BanDB();

    this.db.serialize(() => {
      const sql =
        "CREATE TABLE IF NOT EXISTS banned (ip TEXT, cid TEXT, date TEXT)";

      this.db.run(sql);
    });
  }

  /**
   * @param {BanIpConfigAddType} params
   */
  add(params) {
    this.db.serialize(() => {
      const sql = "SELECT * FROM banned WHERE cid = ?";
      this.db.get(sql, [params.cid], (err, row) => {
        if (err) throw new Error(err);

        if (!row) {
          const sql = "INSERT INTO banned (ip, cid, date) VALUES (?, ?, ?) ";
          this.db.run(
            sql,
            [{ ...params, date: new Date().toLocaleString("en-US") }],
            (err) => {
              if (err) throw new Error(err);
              console.log("Ip banned:", cid);
            },
          );
        }

        console.log("Ip already banned:", params.cid);
      });
    });
  }

  remove(cid) {
    this.db.serialize(() => {
      const sql = "DELETE FROM banned WHERE cid = ?";
      this.db.run(sql, [cid], (err) => {
        if (err) throw new Error(err);

        console.log("Ip unbanned:", cid);
      });
    });
  }
}

module.exports = { Ws, Api, Connection, Socket, IPGuard, BanDBConfig };
