import API from '../../api';
import User from '../../user';
import Tracker from '../../tracker';
import { h, Component } from 'preact';
import Icon from '../icon';
import AudioIOS from './record/audio-ios';
import AudioWeb, { AudioInfo } from './record/audio-web';
import ListenBox from '../listen-box';
import ProgressButton from '../progress-button';
import ERROR_MSG from '../../../error-msg';
import { getItunesURL, isFocus, countSyllables, isNativeIOS, generateGUID }
  from '../../utility';
import confirm from '../confirm';

const CACHE_SET_COUNT = 3;
const SET_COUNT = 3;
const PAGE_NAME = 'record';


interface RecordProps {
  active: string;
  user: User;
  api: API;
  navigate(url: string): void;
  onSubmit(recordings: Blob[], sentences: string[],
           progressCb: Function): Promise<void>;
  onRecord: Function;
  onRecordStop: Function;
  onRecordingSet: Function;
  onDelete: Function;
  onVolume(volume: number): void;
}

interface RecordState {
  sentences: string[];
  recording: boolean;
  recordingStartTime: number;
  recordings: any[];
  uploading: boolean;
  uploadProgress: number;
  isReRecord: boolean;
}

export default class RecordPage extends Component<RecordProps, RecordState> {
  name: string = PAGE_NAME;
  audio: AudioWeb | AudioIOS;
  isUnsupportedPlatform: boolean;
  tracker: Tracker;
  sentenceCache: string[];

  state = {
    sentences: [],
    recording: false,
    recordingStartTime: 0,
    recordings: [],
    uploading: false,
    uploadProgress: 0,
    isReRecord: false
  };

  constructor(props) {

    super(props);

    this.tracker = new Tracker();

    this.sentenceCache = [];
    this.refillSentenceCache().then(this.newSentenceSet.bind(this));

    // Use different audio helpers depending on if we are web or native iOS.
    if (isNativeIOS()) {
      this.audio = new AudioIOS();
    } else {
      this.audio = new AudioWeb();
    }
    this.audio.setVolumeCallback(this.updateVolume.bind(this));

    if (!this.audio.isMicrophoneSupported()) {
      this.isUnsupportedPlatform = true;
      return;
    }

    if (!this.audio.isAudioRecordingSupported()) {
      this.isUnsupportedPlatform = true;
      return;
    }

    if (isFocus()) {
      this.isUnsupportedPlatform = true;
      return;
    }

    // Bind now, to avoid memory leak when setting handler.
    this.onSubmit = this.onSubmit.bind(this);
    this.onRecordClick = this.onRecordClick.bind(this);
    this.processRecording = this.processRecording.bind(this);
    this.goBack = this.goBack.bind(this);
    this.onProgress = this.onProgress.bind(this);
  }

  private refillSentenceCache() {
    return this.props.api.getRandomSentences(CACHE_SET_COUNT)
      .then(newSentences => {
        this.sentenceCache = this.sentenceCache.concat(newSentences);
      });
  }

  private processRecording(info: AudioInfo) {
    let recordings = this.state.recordings;
    recordings.push(info);

    this.setState({
      recordings: recordings,
      recording: false,
      isReRecord: false
    });

    this.tracker.trackRecord();

    this.props.onRecordStop && this.props.onRecordStop();

    if (!this.props.onRecordingSet) {
      return;
    }

    if (this.isFull()) {
      this.props.onRecordingSet();
    }
  }

  private deleteRecording(index: number): void {
    // Move redo sentence to the end.
    let sentences = this.state.sentences;
    let redoSentence = sentences.splice(index, 1);
    sentences.push(redoSentence[0]);

    let recordings = this.state.recordings;
    recordings.splice(index, 1);
    this.setState({
      recordings: recordings,
      sentences: sentences,
      isReRecord: true,
    });

    this.props.onDelete();
  }

  private getRecordingUrl(which: number): string {
    let r = this.state.recordings[which] && this.state.recordings[which].url;
    return r || '';
  }

  private getSentence(which: number): string {
    let s = this.state.sentences[which] && this.state.sentences[which];
    return s || '';
  }

  private onProgress(percent: number) {
    this.setState({ uploadProgress: percent });
  }

  private updateVolume(volume: number) {
    if (!this.state.recording || !this.props.onVolume) {
      return;
    }

    this.props.onVolume(volume);
  }

  private onSubmit() {
    if (this.state.uploading) {
      return;
    }

    this.setState({
      uploading: true
    });

    this.props.onSubmit(this.state.recordings, this.state.sentences, this.onProgress)
      .then(() => {
        this.reset();
        this.tracker.trackSubmitRecordings();
      })
      .catch(() => {
        this.setState({
          uploading: false
        });
  	    //@todo - cyfieithu
        confirm('You did not agree to our Terms of Service. Do you want to delete your recordings?', 'Keep the recordings', 'Delete my recordings').then((keep) => {
          if (!keep) {
            this.reset();
            this.props.navigate('/');
          }
        })
      });
  }

  private isFull(): boolean {
    return this.state.recordings.length >= SET_COUNT;
  }

  private goBack(): void {
    if (this.state.recordings.length < 1) {
      console.error('cannot undo, no recordings');
      return;
    }

    // If user was recording when going back, make sure to throw
    // out this new recording too.
    if (this.state.recording) {
      this.stopRecordingHard();
    }

    let recordings = this.state.recordings;
    recordings.pop();
    this.setState({
      recordings: recordings,
    });
  }

