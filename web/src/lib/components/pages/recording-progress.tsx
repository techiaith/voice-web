import { h, Component } from 'preact';
import { RecordingProgressJson, default as API } from '../../api';
import RecordingProgressComponent from '../progress-recordings';
import User from '../../user';
import confirm from '../confirm';

interface RecordingProgressPageProps {
  active: string;
  user: User;
  api: API;
  //navigate(url: string): void;
}

export default class RecordingProgress extends Component<RecordingProgressPageProps, void> {
  constructor(props) {
    super(props);
    //this.onVote = this.onVote.bind(this);
  }

  // onVote() {
  //   this.props.user.tallyVerification();
  //   this.props.navigate('/listen'); // force page render
  // }

  render() {
    return <div id="recordingprogress-container" className={this.props.active} >
    <div id="recordprogress-layout">
    	<h1>Faint ydw i wedi recordio hyd yn hyn?</h1>    
      <RecordingProgressComponent  api={this.props.api} user={this.props.user} />
    </div>	
    </div>;
  }
}
