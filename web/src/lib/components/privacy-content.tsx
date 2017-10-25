import { h, Component } from 'preact';

interface Props {
}

interface State {
}

export default class PrivacyContent extends Component<Props, State> {
  render() {
    // @todo - cyfieithu
    return <div class="privacy-content">
      <h1>Datganiad Preifatrwydd Paldaruo</h1>
      <ul>
	<li><b>Meicrophone.</b>Ni fydd gwefan Paldaruo yn recordio heb i 
	    chi ganiatáu iddo gael mynediad at feicroffon eich cyfrifiadur ac 
 	    i chi glicio ar y botymau priodol i gychwyn recordio. Bydd gwefan
	    Paldaruo bob tro yn rhoi gwybod pryd mae’n recordio.</li>
	<li><b>Data Proffil.</b>Mae gwefan Paldaruo yn gofyn i chi fewnbynnu 
	    manylion am eich cefndir daearyddol, acen, oed a rhyw er mwyn eu 
            cysylltu â recordiadau. 
	    <br/>Mae eich hawliau o ran cyfrannu yn ddienw a 
            chadw cyfrinachedd yn bwysig iawn i ni ac ni fydd unrhyw fodd i adnabod 
            cyfranwyr unigol o’r data y byddwn yn casglu. Ni fydd gwefan Paldaruo 
            yn gofyn am eich enw a chyfeiriad o gwbl. Bydd yn clustnodi ac yn 
            defnyddio rhif adnabod unigryw ar eich cyfer.</li>
	<li><b>Recordiadau Llais</b> Efallai y bydd y recordiadau llais, gydag 
	    unrhyw ddata demograffig cysylltiedig, ar gael yn gyhoeddus yng nghronfa 
	    ddata Paldaruo at ddefnydd pawb.</li>
	<li><b>Data rhyngweithio.</b> Rydyn ni’n defnyddio Google Analytics i ddeall yn well 
	    sut rydych chi’n rhyngweithio gyda gwefan Paldaruo. Er enghraifft, mae hyn 
	    yn cynnwys y nifer o samplau llais rydych chi’n recordio neu’n gwrando 
	    arnyn nhw, rhyngweithiadau gyda botymau a dewislenni, a hyd sesiynau.</li>
	<li><b>Data technegol. </b>Gan ddefnyddio Google Analytics, rydyn ni’n casglu URL a 
	    theitl y tudalennau Paldaruo rydych chi’n ymweld â nhw. Rydyn ni’n casglu 
	    manylion eich porwr, maint sgrin eich dyfais, a cydraniad eich sgrin. Rydym 
	    hefyd yn casglu eich lleoliad, a gosodiadau iaith eich porwr.</li>
      </ul>

      <hr />

      <h1>Paldaruo Privacy Notice</h1>
      <ul>
	<li><b>Microphone.</b>The Paldaruo website will not record 
	    without you consenting to it having access to your device's 
            microphone and pressing the record buttons to start recording. 
            The Paldaruo website will always let you know when it is 
            recording.</li>
        <li><b>Demographic data.</b>The Paldaruo website will ask you to send
            us information such as your geographical background, accent, 
	    age and gender. This helps us and other researchers improve 
	    and create speech-to-text technology and tools.
	    <br/>Your rights with respect to contributing are anonymous 
	    and maintaining confidentiality is very important to us: there 
            will not be a way to identify individual contributors from the 
            data that we are collecting. The Paldaruo website will not ask 
            for your name or address. It will assign and use a unique 
            identification number on your behalf.</li>        
        <li><b>Voice Recordings.</b>Voice recordings, along with any
            associated demographic data, may be available in the
            Paldaruo database for public consumption and use.</li>
        <li><b>Interaction data.</b>We use Google Analytics to better
            understand how you interact with the Paldaruo website.  
	    For example, this includes number of voice samples
            you record or listen to, interactions with buttons and menus,
            session length.</li>
        <li><b>Technical data.</b>Using Google Analytics, we collect the
            URL and title of the Paldaruo pages you visit. We collect
            your browser, viewport size, and screen resolution. We also
            collect your location, and the language setting in your
            browser.</li>
      </ul>
    </div>;

  }
}