  private reset(): void {
    this.setState({
      recording: false,
      recordings: [],
      sentences: [],
      uploading: false,
      uploadProgress: 0
    });
    this.newSentenceSet();
  }

  private hasProfile(): boolean {
    if (this.props.user.state.age &&
	      this.props.user.state.accent &&
	      this.props.user.state.childhood &&
        this.props.user.state.homeregion &&
        this.props.user.state.frequency &&
        this.props.user.state.context &&
        this.props.user.state.regionalaccent 
        ){
        return true;
    }
    return false;
  }

  onRecordClick(evt?: any) {
    evt.preventDefault();
    evt.stopImmediatePropagation();

    if (this.state.recording) {
      this.stopRecording();

    // Don't start a new recording when full.
    } else if (!this.isFull()) {
      this.audio.init().then(() => {
        this.startRecording();
      });
    }
  }

  startRecording() {
    this.audio.start();
    this.setState({
      recording: true,
      // TODO: reanble display of recording time at some point.
      // recordingStartTime: this.audio.audioContext.currentTime
    });
    this.props.onRecord && this.props.onRecord();
  }

  stopRecording() {
    this.audio.stop().then(this.processRecording);;
  }

  /**
   * Stop the current recording and throw out the audio.
   */
  stopRecordingHard() {
    this.audio.stop();
    this.setState({
      recording: false
    });

    this.props.onRecordStop && this.props.onRecordStop();
  }


  newSentenceSet() {
    // If we don't have any sentences in our cache, fill it and try again.
    if (this.sentenceCache.length < SET_COUNT) {
      console.error('slow path for getting new sentences');
      this.refillSentenceCache().then(this.newSentenceSet.bind(this));
      return;
    }

    let newOnes = this.sentenceCache.splice(0, SET_COUNT);
    this.setState({ sentences: newOnes });

    // causes prompts to be repeated in smaller collections.
    // // Preemptively fill setnece cache when we get low.
    // if (this.sentenceCache.length < SET_COUNT * 2) {
    //   console.log("pre-emptive fill of sentenceCache");  
    //   this.refillSentenceCache();
    // }

  }


  render() {
    // Make sure we can get the microphone before displaying anything.
    // @todo : cyfieithu
    if (this.isUnsupportedPlatform) {
      return <div className={'unsupported ' + this.props.active}>
        <h2>
          Mae'n ddrwg gennym, ond nid yw eich platfform yn cael ei gefnodi.
        </h2>
        <h2>
          We're sorry, but your platform is not currently supported.
        </h2>
        <p>
          Mae modd defnyddio porwyr Chrome neu Firefox ar beirannau Windows, Mac OS X neu Android.
        </p>
        <p>
          You may use Chrome or Firefox on Windows, Mac OS X or Android devices.
        </p>                 
      </div>;
    }

    // During uploading, we display the submit page for progress.
    let isFull = this.isFull() || this.state.uploading;
    let texts = [];   // sentence elements
    let listens = []; // listen boxes

    // Get the text prompts.
    for (let i = 0; i < SET_COUNT; i++) {

      // For the sentences elements, we need to 
      // figure out where each item is positioned.
      let className = 'text-box';
      let length = this.state.recordings.length;
      if (i < length) {
        className = className + ' left';
      } else if (i > length) {
        className = className + ' right';
      }

      texts.push(<p className={className}>
        {this.state.sentences[i]}
      </p>);

      listens.push(<ListenBox src={this.getRecordingUrl(i)}
                              onDelete={this.deleteRecording.bind(this, i)}
                              sentence={this.getSentence(i)}/>);
    }

    let showBack = this.state.recordings.length !== 0 && !this.state.isReRecord;
    let className = this.props.active + (isFull ? ' full': '');
    let progress = this.state.uploadProgress;
    if (this.state.uploading) {
      // Look ahead in the progress bar when uploading.
      progress += (100 / SET_COUNT) * 1;
    }

    return <div id="record-container" className={className}>
      <div id="voice-record">
        <p id="recordings-count">
          <span style={this.state.isReRecord ? 'display: none;' : ''}>
            {this.state.recordings.length + 1} of 3</span>
        </p>
        <div className="record-sentence">
          {texts}
          <Icon id="undo-clip" type="undo" onClick={this.goBack}
            className={!showBack ? 'hide' : ''}/>
        </div>
        <div id="record-button" onTouchStart={this.onRecordClick}
                                onClick={this.onRecordClick}></div>
        <p id="record-help">
          Cliciwch i gychwyn recordio ac yna darllenwch y testun i'r cyfrifiadur.
	  <br/><br/>
	  Mae'r system yn recordio'r sain pan fydd y botwm wedi troi'n binc.
    <br/><br/>
    Cliciwch y botwm eto er mwyn gorffen recordio ac i fynd ymlaen i'r testun nesaf.
	</p>
      </div>
    <div id="voice-submit">        
        <p id="box-headers">
          <span>Chwarae/Stop</span>
          <span>Ail-recordio</span>
        </p>
        {listens}
        <ProgressButton percent={progress} disabled={this.state.uploading}
                        onClick={this.onSubmit} text="Anfon" />
      </div>
    </div>;
  }
}
