import * as http from 'http';
import WebHook from './webhook';
import Mysql from './db/mysql';

const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');
const Random = require('random-js');
const _ulib = require('underscore');

const crypto = require('crypto');
const httprequest = require('request');

const CONFIG_PATH = path.resolve(__dirname, '../../..', 'config.json');
const DEFAULT_SALT = '8hd3e8sddFSdfj';
const config = require(CONFIG_PATH);
const salt = config.salt || DEFAULT_SALT;

const SENTENCE_FOLDER = '../../data/cy/';
const RECORDINGS_ROOT_DIR = '/recordings/';

export interface IHash {
	[details: string] : String;
}


export default class API {

  webhook: WebHook;
  randomEngine: any
  mysql: any;

  constructor() {

    this.webhook = new WebHook();
    //this.randomEngine = Random.engines.mt19937();
    //this.randomEngine.autoSeed();  
    this.mysql = new Mysql();
    this.upsertSentencesIntoDb();

  }

  private getSentenceFolder() {
    return path.join(__dirname, SENTENCE_FOLDER);
  }
  
  private getUserRecordingsFolder(uid: string) {
    return path.join(RECORDINGS_ROOT_DIR, uid);
  }

  private getRandomUnreadSentences(uid: string, count: number): Promise<string[]> {

    return new Promise((res, rej) => {

      this.mysql.query("SELECT s.sentence FROM Sentences s "
        + " WHERE s.guid NOT IN "
        + " ( "
        + "   SELECT rs.guid FROM RecordedSentences rs "
        + "   WHERE rs.uid='" + uid + "'"
        + " ) ORDER BY RAND() LIMIT " + count, null)
      .then(result => {      
         let resultArray = result as Array<string>;
         let randoms = [];
         for (var i=0; i < resultArray.length;i++){
           randoms.push(resultArray[i]["sentence"]);
         }
         res(randoms);
       }, err => {
	console.log(err); 
       });
      
    });
      
  }  

  private getFilesInFolder(folderpath) {
    return new Promise((res, rej) => {
      fs.readdir(folderpath, (err, files) => {
        if (err) {
          rej(err);
          return;
        }
        res(files);
      });
    });
  }

  private getFileContents(filepath) {
    return new Promise((res, rej) => {
      fs.readFile(filepath, {
        contents: 'utf8'
      }, (err, data) => {
        if (err) {
          rej(err);
          return;
        }
        res(data.toString());
      });
    });
  }

  /**
   * Is this request directed at the api?
   */
  isApiRequest(request: http.IncomingMessage) {
    return request.url.includes('/api/');
  }

  /**
   * Give api response.
   */
  handleRequest(request: http.IncomingMessage,
                response: http.ServerResponse) {

    // Most often this will be a sentence request.
    if (request.url.includes('/sentence')) {
      let uid = request.headers.uid;
      let parts = request.url.split('/');
      let index = parts.indexOf('sentence');
      let count = parts[index + 1] && parseInt(parts[index + 1], 10);
      this.returnRandomSentence(response, count, uid);
    } else if (request.url.includes('/recordingprogress.json')){
      let uid = request.headers.uid;      
      if (uid.indexOf(',') > 1)
      {
        uid = uid.substring(0, uid.indexOf(','));
      }
      this.serveRecordingProgressJson(response, uid);
    } else if (request.url.includes('/generatevoice')){
      let uid = request.headers.uid;
      if (uid.indexOf(',') > 1)
      {
        uid = uid.substring(0, uid.indexOf(','));
      }
      this.serveGenerateVoice(response, uid);    
    // Webhooks from github.
    } else if (this.webhook.isHookRequest(request)) {
      this.webhook.handleWebhookRequest(request, response);
    // Unrecognized requests get here.
    } else {
      console.error('unrecongized api url', request.url);
      response.writeHead(404);
      response.end('I\'m not sure what you want.');
    }
  }

  serveRecordingProgressJson(response: http.ServerResponse, uid: string) {

    if (!uid) 
      return Promise.reject('Invalid headers');

    let recordingProgress =  {
      recorded: '0',
      notrecorded: '0'
    }

    this.getNotRecordedCount(uid)
    .then( result => {
	recordingProgress.notrecorded=result;
    })
    .then( () => {
    	this.getRecordedCount(uid)
	.then ( result => {
		recordingProgress.recorded=result;	
	})
	.then ( () => {
		response.writeHead(200);
		response.end(JSON.stringify(recordingProgress));
	}); 
    })
    .catch( err => {
      console.error('could not get recording progress..', err);
      response.writeHead(500);
      response.end('could not get recording progress...');
    });

  }

