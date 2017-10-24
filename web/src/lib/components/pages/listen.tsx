import { h, Component } from 'preact';
import { Clip, default as API } from '../../api';
import Validator from '../validator';
import User from '../../user';

interface ListenPageProps {
  user: User;
  api: API;
  active: string;
  navigate(url: string): void;
}

export default class Listen extends Component<ListenPageProps, void> {
  constructor(props) {
    super(props);
    this.onVote = this.onVote.bind(this);
  }

  onVote() {
    this.props.user.tallyVerification();
    this.props.navigate('/listen'); // force page render
  }

  render() {
    return <div id="listen-container" className={this.props.active}>
    <div id="listen-layout">
    	<h2>Sut ddylwn i farcio?</h2>
    	<p>
		Does dim ots os nad ydi'r ynganu yn dda iawn yn eich barn chi - marciwch bopeth sy'n darllen y tesun 
		yn gywir yn 'Ie!'. Ond os ydyn nhw'n dweud rhywbeth sydd ddim yn y testun, neu yn darllen y geiriau 
		yn y drefn anghywir, neu yn ailadrodd geiriau, yna marciwch nhw fel 'Na.'.
    	</p>

        <Validator onVote={this.onVote} api={this.props.api} />
    </div>	
    </div>;
  }
}
