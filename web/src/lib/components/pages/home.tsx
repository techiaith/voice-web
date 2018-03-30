import { h, Component } from 'preact';
import Validator from '../validator';
import API from '../../api';
import User from '../../user';

import AudioWeb, { AudioInfo } from './record/audio-web';
import { getItunesURL } from '../../utility';
import { getGooglePlayURL } from '../../utility';

import Icon from '../icon';

interface Props {
  api: API;
  active: string;
  navigate(url: string): void;
  user?: User;
}

export default class Home extends Component<Props, void> {

  audio: AudioWeb;
  isUnsupportedPlatform: boolean;


  constructor(props) {
    super(props);
    this.onVote = this.onVote.bind(this);

    this.audio = new AudioWeb();
    
    if (!this.audio.isMicrophoneSupported()) {
      this.isUnsupportedPlatform = true;
      return;
    }

    if (!this.audio.isAudioRecordingSupported()) {
      this.isUnsupportedPlatform = true;
      return;
    }

  }

  onVote() {
    this.props.user && this.props.user.tallyVerification();
    this.props.navigate('/'); // force top level page render
  }

  render() {

    if (this.isUnsupportedPlatform) {

      return <div id="home-container" className={this.props.active}>
        
      <div id="home-layout">
      
      <div className="left-column">

        {this.renderIntroduction()}

        <div className={'unsupported ' + this.props.active}>
          <h2>            
            Ymddiheuriadau, ond nid yw eich porwr yn ddigonol ar gyfer gwefan Paldaruo.
          </h2>
          <p>
            Mae modd llwytho i lawr a defnyddio'r porwyr canlynol ar gyfer eich cyfrifiadur:
            <a target="_blank" href="https://www.firefox.com/">
              <Icon type="firefox" />Firefox</a> or
            <a target="_blank" href="https://www.google.com/chrome">
              <Icon type="chrome" />Chrome</a>
          </p>
          <p>Mae modd hefyd defnyddio'r ap Paldaruo ar gyfer iOS ac Android :</p>
          <a target="_blank" href={getItunesURL()}><img src="/img/appstore.svg" /></a>
          <a target="_blank" href={getGooglePlayURL()}><img src="/img/google_en_badge_web_generic.png" style="width:155px;margin-left:-10px;" /></a>
        </div>
       
      </div>
      </div>
      </div>;
    } 
    else {

      return <div id="home-container" className={this.props.active}>
        
        <div id="home-layout">
          
        <div className="left-column">
          {this.renderIntroduction()}
        </div>

	</div>

      </div>;
    }
  }

  private renderIntroduction(){

    return (
    <div>
      <h2>LLEISIWR</h2>
      <p> 
	blah blah blah
      </p>
      <br/>
    
      <h2>Am wybodaeth bellach</h2>
      <p>Ewch i wefan y project i gael y diweddaraf am ein gwaith : 
      <a href="http://lleisiwr.techiaith.cymru/">http://lleisiwr.techiaith.cymru/</a></p>
    </div>
    );

  }
}
