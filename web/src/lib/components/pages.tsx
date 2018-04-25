import { h, Component } from 'preact';
import { getItunesURL, isNativeIOS } from '../utility';
import Logo from './logo';
import Icon from './icon';
import PrivacyContent from './privacy-content';
import Robot from './robot';

import Home from './pages/home';
import Listen from './pages/listen';
import Record from './pages/record';
import Profile from './pages/profile';
import FAQ from './pages/faq';
import Privacy from './pages/privacy';
import Terms from './pages/terms';
import NotFound from './pages/not-found';

import API from '../api';
import User from '../user';

import AudioWeb, { AudioInfo } from './pages/record/audio-web';

const URLS = {
  ROOT: '/',
  HOME: '/home',
  RECORD: '/record',
  LISTEN: '/listen',
  PROFILE: '/profile',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  NOTFOUND: '/not-found'
};

const ROBOT_TALK = {
  'home': [
    <p>Greetings human!</p>,
    <p>My name is M.A.R.S. and I am a learning robot.</p>,
    <p>Right now, I am learning to speak like a human.</p>,
    <p>But. . .  it's so hard!</p>,
    <p>Can you help me learn?</p>,
    <p>All I need is for you to read to me. :)</p>,
    <p>Please click on the heart below to get started teaching me.</p>,
  ]
}

interface PagesProps {
  user: User;
  api: API;
  currentPage: string;
  navigate(url: string): void;
}

interface PagesState {
  isMenuVisible: boolean;
  pageTransitioning: boolean;
  scrolled: boolean;
  currentPage: string;
  showingPrivacy: boolean;
  transitioning: boolean;
  recording: boolean;
  robot: string;
  onPrivacyAction(didAgree: boolean): void;
  recorderVolume: number;
}

export default class Pages extends Component<PagesProps, PagesState> {
  private header: HTMLElement;
  private scroller: HTMLElement;
  private content: HTMLElement;
  private bg: HTMLElement;
  private iOSBackground: any[];

  audio: AudioWeb;
  isUnsupportedPlatform: boolean;

  state = {
    isMenuVisible: false,
    pageTransitioning: false,
    scrolled: false,
    currentPage: null,
    showingPrivacy: false,
    transitioning: false,
    recording: false,
    robot: '',
    onPrivacyAction: undefined,
    recorderVolume: 100
  };

  constructor(props) {
    super(props);

    // On native iOS, we found some issues animating the css background
    // image during recording, so we use this as a more performant alternative.
    this.iOSBackground = [];
    if (isNativeIOS()) {
      this.iOSBackground = [
        <img src="/img/wave-blue-mobile.png" />,
        <img src="/img/wave-red-mobile.png" />
      ];
    }

    this.audio = new AudioWeb();
    
    if (!this.audio.isMicrophoneSupported()) {
      this.isUnsupportedPlatform = true;
      return;
    }

    if (!this.audio.isAudioRecordingSupported()) {
      this.isUnsupportedPlatform = true;
      return;
    }

    this.uploadRecordings = this.uploadRecordings.bind(this);
    this.onRecord = this.onRecord.bind(this);
    this.onRecordStop = this.onRecordStop.bind(this);
    this.sayThanks = this.sayThanks.bind(this);
    this.renderUser = this.renderUser.bind(this);
    this.linkNavigate = this.linkNavigate.bind(this);
    this.clearRobot = this.clearRobot.bind(this);
    this.openInApp = this.openInApp.bind(this);
    this.closeOpenInApp = this.closeOpenInApp.bind(this);
    this.onVolume = this.onVolume.bind(this);
  }

  private onVolume(volume: number) {
    if (!this.state.transitioning && this.state.recording) {
      this.setState({ recorderVolume: volume });
    }
  }

  private openInApp() {
    window.location.href = getItunesURL();
  }

  private closeOpenInApp(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    document.getElementById('install-app').classList.add('hide');
  }

  private getCurrentPageName() {
    if (!this.state.currentPage) {
      return 'home';
    }

    let p = this.state.currentPage.substr(1);
    p = p || 'home';
    return p;
  }

  private sayThanks(): void {
    this.setState({
      robot: 'thanks'
    });
  }

  private clearRobot(): void {
    this.setState({
      robot: ''
    });
  }

  private isValidPage(url): boolean {
    return Object.keys(URLS).some(key => {
      return URLS[key] === url;
    });
  }

  private isPageActive(url: string|string[], page?: string): string {
    if (!page) {
      page = this.state.currentPage;
    }

    if (!Array.isArray(url)) {
      url = [url];
    }

    let isActive = url.some(u => {
      return u === page;
    });

    return isActive ? 'active' : '';
  }

