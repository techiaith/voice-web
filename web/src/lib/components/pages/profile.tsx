import { h, Component } from 'preact';
import { ACCENTS, REGIONALACCENTS, AGES, GENDER, HOMEREGION, CONTEXT, FREQUENCY, CHILDHOOD, default as User } from '../../user';

interface Props {
  user: User;
  active: string;
}

interface State {
  age: string;
  gender: string;
  childhood: string;
  school: string;
  homeregion: string;
  frequency: string;
  context: string;
  accent: string;
  regionalaccent: string;
  //email: string;
}

export default class Profile extends Component<Props, State> {
  constructor(props) {
    super(props);

    let user = this.props.user.getState();
    this.state = {
      accent: user.accent,
      age: user.age,
      gender: user.gender,
      childhood: user.childhood, 
      school: user.school,
      homeregion: user.homeregion,
      context: user.context,
      regionalaccent: user.regionalaccent,
      frequency: user.frequency      
    }

    this.saveDemographics = this.saveDemographics.bind(this);
    this.update = this.update.bind(this);
  }


  private saveDemographics() {
 
    let el = document.getElementById('profile-accent') as HTMLSelectElement;
    let accent = el.options[el.selectedIndex].value;
    this.props.user.setAccent(accent);

    el = document.getElementById('profile-age') as HTMLSelectElement;
    let age = el.options[el.selectedIndex].value;
    this.props.user.setAge(age);

    el = document.getElementById('profile-gender') as HTMLSelectElement;
    let gender = el.options[el.selectedIndex].value;
    this.props.user.setGender(gender);

    el = document.getElementById('profile-childhood') as HTMLSelectElement;
    let childhood = el.options[el.selectedIndex].value;
    this.props.user.setChildhood(childhood);

    let sel = document.getElementById('profile-school') as HTMLInputElement;
    let school = sel.value;
    this.props.user.setSchool(school);

    el = document.getElementById('profile-homeregion') as HTMLSelectElement;
    let homeregion = el.options[el.selectedIndex].value;
    this.props.user.setHomeRegion(homeregion);

    el = document.getElementById('profile-context') as HTMLSelectElement;
    let context = el.options[el.selectedIndex].value;
    this.props.user.setContext(context);

    el = document.getElementById('profile-regionalaccent') as HTMLSelectElement;
    let regionalaccent = el.options[el.selectedIndex].value;
    this.props.user.setRegionalAccent(regionalaccent);
    
    el = document.getElementById('profile-frequency') as HTMLSelectElement;
    let frequency = el.options[el.selectedIndex].value;
    this.props.user.setFrequency(frequency);

    this.setState({
      accent: accent,
      age: age,
      gender: gender,
      childhood: childhood, 
      school: school,
      homeregion: homeregion,
      context: context,
      regionalaccent: regionalaccent,
      frequency: frequency   
    });

    this.render();
  }

  private update() {
 
    let user = this.props.user.getState();

    let select = document.getElementById('profile-accent') as HTMLSelectElement;
    let accent = select.options[select.selectedIndex].value;

    select = document.getElementById('profile-age') as HTMLSelectElement;
    let age = select.options[select.selectedIndex].value;

    select = document.getElementById('profile-gender') as HTMLSelectElement;
    let gender = select.options[select.selectedIndex].value;

    select = document.getElementById('profile-childhood') as HTMLSelectElement;
    let childhood = select.options[select.selectedIndex].value;

    let sel = document.getElementById('profile-school') as HTMLInputElement;
    let school = sel.value;

    select = document.getElementById('profile-homeregion') as HTMLSelectElement;
    let homeregion = select.options[select.selectedIndex].value;

    select = document.getElementById('profile-context') as HTMLSelectElement;
    let context = select.options[select.selectedIndex].value;

    select = document.getElementById('profile-regionalaccent') as HTMLSelectElement;
    let regionalaccent = select.options[select.selectedIndex].value;

    select = document.getElementById('profile-frequency') as HTMLSelectElement;
    let frequency = select.options[select.selectedIndex].value;

    this.setState({
      accent: accent,
      age: age,
      gender: gender,
      childhood: childhood, 
      school: school,
      homeregion: homeregion,
      context: context,
      regionalaccent: regionalaccent,
      frequency: frequency 
    });
  }

