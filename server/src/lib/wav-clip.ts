import * as http from 'http';
import Files from './wav-files';
import { getFileExt } from './utility';
import Mysql from './db/mysql';

const ms = require('mediaserver');
const path = require('path');
const ff = require('ff');
const fs = require('fs');
const crypto = require('crypto');
const Promise = require('bluebird');
const mkdirp = require('mkdirp');
const PassThrough = require('stream').PassThrough;
const Transcoder = require('stream-transcoder');

const wav = require('wav');

const UPLOAD_PATH = path.resolve(__dirname, '../..', 'upload');
const CONFIG_PATH = path.resolve(__dirname, '../../..', 'config.json');
const ACCEPTED_EXT = [ '.mp3', '.ogg', '.webm', '.m4a' ];
const DEFAULT_SALT = '8hd3e8sddFSdfj';
const config = require(CONFIG_PATH);
const salt = config.salt || DEFAULT_SALT;
const BUCKET_NAME = config.BUCKET_NAME || 'common-voice-corpus';

const RECORDINGS_ROOT_DIR = '/recordings/';

/**
 * Clip - Responsibly for saving and serving clips.
 */
export default class Clip {
  private files: Files;
  mysql: any;

  constructor() {
    this.files = new Files();
    this.mysql = new Mysql();
  }

  /**
   * Returns the file path with extension stripped.
   */
  private getGlob(path: string): string {
    return path.substr(0, path.indexOf('.'));
  }

  private hash(str: string): string {
    return crypto.createHmac('sha256', salt).update(str).digest('hex');
  }

  private streamAudio(request: http.IncomingMessage,
                      response: http.ServerResponse,
                      key: string): void {

    // Save the data locally, stream to client, remove local data (Performance?)
    console.log("clip.ts::streamAudio(" + key + "){}");
    ms.pipe(request, response, key);
  }

  /**
   * Turn a server url into a S3 file path.
   */
  private getS3FilePath(url: string): string {
    let parts = url.split('/');
    let fileName = parts.pop();
    let folder = parts.pop();
    return folder + '/' + fileName;
  }

  /**
   * Turn a server url into a path for a wav file
   */
  private getFilePath(url: string): string {
    // drop the /upload/
    let parts = url.split('/');
    let filepath = '/' + parts.slice(2).join('/');
    console.log("clip.ts::getFilePath returns " + filepath);
    return filepath;
  }


  /**
   * Prepare a list of files from s3.
   */
  init(): Promise<void> {
    return this.files.init();
  }

  /**
   * Is this request directed at voice clips?
   */
  isClipRequest(request: http.IncomingMessage) {
    return request.url.includes('/upload/');
  }

  /**
   * Is this request directed at a random voice clip?
   */
  isRandomClipRequest(request: http.IncomingMessage): boolean {
    return request.url.includes('/upload/random');
  }

  /**
   * Is this a random clip for voice file urls?
   */
  isRandomClipJsonRequest(request: http.IncomingMessage): boolean {
    return request.url.includes('/upload/random.json');
  }

  /**
   * Is this request to vote on a voice clip?
   */
  isClipVoteRequest(request: http.IncomingMessage) {
    return request.url.includes('/upload/vote');
  }


  /**
  /**
   * Is this request to save demographic info?
   */
  isClipDemographic(request: http.IncomingMessage) {
    return request.url.includes('/upload/demographic');
  }

  /* Is this request to save demographic info?
   */
  isSoundClipRequest(request: http.IncomingMessage) {
    return request.url.includes('/recordings');
  }

  /**
   * Distinguish between uploading and listening requests.
   */
  handleRequest(request: http.IncomingMessage,
                response: http.ServerResponse): void {

    console.log("clip.ts::handleRequest(" + request.method + "," + request.url + "){}");

    if (request.method === 'POST') {
      if (this.isClipVoteRequest(request)) {   // Note: Check must occur first
        this.saveClipVote(request, response);
      } else if (this.isClipDemographic(request)) {
        this.saveClipDemographic(request, response);
      } else {
        this.saveClip(request, response);
      }
    } else if (this.isRandomClipJsonRequest(request)) {
      this.serveRandomClipJson(request, response);
    } else if (this.isRandomClipRequest(request)) {
      this.serveRandomClip(request, response);
    //} else if (this.isSoundClipRequest(request)) {
    //  console.log("isSoundClipRequest Ok!")
    } else {
      this.serve(request, response);
    }
  }