  private onRecord() {

    // Callback function for when we've hidden the normal background.
    let cb = () => {
      this.bg.removeEventListener('transitionend', cb);
      this.setState({
        transitioning: false,
        recording: true
      });
    };
    this.bg.addEventListener('transitionend', cb);

    this.setState({
      transitioning: true,
      recording: false
    });
  }

  private onRecordStop() {
    this.setState({
      recording: false
    });
  }

  private addScrollListener() { this.scroller.addEventListener('scroll', evt => {
      let scrolled = this.scroller.scrollTop > 0;
      if (scrolled !== this.state.scrolled) {
        this.setState({ scrolled: scrolled });
      }
    });
  }

  private linkNavigate(evt: Event): void {
    evt.stopPropagation();
    evt.preventDefault();
    let href = (evt.currentTarget as HTMLAnchorElement).href;
    this.props.navigate(href);
  }

  private isNotFoundActive(): string {
    return !this.isValidPage(this.props.currentPage) ? 'active' : '';
  }

  private ensurePrivacyAgreement(): Promise<void> {
    if (this.props.user.hasAgreedToPrivacy()) {
      return Promise.resolve();
    }

    return new Promise<void>((res, rej) => {
      // To be called when user closes the privacy dialog.
      let onFinish = (didAgree: boolean): void => {
        this.setState({
          showingPrivacy: false,
          onPrivacyAction: undefined
        });

        if (didAgree) {
          this.props.user.agreeToPrivacy();
          res();
        } else {
          rej();
        }
      };

      this.setState({
        showingPrivacy: true,
        onPrivacyAction: onFinish
      });
    });
  }

  private uploadRecordings(recordings: any[],
                           sentences: string[],
                           progressCb: Function): Promise<void> {

    return new Promise<void>((res, rej) => {
      this.ensurePrivacyAgreement().then(() => {
        let runningTotal = 0;
        let originalTotal = recordings.length;

        // This function calls itself recursively until
        // all recordings are uploaded.
        let uploadNext = () => {
          if (recordings.length === 0) {
            this.props.api.uploadDemographicInfo().then(() => {
              return;
            });
            res();
            return;
          }

          let recording = recordings.pop();
          let blob = recording.blob;
          let sentence = sentences.pop();

          this.props.api.uploadAudio(blob, sentence).then(() => {
            runningTotal++;
            let percentage = Math.floor((runningTotal / originalTotal) * 100);
            progressCb && progressCb(percentage);
            this.props.user.tallyRecording();
            uploadNext();
          });
        };

        // Start the recursive chain to upload the recordings serially.
        uploadNext();
      }).catch(rej);
    }).then(() => {
      this.setState({
        robot: ''
      });
    });
  }

  componentDidMount() {
    this.scroller = document.getElementById('scroller');
    this.content = document.getElementById('content');
    this.header = document.querySelector('header');
    this.bg = document.getElementById('background-container');
    this.addScrollListener();
    this.setState({
      currentPage: this.props.currentPage,
    });
  }

  componentWillUpdate(nextProps: PagesProps) {
    // When the current page changes, hide the menu.
    if (nextProps.currentPage !== this.props.currentPage) {
      var self = this;
      this.content.addEventListener('transitionend', function remove() {
        self.content.removeEventListener('transitionend', remove);
        self.scroller.scrollTop = 0; // scroll back to the top of the page
        self.setState({
          currentPage: nextProps.currentPage,
          pageTransitioning: false,
          isMenuVisible: false
        });
      });

      this.setState({
        pageTransitioning: true
      });
    }
  }

  toggleMenu = () => {
    this.setState({ isMenuVisible: !this.state.isMenuVisible });
  }