  render() {

    let user = this.props.user.getState();

    // Check for modified form fields.
    let accentModified = this.state.accent !== user.accent;
    let ageModified = this.state.age !== user.age;
    let genderModified = this.state.gender !== user.gender;
    
    let childhoodModified = this.state.childhood !== user.childhood;
    let schoolModified = this.state.school !== user.school;
    let homeregionModified = this.state.homeregion !== user.homeregion;
    let contextModified = this.state.context !== user.context;
    let regionalaccentModified = this.state.regionalaccent !== user.regionalaccent;
    let frequencyModified = this.state.frequency !== user.frequency;

    let accentOptions = [];
    Object.keys(ACCENTS).forEach(accent => {
      accentOptions.push(
        <option value={accent} selected={this.state.accent === accent}>
          {ACCENTS[accent]}
        </option>);
    });

    let ageOptions = [];
    Object.keys(AGES).forEach(age => {
      ageOptions.push(
        <option value={age} selected={this.state.age === age}>
          {AGES[age]}
        </option>);
    });

    let genderOptions = [];
    Object.keys(GENDER).forEach(gender => {
      genderOptions.push(
        <option value={gender} selected={this.state.gender === gender}>
          {GENDER[gender]}
        </option>);
    });

    let childhoodOptions = [];
    Object.keys(CHILDHOOD).forEach(childhood => {
      childhoodOptions.push(
        <option value={childhood} selected={this.state.childhood === childhood}>
          {CHILDHOOD[childhood]}
        </option>);
    });
      
    let homeregionOptions = [];
    Object.keys(HOMEREGION).forEach(homeregion => {
      homeregionOptions.push(
        <option value={homeregion} selected={this.state.homeregion === homeregion}>
          {HOMEREGION[homeregion]}
        </option>);
    });

    let contextOptions = [];
    Object.keys(CONTEXT).forEach(context => {
      contextOptions.push(
        <option value={context} selected={this.state.context === context}>
          {CONTEXT[context]}
        </option>);
    });

    let regionalaccentOptions = [];
    Object.keys(REGIONALACCENTS).forEach(regionalaccent => {
      regionalaccentOptions.push(
        <option value={regionalaccent} selected={this.state.regionalaccent === regionalaccent}>
          {REGIONALACCENTS[regionalaccent]}
        </option>);
    });

    let frequencyOptions = [];
    Object.keys(FREQUENCY).forEach(frequency => {
      frequencyOptions.push(
        <option value={frequency} selected={this.state.frequency === frequency}>
          {FREQUENCY[frequency]}
        </option>);
    });


    return <div id="profile-container" className={this.props.active}>

      <h2>Demographic Data</h2>

      <label for="profile-age"> * Beth yw'ch oedran?</label>
      <select onChange={this.update} id="profile-age"
              className={ageModified ? 'unsaved': ''}>
        {ageOptions}
      </select>

      <br />

      <label for="profile-gender"> * Beth yw'ch rhyw?</label>
      <select onChange={this.update} id="profile-gender"
              className={genderModified ? 'unsaved': ''}>
        {genderOptions}
      </select>

      <br />

      <label for="profile-childhood"> * Ym mha ranbarth treuliasoch chi'r rhan fwyaf o'ch plentyndod?</label>
      <select onChange={this.update} id="profile-childhood"
	       className={childhoodModified ? 'unsaved': ''}>
	{childhoodOptions}
      </select>

      <br />

      <label for="profile-school">Enwch eich ysgol uwchradd olaf. 
	<br/><em>Os nad ydych chi wedi mynd i'r ysgol uwchradd, rhowch 'dim'</em>
      </label>
      <br />
      <input onKeyUp={this.update} id="profile-school"
	 	className={schoolModified ? 'unsaved': ''}
		value={this.state.school}/>

      <br/>
      <br/>

      <label for="profile-homeregion"> * Ble rydych chi'n byw ar hyn o bryd?</label>
      <select onChange={this.update} id="profile-homeregion"
	       className={homeregionModified ? 'unsaved': ''}>
	{homeregionOptions}
      </select>

      <br />

      <label for="profile-frequency"> * Fel arfer, pa mor aml ydych chi'n siarad Cymraeg?</label>
      <select onChange={this.update} id="profile-frequency"
	       className={frequencyModified ? 'unsaved': ''}>
	{frequencyOptions}
      </select>

      <br />

      <label for="profile-context"> * Ym mha gyd-destun rydych chi’n siarad Cymraeg? 
	<br/><em>Dewiswch y cyd-destunau ble rydych chi'n siarad Cymraeg unwaith yr wythnos neu fwy</em>
      </label>
      <select onChange={this.update} id="profile-context"
	       className={contextModified ? 'unsaved': ''}>
	{contextOptions}
      </select>

      <br />

      <label for="profile-accent"> * Ydych chi’n siarad Cymraeg gydag acen iaith gyntaf?
	<br/><em>Atebwch 'Iaith Gyntaf' os os gennych chi acen iaith gyntaf, neu 'Dysgwr' os oes gennych chi acen dysgwr</em>
      </label>
      <select onChange={this.update} id="profile-accent"
              className={accentModified ? 'unsaved': ''}>
        {accentOptions}
      </select>

      <br />

      <label for="profile-regionalaccent"> * Acen pa ranbarth sydd gennych chi?
	<br/><em>Dewiswch yr ardal mae'ch acen yn dod ohoni (hyd yn oed os ydych chi'n byw yn rhywle arall)</em>
      </label>
      <select onChange={this.update} id="profile-regionalaccent"
              className={regionalaccentModified ? 'unsaved': ''}>
        {regionalaccentOptions}
      </select>

      <br />

      <button id="save-demos" onClick={this.saveDemographics}
        className={accentModified || ageModified || genderModified ?
          'dark highlight': 'dark'}>
        Save changes
      </button>
    </div>;
  }
}
