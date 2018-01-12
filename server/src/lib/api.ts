import * as http from 'http';
import WebHook from './webhook';

const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');
const Random = require('random-js');
const _ulib = require('underscore');

const crypto = require('crypto');

const CONFIG_PATH = path.resolve(__dirname, '../../..', 'config.json');
const DEFAULT_SALT = '8hd3e8sddFSdfj';
const config = require(CONFIG_PATH);
const salt = config.salt || DEFAULT_SALT;

const SENTENCE_FOLDER = '../../data/';
const RECORDINGS_ROOT_DIR = '/recordings/';

export interface IHash {
	[details: string] : String;
}

export default class API {

  hashedSentencesCache: String[];
  hashedSentencesMap : IHash;

  webhook: WebHook;
  randomEngine: any

  constructor() {
    this.webhook = new WebHook();
    this.getSentences();
    this.randomEngine = Random.engines.mt19937();
    this.randomEngine.autoSeed();
    this.hashedSentencesMap = {}; 
  }

  private getSentenceFolder() {
    return path.join(__dirname, SENTENCE_FOLDER);
  }

  private getUserRecordingsFolder(uid: string) {
    return path.join(RECORDINGS_ROOT_DIR, uid);
  }

  private getRandomSentences(uid: string, count: number): Promise<string[]> {
    return this.getUnrecordedSentences(uid).then(sentences => {
      let randoms = [];
      for (var i = 0; i < count; i++) {
        let distribution = Random.integer(0, sentences.length - 1);
        let randomIndex = distribution(this.randomEngine);
        //randoms.push(sentences[randomIndex]);
        randoms.push(this.hashedSentencesMap[sentences[randomIndex]]);
      }
      return randoms;
    });
  }


  private getUnrecordedSentences(uid: string): Promise<string[]> {

    return this.getFilesInFolder(this.getUserRecordingsFolder(uid))

      .then(files => {
        return Promise.all(files.map(filename => {

          // Only parse the top-level text files, not any sub folders.
          if (filename.split('.').pop() !== 'txt') {
            return null;
          }
	        let filepath = path.join(this.getUserRecordingsFolder(uid), filename);
          return this.getFileContents(filepath);
        }));
      })      
      .then((values) => {
	      let recordedsentences = [];
        let sentenceArrays = values.map(fileContents => {
          if (!fileContents) {
            return [];
          }          
	        let hash = crypto.createHmac('sha256', salt).update(decodeURIComponent(fileContents)).digest('hex');
	        return hash; //fileContents;
        });
        recordedsentences = recordedsentences.concat.apply(recordedsentences, sentenceArrays);
	      let unrecorded = _ulib.difference(this.hashedSentencesCache, recordedsentences);	
        return unrecorded;
      })
      .catch(err => {
        console.error('no recordings yet..', err);
        //return [];
        // return all sentences
        return this.hashedSentencesCache;
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

  getSentences() {

    if (this.hashedSentencesMap) {
      return Promise.resolve(this.hashedSentencesMap);
    }

    return this.getFilesInFolder(this.getSentenceFolder())
      .then(files => {
        return Promise.all(files.map(filename => {

          // Only parse the top-level text files, not any sub folders.
          if (filename.split('.').pop() !== 'txt') {
            return null;
          }

          let filepath = path.join(this.getSentenceFolder(), filename);
          return this.getFileContents(filepath);
        }));
      })
      // Chop the array of content strings into an array of sentences.
      .then((values) => {
        let sentences = [];
        let sentenceArrays = values.map(fileContents => {
          if (!fileContents) {
            return [];
          }
          // Remove any blank line sentences.
          let fileSentences = fileContents.split('\n');
          return fileSentences.filter(sentence => { return !!sentence; });
        });
        sentences = sentences.concat.apply(sentences, sentenceArrays);
        let hashed = [];
	      for(var sentence of sentences){
		      let hash = crypto.createHmac('sha256', salt).update(sentence).digest('hex');
		      this.hashedSentencesMap[hash] = sentence;
		      hashed.push(hash);
	      }
	      this.hashedSentencesCache = hashed;
      })
      .catch(err => {
        console.error('could not retrieve sentences', err);
      });
  }
  
  /**
   * Load sentence file (if necessary), pick random sentence.
   */
  returnRandomSentence(response: http.ServerResponse, count: number, uid: string) {

    count = count || 1;

    this.getSentences().then((sentences: String[]) => {      
      return this.getRandomSentences(uid, count);
    }).then(randoms => {
      response.setHeader('Content-Type', 'text/plain');
      response.writeHead(200);
      response.end(randoms.join('\n'));
    }).catch((err: any) => {
      console.error('Could not load sentences', err);
      response.writeHead(500);
      response.end('No sentences right now');
    });
  }
}

