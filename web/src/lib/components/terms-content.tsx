import { h, Component } from 'preact';

interface Props {
}

interface State {
}

export default class PrivacyContent extends Component<Props, State> {
  render() {
    // @todo - cyfieithu
    return <div class="terms-content">	
	<h1>TELERAU AC AMODAU PALDARUO</h1>
	<h3>Cyflwyniad</h3>
	<p>Mae’r testun canlynol yn rhoi’r telerau a’r amodau i chi gymryd rhan yn y project Paldaruo i dorfoli recordiadau o leferydd Cymraeg.</p>
	<h3>Privacy</h3>
	<p>Mae ein <a href="/privacy">Hysbysiad Preifatrwydd</a> yn esbonio sut ydym yn derbyn ac yn trin eich data.</p>
	<h3>Cymhwystra</h3>
	<p>Rydym yn ofalus iawn am ddiogelwch data defnyddwyr ap Paldaruo, yn enwedig plant. Dylai plant o dan 17 oed cael caniatâd gan rieni/gwarcheidwaid cyn defnyddio’r ap Paldaruo. Hefyd dylai rhieni/ gwarcheidwaid sy’n caniatáu i’w plentyn ddefnyddio’r ap oruchwylio hynny’n ofalus. Drwy ganiatáu i’ch plentyn gael defnyddio’r ap Paldaruo, rydych chi’n caniatáu i’ch plentyn anfon eu recordiadau a metadata atom.</p>
	<h3>Eich Cyfraniad a Rhyddhau Hawliau</h3>
	<p>Wrth i chi ddefnyddio’r ap Paldaruo, bydd recordiadau o’ch llais yn cael eu llwytho i fyny i’w cadw ar ein gweinyddion. Gall y recordiadau gael eu defnyddio yn y dyfodol ar gyfer ymchwil academaidd, datblygu systemau adnabod lleferydd ac offer iaith tebyg.</p>
	<p>Drwy gyflwyno eich recordiadau, rydych chi’n ildio pob hawl hawlfraint a hawliau cysylltiedig y gall fod gennych ynddyn nhw, ac rydych chi’n cytuno i ryddhau’r recordiadau i’r cyhoedd eu defnyddio. Ystyr hyn yw eich bod yn rhoi’r gorau i bob hawl i’r recordiadau drwy’r byd i gyd dan gyfraith hawlfraint a chronfeydd data, gan gynnwys hawliau moesol a chyhoeddusrwydd a phob hawl perthynol neu gyfagos.</p>      	
        <h3>Gohebiaeth</h3>
	<p>Os hoffech chi dderbyn rhagor o newyddion am y project, yna rhowch eich cyfeiriad e-bost i ni. Ni fydd cysylltiad rhwng y recordiadau a’r cyfeiriadau e-bost ac felly ni fydd yn bosibl adnabod cyfranwyr unigol</p>
	<h3>Cyffredinol</h3>
	<p>Gall y telerau hyn newid dros amser, ac os digwydd hynny, byddwn yn dweud wrthych ac yn gofyn i chi ddarllen a derbyn y telerau defnydd unwaith eto.</p>
	<p>Drwy glicio ar y botwm "Anfon" rydych chi yn caniatáu i’ch recordiadau a’ch data gael eu danfon at ein gweinyddion ar gyfer holl ddibenion project Paldaruo.</p>
	
	<hr/>

	<h1 id="english">PALDARUO TERMS AND CONDITIONS</h1>
	<h3>Introduction</h3>
	<p>The following text sets the terms and conditions for your participation in the Paldaruo project for crowd-sourcing recordings of Welsh language speech.</p>
	<h3>Privacy</h3>
	<p>Our <a href="/privacy">Privacy Notice</a> explains how we receive and handle your data.</p>
	<h3>Eligibility</h3>
	<p>We are very careful about the safety of contributors data, especially children. Children under 17 years old should have consent from a parent/ guardian before using the Paldaruo website to submit their recordings. Also, parents / guardians who consent to their children using the website should supervise them carefully. Through consenting to your child using the Paldaruo website, you consent to your child sending their recordings and metadata to us.</p>
	<h3>Your Contributions and Release of Rights</h3>
	<p>While you are using the Paldaruo website, recordings of your voice will be uploaded and kept on our servers. The recordings can be used in the future for academic research, developing speech recognition systems and similar language equipment in the future.</p>
      	<p>By submitting your recordings, you waive all copyrights and related rights that you may have in them, and you agree to release the recordings for public consumption. This means that you agree to waive all rights to the recordings worldwide under copyright and database law, including moral and publicity rights and all related and neighboring rights.</p>
        <h3>Communications</h3>
	<p>If you would like further news of the project you can provide us with your email address. There will be no connection between the recordings and email addresses so it will not be possible to identify individual contributors.</p>
	<h3>General</h3>
	<p>These terms can change from time to time. If this happens, we will inform you and ask you to read and accept the user terms once again.</p>
	<p>Through clicking the "Anfon" (Submit) button, you consent to your recordings and data being sent to our servers and used for all the aims of the Paldaruo project.</p>
    </div>;
  }
}
