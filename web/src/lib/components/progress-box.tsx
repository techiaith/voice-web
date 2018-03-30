import { h, Component } from 'preact';
import Tracker from '../tracker';

interface Props {
  recorded?: string;
  not_recorded?: string;
  onStartTraining?(): void;
}

interface State {
  readyForTraining: boolean;  
}

/**
 * Widget for recording progress
 */
export default class RecordingProgressBox extends Component<Props, State> {
  
  tracker: Tracker;

  constructor(props: Props) {
    super(props);
    this.tracker = new Tracker();
  }

  state = {
    readyForTraining: false
  };

  private resetState() {
    this.setState({
      readyForTraining: false      
    });
  }


  render() {
    return <div className={'progress-box'}>
      <div className="recordings-completed-box">
          Nifer o bromtiau wedi'u recordio: <span>{this.props.recorded}</span>
      </div>
      <div className="recordings-not-completed-box">
          Nifer o bromtiau heb eu recordio: <span>{this.props.not_recorded}</span>
      </div>      
    </div>;
  }

  
}
