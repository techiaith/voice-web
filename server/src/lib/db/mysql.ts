import { getFirstDefined } from '../utility';
import { resolve } from 'path';

const mysql = require('mysql');
const config = require('../../../../config.json');

type MysqlOptions = {
  user: string;
  database: string;
  password: string;
  host: string;
  port: number;
  max: number;
  idleTimeoutMillis: number;
};

// Default configuration values, notice we dont have password.
const DEFAULTS = {
  user: 'voiceweb',
  database: 'voiceweb-en',
  password: '',
  host: 'localhost',
  port: 3306,
  max: 10,
  idleTimeoutMillis: 30000
};

export default class Mysql {
  pool: any;

  constructor(options?: MysqlOptions) {
    options = options || Object.create(null);

    // For configuring, use the following order of priority:
    //   1. passed in options
    //   2. options in config.json
    //   3. hard coded DEFAULTS
    var myConfig = {
        user: getFirstDefined(
          options.user, config.MYSQLUSER, DEFAULTS.user),
        database: getFirstDefined(
          options.database, config.MYSQLDBNAME, DEFAULTS.database),
        password: getFirstDefined(
          options.password, config.MYSQLPASS, DEFAULTS.password),
        host: getFirstDefined(
          options.host, config.MYSQLHOST, DEFAULTS.host),
        port: getFirstDefined(
          options.port, config.MYSQLPORT, DEFAULTS.port),
        max: getFirstDefined(
          options.max, DEFAULTS.max),
        idleTimeoutMillis: getFirstDefined(
          options.idleTimeoutMillis, DEFAULTS.idleTimeoutMillis),
    };

    this.create_database_if_not_exist();

    this.pool = mysql.createPool({
        connectionLimit : 10,
        host            : myConfig.host,
        user            : myConfig.user,
        password        : myConfig.password,
        database        : myConfig.database
    });

    this.pool.on('error', this.handleIdleError.bind(this));

  }
  
  private handleIdleError(err: any) {
    console.error('idle client error', err.message);
  }

  private create_database_if_not_exist() {

    let connection = mysql.createConnection({
      host            : config.MYSQLHOST,
      user            : config.MYSQLUSER,
      password        : config.MYSQLPASS
    });

    connection.connect();
    connection.query('CREATE DATABASE IF NOT EXISTS ' + config.MYSQLDBNAME, null, (err, result) => 
      {
        if (err) {
          console.log("CREATE DATABASE EXCEPTION: " + err);
          throw err;
        }        
      });
    connection.end();
    
  }

  // query(text: string, values: any, callback: Function) {
  //   this.pool.query(text, values, function (error, results, fields) {
  //       error ? callback(error.message, null) : callback(null, results);
  //   });
  // }

  query(text: string, values: any){
   return new Promise((resolve, reject) => {
     console.log("sql: " + text + " values: " + JSON.stringify(values));
     this.pool.query(text, values, function (err, result, fields) {
       if (err){
         return reject(err);          
       }
       resolve(result);
     }
   )});
  }

  connect(callback: Function) {
    return this.pool.getConnection(callback);
  }

  end() {
    this.pool.end();
  }

}