  /**
   * Save clip vote posted to server
   */
  saveClipVote(request: http.IncomingMessage,
                  response: http.ServerResponse) {
      this.saveVote(request).then(timestamp => {
        response.writeHead(200);
        response.end('' + timestamp);
      }).catch(e => {
        response.writeHead(500);
        console.error('saving clip vote error', e, e.stack);
        response.end('Error');
      });
  }

  /**
   * Save the request clip vote in S3
   */
  saveVote(request: http.IncomingMessage): Promise<string> {
    let uid = request.headers.uid;
    let glob = request.headers.glob;
    let vote = decodeURI(request.headers.vote as string);

    if (!uid || !glob || !vote) {
      return Promise.reject('Invalid headers');
    }

    return new Promise((resolve: Function, reject: Function) => {
      // Where is the clip vote going to be located?
      let voteFile = glob + '-by-' + uid + '.vote';
      console.log("clip.ts::saveVote(" + voteFile + ")");

      let f = ff(() => {

	      fs.writeFile(voteFile, vote, function(err) {
		      if (err){
			      console.log(err);
		      }
	      });

      }, () => {

        // File saving is now complete.
        resolve(glob);
      }).onError(reject);
    });
  }

  /**
   * Save clip demographic posted to server
   */
  saveClipDemographic(request: http.IncomingMessage,
                  response: http.ServerResponse) {
      this.saveDemographic(request).then(timestamp => {
        response.writeHead(200);
        response.end('' + timestamp);
      }).catch(e => {
        response.writeHead(500);
        console.error('saving clip demographic error', e, e.stack);
        response.end('Error');
      });
  }

  /**
   * Save the request clip demographic in S3
   */
  saveDemographic(request: http.IncomingMessage): Promise<string> {
    let uid = request.headers.uid;
    let demographic = request.headers.demographic as string;

    if (!uid || !demographic) {
      return Promise.reject('Invalid headers');
    }

    return new Promise((resolve: Function, reject: Function) => {
      // Where is the clip demographic going to be located?
      let demographicFile = RECORDINGS_ROOT_DIR + uid + '/demographic.json';

      let f = ff(() => {
	fs.writeFile(demographicFile, demographic, function(err){
		if (err){
			console.log(err);
		}
	});

      }, () => {

        // File saving is now complete.
        resolve(uid);
      }).onError(reject);
    });
  }

  /**
   * Save clip posted to server
   */
  saveClip(request: http.IncomingMessage,
                  response: http.ServerResponse) {
      this.save(request).then(timestamp => {
        response.writeHead(200);
        response.end('' + timestamp);
      }).catch(e => {
        response.writeHead(500);
        console.error('saving clip error', e, e.stack);
        response.end('Error');
      });
  }

  /**
   * Save the request body as an audio file.
   */
  save(request: http.IncomingMessage): Promise<string> {

    let info = request.headers;
    let uid = info.uid;
    let sentence = decodeURIComponent(info.sentence as string);
    
    if (!uid || !sentence) {
      return Promise.reject('Invalid headers');
    }
   
    return new Promise((resolve: Function, reject: Function) => {

      // Obtain contentType
      let contentType = info['content-type'] as string;

      // Where is our audio clip going to be located?
      let folder = RECORDINGS_ROOT_DIR + uid + '/';
      let filePrefix = this.hash(sentence);
      let file = folder + filePrefix + '.wav';
      let txtFile = folder + filePrefix + '.txt';

      // update the database
      this.mysql.query("INSERT INTO RecordedSentences SET ?", {uid: uid, guid: filePrefix})        
        .then ( result => { 
           //console.log(result);
        }, err => {
           console.log("INSERT RecordedSentences exception: " + err);
        });

      //
      let f = ff(() => {

	      // if the folder does not exist, we create it
	      if (!fs.existsSync(folder)){
		      fs.mkdirSync(folder);
	      }

        // If we were given base64, we'll need to concat it all first
        // So we can decode it in the next step.
        if (contentType.includes('base64')) {
          let chunks = [];
          f.pass(chunks);
          request.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          request.on('end', f.wait());
        }

      }, (chunks) => {

        // If upload was base64, make sure we decode it first.
        if (contentType.includes('base64')) {
          let passThrough = new PassThrough();
          passThrough.end(Buffer.from(Buffer.concat(chunks).toString(), 'base64'));
          let transcoder = new Transcoder(passThrough);
	        transcoder = transcoder.audioCodec('pcm_s16le').format('wav').sampleRate(48000).channels(1);
	        transcoder.writeToFile(file);          
        } else {
          // For non base64 uploads, we can just stream data.
          let transcoder = new Transcoder(request);
          transcoder = transcoder.audioCodec('pcm_s16le').format('wav').sampleRate(48000).channels(1);
	        transcoder.on('error',function(error){
		        if (error){
          			console.log("Error writing file to disk: " + error);
              			throw error;
		        }
	        });
	        transcoder.writeToFile(file);
        }
        
    }, () => {
        // File saving is now complete.

        // Don't forget about the sentence text!
        fs.writeFile(txtFile, sentence, function(err){
          if (err){
            return console.log(err);
          }
        });

        resolve(filePrefix);
        
      }).onError(reject);

    });

  }