  render() {
    
    let pageName = this.getCurrentPageName();
    let robotPosition = pageName === 'record' ? this.state.robot : pageName;
    let className = pageName;
    if (this.state.transitioning) {
      className += ' hiding';
    } else if (this.state.recording) {
      className += ' recording';
    }

    let bgStyle = '';
    if (this.state.recording) {
      let scale = Math.max(( 1.3 * (this.state.recorderVolume - 28) / 100 ), 0);
      bgStyle = 'transform: scaleY(' + scale + ');';
    }

    return <div id="main" className={className}>
      <div onClick={this.openInApp} id="install-app">Open in App
        <a onClick={this.closeOpenInApp}>X</a></div>
      <header className={(this.state.isMenuVisible || this.state.scrolled ?
                          'active' : '')}>        
        {this.renderLogo()}
        {this.renderUser()}
        <button id="hamburger-menu" onClick={this.toggleMenu}
          className={(this.state.isMenuVisible ? ' is-active' : '')}>
          <Icon type="hamburger" />
        </button>
        {this.renderNav('main-nav')}
      </header>
      <div id="scroller"><div id="scrollee">
        <div id="background-container" style={bgStyle}>{this.iOSBackground}</div>
        <div class="hero">
          <Robot position={(pageName === 'record' && this.state.robot) ||
                           pageName} onClick={page => {
            this.props.navigate('/' + page);
          //}}>{ROBOT_TALK[pageName]}</Robot> (Disable talking robot for now)
          }}></Robot>
        </div>
        <div class="hero-space"></div>
        <div id="content" className={this.state.pageTransitioning ?
                                     'transitioning': ''}>
          <Home active={this.isPageActive([URLS.HOME, URLS.ROOT])}
                navigate={this.props.navigate}
                api={this.props.api} user={this.props.user} />
          <Record active={this.isPageActive(URLS.RECORD)} api={this.props.api}
                  onRecord={this.onRecord}
                  onRecordStop={this.onRecordStop}
                  onRecordingSet={this.sayThanks}
                  onVolume={this.onVolume}
                  onSubmit={this.uploadRecordings}
                  onDelete={this.clearRobot}
                  navigate={this.props.navigate} user={this.props.user} />
          <Listen active={this.isPageActive(URLS.LISTEN)}
                  navigate={this.props.navigate}
                  api={this.props.api} user={this.props.user}/>
          <Profile user={this.props.user}
                   active={this.isPageActive(URLS.PROFILE)} />
          <FAQ active={this.isPageActive(URLS.FAQ)} />
          <Privacy active={this.isPageActive(URLS.PRIVACY)} />
          <Terms active={this.isPageActive(URLS.TERMS)} />
          <NotFound active={this.isNotFoundActive()} />
        </div>
        <footer>          
          <div id="moz-links">
	    <div class="content">
		   <img src="/img/pb.jpg" />  
		   <img src="/img/WelshGovtlogo.png" />
	    </div>
	    <div class="content">
		<p>
		    Ariannwyd project Paldaruo gan Llywodraeth Cymru.
		</p>
	    </div>
	    <div class="content">
		<p>
		    Rydyn ni'n diolch hefyd i S4C a Mozilla am eu cyfranniad at Paldaruo
		</p>
	    </div>
	    <div class="content">
		<p><br/>
		   Nid oes gan y wefan hon unrhyw gysylltiad &acirc; Mozilla.<br/>		
		</p>
	    </div>
	    <div class="content">
		<p>
		   Ewch i wefan <a href="http://voice.mozilla.org" style="color:white">Mozilla CommonVoice</a> i ddarllen mwy am 
		</p>
	    </div>
	    <div class="content">
		<p> 
		   uchelgais Mozilla i ddatblygu adnabod lleferydd cod agored.
		</p>
	    </div>
            <div class="content">
              <div class="links">
                <p>
                  <a onClick={this.linkNavigate} href="/privacy">Preifatrwydd</a>
                  <a onClick={this.linkNavigate} href="/terms">Telerau</a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div></div>
      <div id="navigation-modal"
           className={this.state.isMenuVisible && 'is-active'}>
      {this.renderNav()}
      </div>
      <div className={'overlay' + (this.state.showingPrivacy ? ' active' : '')}>
        <div class="privacy-content">
	  <h2>
	  Wrth defnyddio gwefan Paldaruo, rydych yn datgan eich bod wedi darllen a derbyn y <a target="_blank" href="/terms">Telerau</a> a&quot;r <a target="_blank" href="/privacy">Polisi Preifatrwydd</a>.
	  </h2>
          <div class="button-holder">
            <button onClick={e => { this.state.onPrivacyAction && this.state.onPrivacyAction(true); }}>Rwy&quot;n cytuno</button>
            <button onClick={e => { this.state.onPrivacyAction && this.state.onPrivacyAction(false); }}>Nid wyf yn cytuno</button>
          </div>
        </div>
      </div>
    </div>;
  }

  private renderTab(url: string, name: string) {
    let c = 'tab ' + name + ' ' + this.isPageActive(url, this.props.currentPage);
    return <a className={c}
              onClick={this.props.navigate.bind(null, url)}>
             <span className={'tab-name ' + name}>{name}</span>
           </a>;
  }

  private renderNav(id?: string) {
    if (!this.isUnsupportedPlatform) {
      return <nav id={id} className="nav-list">
      {this.renderTab('/', 'cartref')}
      {this.renderTab('/record', 'siarad')}
      {this.renderTab('/listen', 'gwrando')}
      {this.renderTab('/profile', 'proffil')}
      </nav>;
    } 
    
  }

  private renderUser() {
    if (!this.isUnsupportedPlatform) {
      return (
        <div id="tally-box">
          <span class="tally-recordings">
            Nifer o recordiadau: 
            {this.props.user.state.recordTally}
          </span>
          <span class="tally-verifications">
            Nifer wedi'u gwerthuso: 
            {this.props.user.state.validateTally}
          </span>
        </div>
      );
    }
  }

  private renderLogo() {
    if (!this.isUnsupportedPlatform){
      return (
        <Logo navigate={this.props.navigate}/>
      );
    }    
  }

}