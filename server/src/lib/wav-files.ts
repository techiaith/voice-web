import { map } from '../promisify';
import { getFileExt } from './utility';

const MemoryStream = require('memorystream');
const path = require('path');
const Promise = require('bluebird');
const Random = require('random-js');
const AWS = require('./aws');
const fs = require('fs');

const walk = require('walk');

const KEYS_PER_REQUEST = 1000; // Max is 1000.
const LOAD_DELAY = 200;
const MP3_EXT = '.mp3';
const WAV_EXT = '.wav';
const TEXT_EXT = '.txt';
const VOTE_EXT = '.vote';
const CONVERTABLE_EXTS = ['.ogg', '.m4a'];
const CONFIG_PATH = path.resolve(__dirname, '../../..',
                                 'config.json');
const config = require(CONFIG_PATH);
const BUCKET_NAME = config.BUCKET_NAME || 'common-voice-corpus';

const RECORDINGS_ROOT_DIR = '/recordings';


export default class Files {

  private files: {
    // fileGlob: [
    //   sentence: 'the text of the sentenct'
    // ]
  };

  private walkerfiles: string[];
  private paths: string[];
  private votes: number;
  private validated: number;
  private randomEngine: any

  constructor() {
    console.log("files contructor called");
    this.files = {};
    this.votes = 0;
    this.validated = 0;
    this.paths = [];
    this.walkerfiles = [];

    this.randomEngine = Random.engines.mt19937();
    this.randomEngine.autoSeed();
  }

  /**
   * Returns the file path with extension stripped.
   */
  private getGlob(path: string): string {
    return path.substr(0, path.indexOf('.'));
  }

  /**
   * Read a sentence 
   */
  private fetchSentence(glob: string): Promise<string> {
    let key = glob + TEXT_EXT;

    return new Promise((res, rej) => {
      let glob = this.getGlob(key);

      fs.readFile(key, (err, data) => {
	if (err) {
		console.error("Could not read file", key, err);
		rej(err);
		return;
	}

	let sentence = data.toString();
        this.files[glob].sentence = sentence;
        res(sentence);	
      });
    });

  }

  /**
   * Fetch a public url for the resource.
   */
  private getPublicUrl(key: string) {
    console.log("files.ts::getPublicUrl. Returning https://paldaruo.techiaith.cymru/upload" + key  );
    return "https://paldaruo.techiaith.cymru/upload" + key;
    //console.log("files.ts::getPublicUrl. Returning http://localhost:9000/upload" + key  );
    //return "http://localhost:9000/upload" + key;
  }

  /**
   * Remove any clips from our pool that have already been voted on.
   */
  private filterPaths() {
    this.paths = this.paths.filter(glob => {
      let info = this.files[glob];
      if (!info) {
        console.error('glob not in file map', glob);
        return false;
      }

      if (!info.text || !info.sound) {
        console.log('missing data for glob', info);
        return false;
      }

      if (info.votes > 3) {
        this.validated++;
        return false;
      }

      return true;
    });
  }

  /**
   * Load a single set of file keys based on KEYS_PER_REQUEST.
   */
  private loadNext(res: Function, rej: Function,
                   continuationToken?: string): void 
  {

    let walker = walk.walk(RECORDINGS_ROOT_DIR, {followLinks: false});
    walker.on('file', (root, stat, next) => {
        //console.log("pushing " + root + '/' + stat.name);
	this.walkerfiles.push(root + '/' + stat.name);
	next();
    });

    let startRequest = Date.now();
    walker.on('end', () => {

	let startParsing = Date.now();
        for (let i = 0; i < this.walkerfiles.length; i++){
		
		let key = this.walkerfiles[i];
		let glob = this.getGlob(key);
		let ext = getFileExt(key);
		
		//console.log("initialise key: " + key + ", glob: " + glob + ", ext " + ext);
	
		if (ext !== TEXT_EXT && ext !== WAV_EXT && ext !== VOTE_EXT) {
			continue;
		}

		if (ext == VOTE_EXT) {
			glob = glob.substr(0, glob.indexOf("-by-"));
		}

		if (!this.files[glob]){
			this.files[glob] = {
				pushed: false,
				votes:0
			};
		}

		let info = this.files[glob];

		if (ext == TEXT_EXT){
			info.text = key;
		} else if (ext == WAV_EXT) {
			info.sound = key;
		} else if (ext == VOTE_EXT) {
			info.votes++;
			this.votes++;
		}	

		if (!info.pushed && info.text && info.sound && info.votes < 3) {
			this.paths.push(glob);
			info.pushed = true;
		}
	}

	// Filter the elligible clips for verification, making sure
        // we are not trying to reverify any.
        this.filterPaths();
        console.log('clips load', this.paths.length, this.votes, this.validated);
        console.log(`load time ${startParsing - startRequest} parse time ${Date.now() - startParsing}`);

    });

  }

  /**
   * Load sound file metadata into memory.
   */
  private loadCache(): Promise<void> {
    return new Promise((res, rej) => {
      this.loadNext(res, rej);
    });
  }

  /**
   * Fetch a random clip but make sure it's not the current user's.
   */
  private getGlobNotFromMe(myUid: string) {

    if (this.paths.length === 0) {
      return null;
    }

    let hasMoreThanOneUid: boolean = false;
    for (let path of this.paths){
	if (!path.includes(myUid)){
		hasMoreThanOneUid = true;
 		break;
	}
    }

    if (hasMoreThanOneUid===true){
    	let glob;
    	let distribution = Random.integer(0, this.paths.length - 1);
    	do {
      		glob = this.paths[distribution(this.randomEngine)];
    	} while (glob.includes(myUid));
    	return glob;
    } else {
       	return null;
    }
  }

  /**
   * Prepare a list of files
   */
  init(): Promise<void> {
    return this.loadCache();
  }

  /**
   * Grab a random sentence url and mp3 url.
   */
  getRandomClipJson(uid: string): Promise<string> {
    let glob = this.getGlobNotFromMe(uid);
    if (!glob) {
      return Promise.reject('No globs from me');
    }

    let info = this.files[glob];
    let clipJson = {
      glob: glob,
      text: info.sentence,
      sound: this.getPublicUrl(info.sound),
    };

    if (clipJson.text) {
      return Promise.resolve(JSON.stringify(clipJson));
    }

    return this.fetchSentence(glob).then(sentence => {
      clipJson.text = sentence;
      return Promise.resolve(JSON.stringify(clipJson));
    });
  }

  /**
   * Grab a random sentence and associated sound file path.
   */
  getRandomClip(uid: string): Promise<string[2]> {
    // Make sure we have at least 1 file to choose from.
    if (this.paths.length === 0) {
      return Promise.reject('No files.');
    }

    let glob = this.getGlobNotFromMe(uid);

    // Grab clip metadata.
    let info = this.files[glob];
    let soundfile = glob + WAV_EXT;
    if (!info || !info.text || !info.sound) {
      console.error('unidentified random glob', glob);
      return Promise.reject('glob info not found');
    }

    // If we have a cached sentence, return it immediately.
    if (info.sentence && /\S/.test(info.sentence)) {
      return Promise.resolve([soundfile, info.sentence]);
    }

    // Grab the sentence contence 
    return this.fetchSentence(glob).then(sentence => {
      return Promise.resolve([soundfile, info.sentence]);
    });
  }
}