  serveRandomClipJson(request: http.IncomingMessage,
                      response: http.ServerResponse) {
    console.log("clip.ts::serveRandomClipJson(" + request.headers.uid + "){}");

    let uid = request.headers.uid as string;
    if (!uid) {
      return Promise.reject('Invalid headers');
    }

    return this.files.getRandomClipJson(uid).then(clipJson => {
      response.writeHead(200);
      response.end(clipJson);
    }).catch(err => {
      console.error('could not get random clip', err);
      response.writeHead(500);
      response.end('Still loading');
    });
  }

  /**
   * Fetch random clip file and associated sentence.
   */
  serveRandomClip(request: http.IncomingMessage,
                  response: http.ServerResponse) {
    console.log("clip.ts::serveRandomClip(" + request.headers.uid + "){}");

    let uid = request.headers.uid as string;

    if (!uid) {
      return Promise.reject('Invalid headers');
    }

    this.files.getRandomClip(uid).then((clip: string[2]) => {
      if (!clip) {
      }

      // Get full key to the file.
      let key = clip[0];
      let sentence = clip[1]

      // Send sentence + glob strings to client in the header.
      // First, we make sure to encode the sentence proprly.
      let isEncoded = sentence !== decodeURIComponent(sentence);
      let encoded = isEncoded ? sentence : encodeURIComponent(sentence);

      try {
        response.setHeader('sentence', encoded);
      } catch(err) {
        // If sentence cannot be set as a header (e.g. mixed encodings)
        // bail out and try a new random setence
        console.error('could not set header', sentence, isEncoded, encoded);
        this.serveRandomClip(request, response);
        return;
      }
      response.setHeader('glob', this.getGlob(key));

      // Stream audio to client
      this.streamAudio(request, response, key);
    }).catch(err => {
      console.error('problem getting a random clip: ', err);
      response.writeHead(500);
      response.end('Cannot fetch random clip right now.');
      return;
    });
  }

  /*
   * Fetch an audio file.
   */
  serve(request: http.IncomingMessage, response: http.ServerResponse) {

    console.log("clip.ts::serve(" + request.url + "){}");
    let filePath = this.getFilePath(request.url);
    this.streamAudio(request, response, filePath);


    //let searchParam = {Bucket: BUCKET_NAME, Prefix: prefix};
    //console.log("clip.ts::serveRandomClip{this.s3.listObjectsV2(" + searchParam + ")}");
    //this.s3.listObjectsV2(searchParam, (err: any, data: any) => {
    //  if (err) {
    //    console.error('Did not find specified clip', err);
    //    response.writeHead(404);
    //    response.end('Unknown File');
    //    return;
    //  }

    //  // Try to find the right key, since we don't know the extension.
    //  let key = null;
    //  for (let i = 0; i < data.Contents.length; i++) {
    //    let ext = getFileExt(data.Contents[i].Key);
    //    if (ACCEPTED_EXT.indexOf(ext) !== -1) {
    //      key = data.Contents[i].Key;
    //      break;
    //    }
    //  }

    //  if (!key) {
    //    console.error('could not find clip', data.Contents);
    //    response.writeHead(404);
    //    response.end('Unknown File');
    //    return;
    //  }

      // Stream audio to client
    //  this.streamAudio(request, response, key);
    //});
  }
}
