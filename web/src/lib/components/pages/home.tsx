import { h, Component } from 'preact';
import Validator from '../validator';
import API from '../../api';
import User from '../../user';

interface Props {
  api: API;
  active: string;
  navigate(url: string): void;
  user?: User;
}

export default class Home extends Component<Props, void> {
  constructor(props) {
    super(props);
    this.onVote = this.onVote.bind(this);
  }

  onVote() {
    this.props.user && this.props.user.tallyVerification();
    this.props.navigate('/'); // force top level page render
  }

  render() {
    return <div id="home-container" className={this.props.active}>
      <div id="home-layout">
        <div className="left-column">
	  <h2>Beth yw adnabod lleferydd a pham Paldaruo?</h2>
	  <p>Mewn sawl sefyllfa erbyn hyn mae technolegau adnabod lleferydd yn caniat&aacute;u i ni 
	     siarad gyda'n cyfrifiaduron a'n dyfeisiau symudol fel iPhone neu iPad. Mae modd eu holi 
             ar lafar (e.e. Siri ar yr iPhone, neu Alexa gan Amazon) am wybodaeth neu i'w gorchymyn 
             i gyflawni tasg ar ein rhan, heb fod angen pwyso botymau a llywio dewislenni di-ri.</p><br/>
	  <p>Bydd y dull yma o ddefnyddio ein hoffer cyfrifiadurol yn dod yn fwyfwy cyffredin a naturiol 
	     wrth i adnabod lleferydd a thechnolegau iaith eraill ymledu i amrywiaeth o offer eraill o 
	     fewn y t&yacute;, y swyddfa a'n ddysfeisiadau personol.</p><br/>
	  <p>Y broblem fawr yw nad oes modd hyd yn hyn i ni siarad gyda'n cyfrifiaduron yn Gymraeg. 
	     Os ydyn ni eisiau i dechnolegau a gwasanaethau digidol newydd ein cynorthwyo drwy'r Gymraeg, 
	     mae'n bwysig datblygu technoleg adnabod lleferydd Cymraeg</p><br/>
	  <h2>Sut mae creu adnabod lleferydd?</h2>
    	  <p>Mae angen casglu nifer mawr o recordiadau o bob math o leisiau gwahanol yn siarad testun arbennig, 
	     wedi'i gynllunio i ddal pob cyfuniad o seiniau Cymraeg, er mwyn hyfforddi system adnabod lleferydd
             gyffredinol.</p><br/>
	  <p>Felly recordiwch eich llais ar ein cyfer a rhannwch yr wefan hwn gyda'ch holl deulu a 
	     ffrindiau sy'n medru siarad Cymraeg.</p><br/>    
	  <h2>Am wybodaeth bellach</h2>
    	  <p>Ewch i wefan y project i gael y diweddaraf am ein gwaith ar adnabod lleferydd i'r Gymraeg : 
	     <a href="http://http://techiaith.cymru/lleferydd/adnabod-lleferydd/">http://techiaith.cymru/lleferydd/adnabod-lleferydd/</a></p>	  
        </div>
        <div className="right-column">
          <p class="strong">Mae modd i chi helpu hefyd drwy gwrando a werthuso recordiadau eraill!</p>
          <img class="curved-arrow" src="/img/curved-arrow.png" />
          <img class="circle" src="/img/circle.png" />
        </div>
        <div id="donate">
          <button onClick={evt => {
            this.props.navigate('/record')}}>Cyfranwch eich lais!</button>
        </div>
      </div>
      <div id="try-it-container">
        <h1>Rhowch gynnig arni..</h1>
        <p id="help-home" class="strong">Helpwch ni werthuso recordiadau.</p>
	<br/>
        <Validator onVote={this.onVote} api={this.props.api} />
      </div>
    </div>;
  }
}
