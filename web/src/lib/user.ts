import { generateGUID } from './utility';
import Tracker from './tracker';

const USER_KEY = 'userdata';

export const AGES = {
  '': '--',
  'teens': '< 19',
  'twenties': '19 - 29',
  'thirties': '30 - 39',
  'fourties': '40 - 49',
  'fifties': '50 - 59',
  'sixties': '60 - 69',
  'seventies': '70 - 79',
  'eighties': '80 - 89',
  'nineties': '> 89',
};

export const GENDER = {
  '': '--',
  'male': 'Gwryw',
  'female': 'Benyw',
  'other': 'Arall'
};

export const ACCENTS = {
   '':'--',
   'iaithgyntaf': 'Acen Iaith Gyntaf',
   'dysgwr': 'Acen Dysgwr',
};

export const REGIONALACCENTS = {
   '':'--',
   'd_dd': 'De Ddwyrain',
   'd_o': 'De Orllewin',
   'g_dd': 'Gogledd Ddwyrain',
   'g_o': 'Gogledd Orllewin',
   'cb': 'Canolbarth',
   'c': 'Acen gymysg/Arall',
};

export const CONTEXT = {
   '':'--',
   'dim': 'Ddim yn siarad Cymraeg yn rheolaidd',
   'g': 'Gartref yn unig',
   'y': 'Ysgol/coleg/gwaith yn unig',
   'ff': 'Gyda ffrindiau yn unig',
   'g_y': 'Gartref + Ysgol/coleg/gwaith',
   'g_ff': 'Gartref + Ffrindiau',
   'y_ff': 'Ysgol/coleg/gwaith + Ffrindiau',
   'g_y_ff': 'Gartref + Ysgol/coleg/gwaith + Ffrindiau',
   'a': 'Arall',
};

export const FREQUENCY = {
   'dim': 'Llai nag awr y mis',
   'mis': 'O leiaf awr y mis',
   'wythnos': 'O leiaf awr yr wythnos',
   'dydd': 'O leiaf awr y dydd',
   'hanner': 'Tua hanner yr amser',
   'rhanfwyaf': "Rhan fwyaf o'r amser",
   'trwyramser': 'Bron yn ddieithriad',
};

export const HOMEREGION = {
   'd_dd': 'De Ddwyrain Cymru',
   'd_o': 'De Orllewin Cymru',
   'g_dd': 'Gogledd Ddwyrain Cymru',
   'g_o': 'Gogledd Orllewin Cymru',
   'c': 'Canolbarth Cymru',
   'g_ll': 'Gogledd Lloegr',
   'c_ll': 'Canolbarth Lloegr',
   'd_ll': 'De Lloegr',
   'a': 'Gwlad arall',
   'n': 'Nifer o ardaloedd',
};

export const CHILDHOOD = {
   'd_dd': 'De Ddwyrain Cymru',
   'd_o': 'De Orllewin Cymru',
   'g_dd': 'Gogledd Ddwyrain Cymru',
   'g_o': 'Gogledd Orllewin Cymru',
   'c': 'Canolbarth Cymru',
   'g_ll': 'Gogledd Lloegr',
   'c_ll': 'Canolbarth Lloegr',
   'd_ll': 'De Lloegr',
   'a': 'Gwlad arall',
   'n': 'Nifer o ardaloedd',
};


interface UserState {
  userId: string;
  email: string;
  sendEmails: boolean;
  accent: string;
  age: string;
  gender: string;
  childhood: string;
  school: string;
  homeregion: string;
  frequency: string;
  context: string;
  regionalaccent: string;
  clips: number;
  privacyAgreed: boolean;
  recordTally: number;
  validateTally: number;
}


/**
 * User tracking
 */
export default class User {

  state: UserState;
  tracker: Tracker;

  constructor() {
    this.tracker = new Tracker();
    this.restore();
  }

  private restore(): void {
    try {
      this.state = JSON.parse(this.getStore());
    } catch (e) {
      console.error('failed parsing storage', e);
      localStorage.removeItem(USER_KEY);
      this.state = null;
    }

    if (!this.state) {
      this.state = {
        userId: generateGUID(),
        email: '',
        sendEmails: false,
        accent: '',
        age: '',
        gender: '',
  	childhood: '',
  	school: '',
  	homeregion: '',
  	frequency: '',
  	context: '',
        regionalaccent: '',
        clips: 0,
        privacyAgreed: false,
        recordTally: 0,
        validateTally: 0
      };
      this.save();
    }
  }

  private getStore(): string {
    return localStorage && localStorage.getItem(USER_KEY);
  }

  private save(): void {
    localStorage && (localStorage[USER_KEY] = JSON.stringify(this.state));
  }

  public getId(): string {
    return this.state.userId;
  }

  public setEmail(email: string): void {
    this.state.email = email;
    this.save();
    this.tracker.trackGiveEmail();
  }

  public setSendEmails(value: boolean): void {
    this.state.sendEmails = value;
    this.save();
  }

  public setAccent(accent: string): void {
    if (!ACCENTS[accent]) {
      console.error('cannot set unrecognized accent', accent);
      return;
    }
    this.state.accent = accent;
    this.save();
    this.tracker.trackGiveAccent();
  }

  public setRegionalAccent(regionalaccent: string): void {
    if (!REGIONALACCENTS[regionalaccent]) {
      console.error('cannot set unrecognized regionalaccent', regionalaccent);
      return;
    }
    this.state.regionalaccent = regionalaccent;
    this.save();
    this.tracker.trackGiveRegionalAccent();
  }

  public setAge(age: string): void {
    if (!AGES[age]) {
      console.error('cannot set unrecognized age', age);
      return;
    }
    this.state.age = age;
    this.save();
    this.tracker.trackGiveAge();
  }

  public setGender(gender: string): void {
    if (!GENDER[gender]) {
      console.error('cannot set unrecognized gender', gender);
      return;
    }
    this.state.gender = gender;
    this.save();
    this.tracker.trackGiveGender();
  }

  public setChildhood(childhood: string): void {
    if (!CHILDHOOD[childhood]) {
      console.error('cannot set unrecognized childhood', childhood);
      return;
    }
    this.state.childhood = childhood;
    this.save();
    this.tracker.trackGiveChildhood();
  }

  public setHomeRegion(homeregion: string): void {
    if (!HOMEREGION[homeregion]) {
      console.error('cannot set unrecognized homeregion', homeregion);
      return;
    }
    this.state.homeregion = homeregion;
    this.save();
    this.tracker.trackGiveHomeRegion();
  }

  public setSchool(school: string): void {
    this.state.school = school;
    this.save();
    this.tracker.trackGiveSchool();
  }

  public setFrequency(frequency: string): void {
    if (!FREQUENCY[frequency]) {
      console.error('cannot set unrecognized frequency', frequency);
      return;
    }
    this.state.frequency = frequency;
    this.save();
    this.tracker.trackGiveFrequency();
  }

  public setContext(context: string): void {
    if (!CONTEXT[context]) {
      console.error('cannot set unrecognized context', context);
      return;
    }
    this.state.context = context;
    this.save();
    this.tracker.trackGiveContext();
  }

  public getState(): UserState {
    return this.state;
  }

  public hasAgreedToPrivacy() {
    return this.state.privacyAgreed;
  }

  public agreeToPrivacy() {
    this.state.privacyAgreed = true;
    this.save();
  }

  public tallyRecording() {
    this.state.recordTally = this.state.recordTally || 0;
    this.state.recordTally++
    this.save();
  }

  public tallyVerification() {
    this.state.validateTally = this.state.validateTally || 0;
    this.state.validateTally++
    this.save();
  }

}