  serveGenerateVoice(response: http.ServerResponse, uid: string) {
    response.writeHead(200);
    console.log("serveGenerate voice:" + uid);
    let marytts_voicebuild_request_url = "http://marytts-voicebuild-api:8008/generate_voice?uid=" + uid
    httprequest(marytts_voicebuild_request_url, function(error, voicebuild_response, body){
		console.log("error: ", error);
		console.log("statusCode: ", voicebuild_response && voicebuild_response.statusCode);
		console.log("body: ", body);
	});
    response.end(); 
  }


  upsertSentencesIntoDb(){

    // upsert sentenceArray to MySQL. 

    this.mysql.query("CREATE TABLE IF NOT EXISTS RecordedSentences ("
      + " uid VARCHAR(100) NOT NULL, guid VARCHAR(100) NOT NULL, "
      + "  PRIMARY KEY (uid, guid))", null)
    .then( () => {
      this.mysql.query("DROP TABLE IF EXISTS Sentences", null)
    })
    .then( () => {
      this.mysql.query("CREATE TABLE Sentences (guid VARCHAR(100) NOT NULL, sentence VARCHAR(10000), PRIMARY KEY (guid))", null)
      .then( () => {
         this.getFilesInFolder(this.getSentenceFolder())
      	  .then(files => {
         	// return each file in the data folder
         	return Promise.all(files.map(filename => {
           		if (filename.split('.').pop() !== 'txt'){
             			return null;
           		}
           		let filepath = path.join(this.getSentenceFolder(), filename);
           		return this.getFileContents(filepath);
         	}));
      	  })
          .then(filecontent => {
        	let sentences = [];
        	let sentenceArray = filecontent.map(content => {
          		if (!content)
            			return [];
          		let filesentences = content.split('\n');
          		return filesentences.filter(emptyline => { return !!emptyline;});
        	});

        	sentences = sentences.concat.apply(sentences, sentenceArray);
        	for(var sentence of sentences){                        
          		let hash = crypto.createHmac('sha256', salt).update(sentence).digest('hex');          
          		this.mysql.query("INSERT INTO Sentences SET ? ", { guid: hash, sentence: sentence});
        	}
      	  });  
      })
      .catch( error => {
	console.log(error);
      });
    });            
  }
    
  /**
   * Load sentence file (if necessary), pick random sentence.
   */
  returnRandomSentence(response: http.ServerResponse, count: number, uid: string) {

    count = count || 1;

    this.getRandomUnreadSentences(uid, count)
    .then(randoms => {
        response.setHeader('Content-Type', 'text/plain');
        response.writeHead(200);
        response.end(randoms.join('\n'));
      }
    ).catch((err: any) => {
        console.error('Could not load sentences', err);
        response.writeHead(500);
        response.end('No sentences right now');
    });
  }


  getNotRecordedCount(uid: string): Promise<string> {

    return new Promise((res, rej) => {

      this.mysql.query("SELECT count(*) AS not_recorded_count "
        + " FROM Sentences s "
        + " WHERE s.guid NOT IN "
        + " ( "
        + "    SELECT rs.guid FROM RecordedSentences rs "
        + "    WHERE rs.uid='" + uid + "'"
        + " )", null
      )
      .then ( result => {
	    res(result[0]["not_recorded_count"] as string);
      })
      .catch( error => {
          console.log(error);
      });

   });

  }


  getRecordedCount(uid: string): Promise<string> {
       
    return new Promise((res, rej) => {

      
      this.mysql.query("SELECT count(*) AS recorded_count "
	+ " FROM Sentences s "
	+ " WHERE s.guid IN "
	+ " ( "
	+ "    SELECT rs.guid FROM RecordedSentences rs "
	+ "    WHERE rs.uid='" + uid + "'"
	+ " )", null
      )
      .then ( result => {
	    res(result[0]["recorded_count"] as string);
      })
      .catch( error => {
	  console.log(error);	  
      });

   }); 
                
  }

}
