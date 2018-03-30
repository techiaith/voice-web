import { h, Component } from 'preact';
import RecordingProgressBox from './progress-box';
import { RecordingProgressJson, default as API } from '../api';
import User from '../user';
import confirm from './confirm';

interface Props {
  api: API;
  user: User;
  onStartTraining?(): void;
}

interface State {
  recorded: string;
  not_recorded: string;
  disabled: boolean;
}

/**
 * Widget for validating voice clips.
 */
export default class RecordingProgressComponent extends Component<Props, State> {
  uid: string;
  constructor(props) {
    super(props);
    
    this.onGenerateVoice = this.onGenerateVoice.bind(this);
    this.loadRecordingProgress();       

  }

  private onGenerateVoice() {
    return confirm("Ydych chi'n siŵr?", 'Ydw', 'Nac ydw').then((result) => {
      if (result==true){          
        this.props.api.generateVoice().then(() => {        
        }).catch((err) => {
          alert(err);
          console.error('could not generate voice', err);
        });
      }         
    });    
  }

  private loadRecordingProgress() {
    
    this.props.api.getRecordingsProgress()
    .then(recordings => {

      var recorded = parseInt(recordings.recorded);
      var notrecorded = parseInt(recordings.notrecorded);

      var disabled = true;

      if (notrecorded == 0) {
         disabled = false;
      }

      this.setState({
        recorded: recordings.recorded,
        not_recorded: recordings.notrecorded,
        disabled: disabled
      });      
    }, (err) => {
      console.error('could not fetch recording status', err);
      this.setState({
        recorded: null,
        not_recorded: null,
        disabled: true
      });
    });
  }

  render() {

    return <div class="progress">
      
      <RecordingProgressBox recorded={this.state.recorded} not_recorded={this.state.not_recorded} />
      
      <button id="generate-button" disabled={this.state.disabled} onClick={this.onGenerateVoice}>Cynhyrchu fy llais synthetig / Generate my synthetic voice</button>

      <br/><br/>

      <p id="try-it-container">
      Ar ôl glicio ar y botwm cynhyrchu, bydd eich llais synthetig yn caei ei gynhyrchu ar ein gweinydd a bydd ar gael mewn tua hanner awr.
      <br/><em>Clicking on the generate button will start generating your synthetic voice on our servers and will be available in about half an hour.</em>

      <br/><br/>

      <br/>Cysylltwch â ni os nad yw eich llais synthetig yn gweithio ar ôl awr.
      <br/><em>Please contact us if your voice still isn't working after an hour.</em>
      </p>

    </div>;
  }
}
